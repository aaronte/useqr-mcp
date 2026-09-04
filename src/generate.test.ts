import { describe, expect, it } from "vitest";
import {
  QR_DATA_MAX,
  QR_SIZE_MAX,
  QR_SIZE_MIN,
  designerUrl,
  generateQr,
  parseQrRequest,
} from "./generate.js";

describe("parseQrRequest", () => {
  it("rejects empty data", () => {
    expect(parseQrRequest({ data: "" })).toEqual({ ok: false, reason: "empty" });
    expect(parseQrRequest({ data: "   " })).toEqual({
      ok: false,
      reason: "empty",
    });
    expect(parseQrRequest({})).toEqual({ ok: false, reason: "empty" });
    expect(parseQrRequest(null)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects data longer than QR_DATA_MAX", () => {
    const data = "a".repeat(QR_DATA_MAX + 1);
    expect(parseQrRequest({ data })).toEqual({
      ok: false,
      reason: "too_long",
    });
  });

  it("rejects colors that are not 6-digit hex", () => {
    expect(parseQrRequest({ data: "ok", foreground: "#fff" })).toEqual({
      ok: false,
      reason: "bad_color",
    });
    expect(parseQrRequest({ data: "ok", background: "ffffff" })).toEqual({
      ok: false,
      reason: "bad_color",
    });
    expect(parseQrRequest({ data: "ok", foreground: "#GGGGGG" })).toEqual({
      ok: false,
      reason: "bad_color",
    });
  });

  it("rejects size outside the allowed range", () => {
    expect(parseQrRequest({ data: "ok", size: QR_SIZE_MIN - 1 })).toEqual({
      ok: false,
      reason: "bad_size",
    });
    expect(parseQrRequest({ data: "ok", size: QR_SIZE_MAX + 1 })).toEqual({
      ok: false,
      reason: "bad_size",
    });
    expect(parseQrRequest({ data: "ok", size: 512.5 })).toEqual({
      ok: false,
      reason: "bad_size",
    });
  });

  it("fills defaults for a valid payload", () => {
    expect(parseQrRequest({ data: "hello" })).toEqual({
      data: "hello",
      format: "png",
      size: 512,
      foreground: "#0a0a0a",
      background: "#ffffff",
      errorCorrection: "M",
    });
  });
});

describe("generateQr", () => {
  it("returns a PNG buffer that starts with 89 50 4E 47", async () => {
    const parsed = parseQrRequest({ data: "https://example.com", format: "png" });
    if ("ok" in parsed && parsed.ok === false) {
      throw new Error(parsed.reason);
    }
    const result = await generateQr(parsed);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("png");
    if (result.format !== "png") {
      throw new Error("expected png");
    }
    expect([...result.bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("returns SVG markup that contains <svg", async () => {
    const parsed = parseQrRequest({ data: "https://example.com", format: "svg" });
    if ("ok" in parsed && parsed.ok === false) {
      throw new Error(parsed.reason);
    }
    const result = await generateQr(parsed);
    expect(result.ok).toBe(true);
    expect(result.format).toBe("svg");
    if (result.format !== "svg") {
      throw new Error("expected svg");
    }
    expect(result.markup).toContain("<svg");
  });
});

describe("designerUrl", () => {
  it("encodes http(s) URLs on the designer query string", () => {
    expect(designerUrl("https://example.com")).toBe(
      "https://useqr.co/?url=https%3A%2F%2Fexample.com",
    );
    expect(designerUrl("http://example.com/path?q=1&x=2")).toBe(
      "https://useqr.co/?url=http%3A%2F%2Fexample.com%2Fpath%3Fq%3D1%26x%3D2",
    );
  });

  it("returns the designer root for non-http data", () => {
    expect(designerUrl("plain text")).toBe("https://useqr.co");
    expect(designerUrl("ftp://example.com")).toBe("https://useqr.co");
    expect(designerUrl("")).toBe("https://useqr.co");
  });
});
