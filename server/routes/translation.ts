import { Router } from "express";

const TRANSLATION_API_URL =
  process.env.TRANSLATION_API_URL ?? "https://libretranslate.de";
const TRANSLATION_TIMEOUT_MS = Number(process.env.TRANSLATION_TIMEOUT_MS ?? 12_000);

const sanitizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, "");

const remoteEndpoint = sanitizeEndpoint(TRANSLATION_API_URL);

const callRemote = async <Payload>(
  path: string,
  payload: Payload,
): Promise<globalThis.Response | undefined> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
  try {
    const response = await fetch(`${remoteEndpoint}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    console.warn("Remote translation unreachable", error);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

const parseBody = async <T = unknown>(response: globalThis.Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return { json: JSON.parse(raw) as T, raw };
    } catch (error) {
      console.warn("Failed to parse JSON payload", error);
    }
  }
  try {
    return { json: JSON.parse(raw) as T, raw };
  } catch {
    return { json: undefined, raw };
  }
};

const formatErrorPayload = (status: number, message: string, details?: string) => ({
  error: message,
  status,
  details,
});

export const translationRouter = Router();

translationRouter.post("/detect", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json(formatErrorPayload(400, "Missing text for detection"));
  }

  const response = await callRemote("/detect", { q: text });

  if (!response) {
    return res
      .status(503)
      .json(formatErrorPayload(503, "Language detection service unavailable"));
  }

  const { json, raw } = await parseBody(response);

  if (!response.ok || !json) {
    const status = response.ok ? 502 : response.status || 502;
    const payload =
      typeof json === "object" && json !== null
        ? json
        : formatErrorPayload(status, "Language detection failed", raw.slice(0, 200));
    return res.status(status).json(payload);
  }

  return res.json(json);
});

translationRouter.post("/translate", async (req, res) => {
  const {
    text,
    source,
    target,
    stream,
  } = req.body as { text?: string; source?: string; target?: string; stream?: boolean };

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json(formatErrorPayload(400, "Missing text for translation"));
  }

  if (typeof target !== "string" || !target.trim()) {
    return res.status(400).json(formatErrorPayload(400, "Missing target language"));
  }

  const response = await callRemote("/translate", {
    q: text,
    source: source && source.trim() ? source : "auto",
    target,
    format: "text",
    stream: Boolean(stream),
  });

  if (!response) {
    return res
      .status(503)
      .json(formatErrorPayload(503, "Translation service unavailable"));
  }

  const { json, raw } = await parseBody(response);

  if (!response.ok || !json) {
    const status = response.ok ? 502 : response.status || 502;
    const payload =
      typeof json === "object" && json !== null
        ? json
        : formatErrorPayload(status, "Translation failed", raw.slice(0, 200));
    return res.status(status).json(payload);
  }

  return res.json(json);
});
