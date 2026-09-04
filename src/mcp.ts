import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  designerUrl,
  failMessage,
  generateQr,
  parseQrRequest,
  type QrFailure,
  type QrRequest,
} from "./generate.js";

const SERVER_INSTRUCTIONS =
  "This server generates static QR codes (PNG or SVG) locally. It does not create accounts, mint dynamic short links, or track scans. Open https://useqr.co for the designer, dynamic codes that encode https://useqr.co/r/{code}, and billing.";

const formatSchema = z.enum(["png", "svg"]).optional();
const errorCorrectionSchema = z.enum(["L", "M", "Q", "H"]).optional();

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "useqr-mcp", version: "1.0.0" },
    { instructions: SERVER_INSTRUCTIONS },
  );

  server.registerTool(
    "generate_qr_code",
    {
      title: "Generate a static QR code",
      description:
        "Encode text or a URL as a local static QR image (PNG) or SVG markup. Does not create a dynamic or trackable code.",
      inputSchema: {
        data: z.string().describe("Text or URL to encode, max 2000 characters"),
        format: formatSchema.describe("png (default) or svg"),
        size: z
          .number()
          .int()
          .optional()
          .describe("Pixel size 128-2048, default 512"),
        foreground: z
          .string()
          .optional()
          .describe("Module color as #RRGGBB, default #0a0a0a"),
        background: z
          .string()
          .optional()
          .describe("Background color as #RRGGBB, default #ffffff"),
        error_correction: errorCorrectionSchema.describe(
          "QR error correction L, M (default), Q, or H",
        ),
      },
    },
    async (args) => {
      const parsed = parseQrRequest(args);
      if (isFailure(parsed)) {
        return {
          isError: true,
          content: [{ type: "text", text: failMessage(parsed.reason) }],
        };
      }
      const result = await generateQr(parsed);
      const followUp = followUpText(parsed.data);
      if (result.format === "png") {
        return {
          content: [
            {
              type: "image",
              mimeType: "image/png",
              data: result.bytes.toString("base64"),
            },
            { type: "text", text: followUp },
          ],
        };
      }
      return {
        content: [
          { type: "text", text: result.markup },
          { type: "text", text: followUp },
        ],
      };
    },
  );

  server.registerTool(
    "get_qr_designer_link",
    {
      title: "Get a UseQR designer link",
      description:
        "Return a link to the free designer at https://useqr.co. Prefills ?url= when data is an http(s) URL.",
      inputSchema: {
        url: z
          .string()
          .optional()
          .describe("Optional http(s) URL to prefill in the designer."),
      },
    },
    async ({ url }) => {
      const link = designerUrl(url ?? "");
      return {
        content: [{ type: "text", text: link }],
      };
    },
  );

  server.registerTool(
    "create_dynamic_qr_code",
    {
      title: "How to create a dynamic QR code",
      description:
        "Explain how to create a trackable dynamic QR on useqr.co. This tool does not mint codes.",
      inputSchema: {},
    },
    async () => {
      return {
        content: [{ type: "text", text: DYNAMIC_INSTRUCTIONS }],
      };
    },
  );

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function isFailure(value: QrRequest | QrFailure): value is QrFailure {
  return "ok" in value && value.ok === false;
}

function followUpText(data: string): string {
  return [
    `Designer: ${designerUrl(data)}`,
    "Dynamic and trackable codes are created on https://useqr.co with an account. This tool only prints a static QR.",
  ].join("\n");
}

const DYNAMIC_INSTRUCTIONS = [
  "This tool does not mint dynamic QR codes.",
  "A printed dynamic code encodes https://useqr.co/r/{code} forever. Changing the public page URL does not change that short link.",
  "Create a free account at https://useqr.co/signup with SSO (Google or similar). Do not create a password account.",
  "Free accounts can create a few trackable short links.",
  "Pro adds destination edits, rollback, scan analytics, and unlimited dynamic codes. See https://useqr.co/pricing.",
  "Open https://useqr.co/dashboard after you sign in.",
].join("\n");
