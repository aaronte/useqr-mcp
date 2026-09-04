import QRCode from "qrcode";

export type QrFormat = "png" | "svg";
export type ErrorCorrection = "L" | "M" | "Q" | "H";

export type QrRequest = {
  data: string;
  format: QrFormat;
  size: number;
  foreground: string;
  background: string;
  errorCorrection: ErrorCorrection;
};

export type QrFailureReason = "empty" | "too_long" | "bad_color" | "bad_size";

export type QrFailure = { ok: false; reason: QrFailureReason };

export type QrImage =
  | { ok: true; format: "png"; bytes: Buffer }
  | { ok: true; format: "svg"; markup: string };

export type QrResult = QrImage | QrFailure;

export const QR_DATA_MAX = 2000;
export const QR_SIZE_MIN = 128;
export const QR_SIZE_MAX = 2048;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_FORMAT: QrFormat = "png";
const DEFAULT_SIZE = 512;
const DEFAULT_FOREGROUND = "#0a0a0a";
const DEFAULT_BACKGROUND = "#ffffff";
const DEFAULT_ERROR_CORRECTION: ErrorCorrection = "M";

export function parseQrRequest(input: unknown): QrRequest | QrFailure {
  const raw = asRecord(input);
  const data = raw.data;
  if (typeof data !== "string" || data.length === 0 || data.trim().length === 0) {
    return fail("empty");
  }
  if (data.length > QR_DATA_MAX) {
    return fail("too_long");
  }

  const format = parseFormat(raw.format);
  const size = parseSize(raw.size);
  if (size === null) {
    return fail("bad_size");
  }

  const foreground = parseColor(raw.foreground, DEFAULT_FOREGROUND);
  const background = parseColor(raw.background, DEFAULT_BACKGROUND);
  if (foreground === null || background === null) {
    return fail("bad_color");
  }

  const errorCorrection = parseErrorCorrection(
    raw.errorCorrection ?? raw.error_correction,
  );

  return {
    data,
    format,
    size,
    foreground,
    background,
    errorCorrection,
  };
}

export async function generateQr(req: QrRequest): Promise<QrImage> {
  const options = {
    errorCorrectionLevel: req.errorCorrection,
    width: req.size,
    margin: 1,
    color: {
      dark: req.foreground,
      light: req.background,
    },
  };

  switch (req.format) {
    case "png": {
      const bytes = await QRCode.toBuffer(req.data, {
        ...options,
        type: "png",
      });
      return { ok: true, format: "png", bytes };
    }
    case "svg": {
      const markup = await QRCode.toString(req.data, {
        ...options,
        type: "svg",
      });
      return { ok: true, format: "svg", markup };
    }
    default: {
      const _exhaustive: never = req.format;
      throw new Error(`unhandled format: ${_exhaustive}`);
    }
  }
}

export function designerUrl(data: string): string {
  if (isHttpUrl(data)) {
    return `https://useqr.co/?url=${encodeURIComponent(data)}`;
  }
  return "https://useqr.co";
}

export function failMessage(reason: QrFailureReason): string {
  switch (reason) {
    case "empty":
      return "empty";
    case "too_long":
      return "too_long";
    case "bad_color":
      return "bad_color";
    case "bad_size":
      return "bad_size";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

function fail(reason: QrFailureReason): QrFailure {
  return { ok: false, reason };
}

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {};
  }
  return input as Record<string, unknown>;
}

function parseFormat(value: unknown): QrFormat {
  if (value === undefined) {
    return DEFAULT_FORMAT;
  }
  if (value === "png" || value === "svg") {
    return value;
  }
  return DEFAULT_FORMAT;
}

function parseSize(value: unknown): number | null {
  if (value === undefined) {
    return DEFAULT_SIZE;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  if (value < QR_SIZE_MIN || value > QR_SIZE_MAX) {
    return null;
  }
  return value;
}

function parseColor(value: unknown, fallback: string): string | null {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "string" || !HEX_COLOR.test(value)) {
    return null;
  }
  return value;
}

function parseErrorCorrection(value: unknown): ErrorCorrection {
  if (value === undefined) {
    return DEFAULT_ERROR_CORRECTION;
  }
  if (value === "L" || value === "M" || value === "Q" || value === "H") {
    return value;
  }
  return DEFAULT_ERROR_CORRECTION;
}

function isHttpUrl(data: string): boolean {
  let url: URL;
  try {
    url = new URL(data);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}
