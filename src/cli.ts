import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  failMessage,
  generateQr,
  parseQrRequest,
  type QrFailure,
  type QrRequest,
} from "./generate.js";
import { startMcpServer } from "./mcp.js";

const HELP = `useqr-mcp. Static QR codes for agents. No API key.

Generate a PNG:
  npx -y useqr-mcp generate --data https://example.com --out code.png

Generate SVG on stdout:
  npx -y useqr-mcp generate --data https://example.com --format svg

Start the MCP stdio server (default when you pass no args, or pass mcp):
  npx -y useqr-mcp

Cursor / Claude stdio install:
{
  "mcpServers": {
    "useqr": {
      "command": "npx",
      "args": ["-y", "useqr-mcp"]
    }
  }
}

Hosted MCP (no secrets):
{
  "mcpServers": {
    "useqr": {
      "url": "https://useqr.co/api/mcp"
    }
  }
}

generate flags:
  --data <text>                 required payload
  --format png|svg              default png
  --out <file>                  write to a file instead of stdout
  --size <n>                    128-2048, default 512
  --foreground <#hex>           default #0a0a0a
  --background <#hex>           default #ffffff
  --error-correction L|M|Q|H    default M

This package is not the UseQR product app. No accounts, no billing, no dynamic /r/{code} minting.
Designer and dynamic codes: https://useqr.co
`;

async function main(argv: string[]): Promise<void> {
  const args = argv.slice(2);
  const command = args[0];

  if (command === undefined || command === "mcp") {
    await startMcpServer();
    return;
  }

  if (command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(HELP);
    return;
  }

  if (command === "generate") {
    await runGenerate(args.slice(1));
    return;
  }

  process.stderr.write(`unknown command: ${command}\n`);
  process.exitCode = 1;
}

async function runGenerate(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }

  const flags = parseFlags(args);
  if (flags.data === undefined) {
    process.stderr.write(`${failMessage("empty")}\n`);
    process.exitCode = 1;
    return;
  }
  if (
    flags.format !== undefined &&
    flags.format !== "png" &&
    flags.format !== "svg"
  ) {
    process.stderr.write("bad_format\n");
    process.exitCode = 1;
    return;
  }
  if (
    flags.errorCorrection !== undefined &&
    flags.errorCorrection !== "L" &&
    flags.errorCorrection !== "M" &&
    flags.errorCorrection !== "Q" &&
    flags.errorCorrection !== "H"
  ) {
    process.stderr.write("bad_error_correction\n");
    process.exitCode = 1;
    return;
  }

  const parsed = parseQrRequest({
    data: flags.data,
    format: flags.format,
    size: flags.size,
    foreground: flags.foreground,
    background: flags.background,
    errorCorrection: flags.errorCorrection,
  });
  if (isFailure(parsed)) {
    process.stderr.write(`${failMessage(parsed.reason)}\n`);
    process.exitCode = 1;
    return;
  }

  const result = await generateQr(parsed);
  const outPath = flags.out;
  if (result.format === "png") {
    if (outPath === undefined) {
      process.stdout.write(result.bytes);
      return;
    }
    await writeOutput(outPath, result.bytes);
    return;
  }
  if (outPath === undefined) {
    process.stdout.write(result.markup);
    if (!result.markup.endsWith("\n")) {
      process.stdout.write("\n");
    }
    return;
  }
  await writeOutput(outPath, result.markup);
}

type CliFlags = {
  data?: string;
  format?: string;
  out?: string;
  size?: number;
  foreground?: string;
  background?: string;
  errorCorrection?: string;
};

function parseFlags(args: string[]): CliFlags {
  const flags: CliFlags = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === undefined) {
      break;
    }
    const value = args[i + 1];
    switch (token) {
      case "--data":
        flags.data = requireValue(token, value);
        i += 1;
        break;
      case "--format":
        flags.format = requireValue(token, value);
        i += 1;
        break;
      case "--out":
        flags.out = requireValue(token, value);
        i += 1;
        break;
      case "--size": {
        const raw = requireValue(token, value);
        const size = Number(raw);
        flags.size = Number.isFinite(size) ? size : Number.NaN;
        i += 1;
        break;
      }
      case "--foreground":
        flags.foreground = requireValue(token, value);
        i += 1;
        break;
      case "--background":
        flags.background = requireValue(token, value);
        i += 1;
        break;
      case "--error-correction":
        flags.errorCorrection = requireValue(token, value);
        i += 1;
        break;
      default:
        process.stderr.write(`unknown flag: ${token}\n`);
        process.exit(1);
    }
  }
  return flags;
}

function requireValue(flag: string, value: string | undefined): string {
  if (value === undefined || value.startsWith("--")) {
    process.stderr.write(`missing value for ${flag}\n`);
    process.exit(1);
  }
  return value;
}

function isFailure(value: QrRequest | QrFailure): value is QrFailure {
  return "ok" in value && value.ok === false;
}

async function writeOutput(outPath: string, body: Buffer | string): Promise<void> {
  const path = resolve(outPath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

void main(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
