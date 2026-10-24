import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createMcpServer } from "./mcp.js";

const PACKAGE_VERSION = readPackageJsonVersion();

describe("tools/list", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("lists three local read-only tools and the package version", async () => {
    const server = createMcpServer();
    const client = new Client({ name: "useqr-mcp-test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    cleanup = async () => {
      await client.close();
      await server.close();
    };
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    expect(client.getServerVersion()).toEqual({
      name: "useqr-mcp",
      version: PACKAGE_VERSION,
    });

    const listed = await client.listTools();
    expect(listed.tools).toHaveLength(3);
    const byName = new Map(listed.tools.map((tool) => [tool.name, tool]));
    expect([...byName.keys()].sort()).toEqual([
      "create_dynamic_qr_code",
      "generate_qr_code",
      "get_qr_designer_link",
    ]);

    expect(byName.get("generate_qr_code")).toMatchObject({
      title: "Generate a static QR code",
      description:
        "Encode text or a URL as a local static QR image (PNG) or SVG markup. Does not create a dynamic or trackable code.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    });
    expect(byName.get("get_qr_designer_link")).toMatchObject({
      title: "Get a UseQR designer link",
      description:
        "Return a link to the free designer at https://useqr.co. Prefills ?url= when data is an http(s) URL.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    });
    expect(byName.get("create_dynamic_qr_code")).toMatchObject({
      title: "How to create a dynamic QR code",
      description:
        "Explain how to create a trackable dynamic QR on useqr.co. This tool does not mint codes.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    });

    for (const tool of listed.tools) {
      expect(tool.annotations).toEqual({
        readOnlyHint: true,
        openWorldHint: false,
      });
    }

    const called = await client.callTool({
      name: "create_dynamic_qr_code",
      arguments: {},
    });
    expect(called.isError).not.toBe(true);
    const text = called.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");
    expect(text).toContain("does not mint");
  });
});

describe("install docs", () => {
  it("leads the README and CLI help with the hosted URL, then npm, then GitHub", () => {
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
    assertInstallOrder(readme);
    assertInstallOrder(readFileSync(new URL("./cli.ts", import.meta.url), "utf8"));
    expect(readme).toContain("https://useqr.co/mcp");
    expect(readme).toContain("https://useqr.co");
  });

  it("keeps the Marketplace manifest on the hosted server", () => {
    const mcp = JSON.parse(
      readFileSync(new URL("../mcp.json", import.meta.url), "utf8"),
    ) as { mcpServers: { useqr: { type: string; url: string } } };
    expect(mcp.mcpServers.useqr).toEqual({
      type: "streamable-http",
      url: "https://useqr.co/api/mcp",
    });
    const plugin = JSON.parse(
      readFileSync(new URL("../plugin.json", import.meta.url), "utf8"),
    ) as { name: string; version: string };
    expect(plugin.name).toBe("useqr");
    const skill = readFileSync(
      new URL("../skills/useqr/SKILL.md", import.meta.url),
      "utf8",
    );
    expect(skill).toContain("must not mint");
  });
});

function assertInstallOrder(text: string): void {
  const remote = text.indexOf("https://useqr.co/api/mcp");
  const npmPackage = text.indexOf('"useqr-mcp"');
  const github = text.indexOf("github:aaronte/useqr-mcp");
  expect(remote).toBeGreaterThanOrEqual(0);
  expect(npmPackage).toBeGreaterThan(remote);
  expect(github).toBeGreaterThan(npmPackage);
}

function readPackageJsonVersion(): string {
  const raw: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  if (typeof raw !== "object" || raw === null || !("version" in raw)) {
    throw new Error("package.json version missing");
  }
  if (typeof raw.version !== "string") {
    throw new Error("package.json version missing");
  }
  return raw.version;
}
