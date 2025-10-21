import { Router } from "express";

// Using MyMemory Translation API - Free, no API key required
// Limit: 5000 words/day per IP (very generous for free tier)
const TRANSLATION_API_URL =
  process.env.TRANSLATION_API_URL ?? "https://api.mymemory.translated.net";
const TRANSLATION_TIMEOUT_MS = Number(
  process.env.TRANSLATION_TIMEOUT_MS ?? 12_000,
);

// No fallback APIs needed - MyMemory is very reliable
const FALLBACK_APIS: string[] = [];

const sanitizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, "");

const remoteEndpoint = sanitizeEndpoint(TRANSLATION_API_URL);

const callRemote = async (
  path: string,
  params: Record<string, string>,
): Promise<globalThis.Response | undefined> => {
  // MyMemory uses GET requests with query parameters, not POST
  const endpoints = [remoteEndpoint, ...FALLBACK_APIS];
  
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
    
    try {
      // Build query string from params
      const queryString = new URLSearchParams(params).toString();
      const url = `${endpoint}${path}?${queryString}`;
      
      console.log(`Trying translation API: ${url}`);
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      
      // If we get a successful response, return it
      if (response.ok) {
        console.log(`Translation successful using: ${endpoint}`);
        return response;
      }
      
      // If we get an error response (not network error), log it and try next
      console.warn(`Translation API ${endpoint} returned status: ${response.status}`);
      
    } catch (error) {
      console.warn(`Remote translation unreachable at ${endpoint}:`, error);
    } finally {
      clearTimeout(timeout);
    }
  }
  
  console.error("All translation API endpoints failed");
  return undefined;
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

const formatErrorPayload = (
  status: number,
  message: string,
  details?: string,
) => ({
  error: message,
  status,
  details,
});

export const translationRouter = Router();

translationRouter.post("/detect", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || !text.trim()) {
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing text for detection"));
  }

  // MyMemory doesn't have a dedicated detect endpoint
  // We'll use a simple heuristic or return auto
  // For now, return a simple response indicating auto-detection
  return res.json([
    {
      language: "auto",
      confidence: 0.5,
    },
  ]);
});

translationRouter.post("/translate", async (req, res) => {
  const { text, source, target } = req.body as {
    text?: string;
    source?: string;
    target?: string;
  };

  if (typeof text !== "string" || !text.trim()) {
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing text for translation"));
  }

  if (typeof target !== "string" || !target.trim()) {
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing target language"));
  }

  // MyMemory API format: /get?q=text&langpair=source|target
  const langpair = `${source && source !== "auto" ? source : "en"}|${target}`;
  
  const response = await callRemote("/get", {
    q: text,
    langpair: langpair,
  });

  if (!response) {
    return res
      .status(503)
      .json(formatErrorPayload(503, "Translation service unavailable"));
  }

  const { json, raw } = await parseBody<{
    responseData?: { translatedText?: string };
    responseStatus?: number;
  }>(response);

  if (!response.ok || !json || !json.responseData) {
    console.error("Translation response parsing failed:");
    console.error("- response.ok:", response.ok);
    console.error("- json exists:", !!json);
    console.error("- raw preview:", raw.slice(0, 300));
    
    const status = response.ok ? 502 : response.status || 502;
    const payload =
      typeof json === "object" && json !== null
        ? json
        : formatErrorPayload(status, "Translation failed", raw.slice(0, 200));
    return res.status(status).json(payload);
  }

  // Convert MyMemory response format to our expected format
  const translatedText = json.responseData.translatedText || text;
  
  console.log("Translation response successful:", translatedText);
  
  return res.json({
    translatedText,
    detectedLanguage: source === "auto" ? target : source,
    confidence: 0.9,
    provider: "mymemory",
  });
});
