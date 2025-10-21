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
    const timeout = setTimeout(
      () => controller.abort(),
      TRANSLATION_TIMEOUT_MS,
    );

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
      console.warn(
        `Translation API ${endpoint} returned status: ${response.status}`,
      );
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

// Simple language detection based on character patterns
const detectLanguage = (text: string): string => {
  const trimmedText = text.trim().toLowerCase();

  // Arabic detection (Arabic script)
  if (/[\u0600-\u06FF]/.test(text)) {
    return "ar";
  }

  // Chinese detection (CJK characters)
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return "zh";
  }

  // Japanese detection (Hiragana/Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return "ja";
  }

  // Korean detection (Hangul)
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return "ko";
  }

  // Russian detection (Cyrillic)
  if (/[\u0400-\u04FF]/.test(text)) {
    return "ru";
  }

  // Greek detection
  if (/[\u0370-\u03FF]/.test(text)) {
    return "el";
  }

  // Hebrew detection
  if (/[\u0590-\u05FF]/.test(text)) {
    return "he";
  }

  // Thai detection
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return "th";
  }

  // Common European language patterns
  const words = trimmedText.split(/\s+/);

  // French indicators
  const frenchWords = [
    "le",
    "la",
    "les",
    "de",
    "et",
    "est",
    "un",
    "une",
    "des",
    "je",
    "tu",
    "il",
    "elle",
    "nous",
    "vous",
    "avec",
    "pour",
    "dans",
  ];
  const frenchCount = words.filter((w) => frenchWords.includes(w)).length;

  // Spanish indicators
  const spanishWords = [
    "el",
    "la",
    "los",
    "las",
    "de",
    "y",
    "es",
    "un",
    "una",
    "del",
    "en",
    "que",
    "por",
    "para",
    "con",
    "yo",
    "tú",
    "él",
    "ella",
  ];
  const spanishCount = words.filter((w) => spanishWords.includes(w)).length;

  // Portuguese indicators
  const portugueseWords = [
    "o",
    "a",
    "os",
    "as",
    "de",
    "e",
    "é",
    "um",
    "uma",
    "do",
    "da",
    "em",
    "que",
    "por",
    "para",
    "com",
    "não",
    "são",
  ];
  const portugueseCount = words.filter((w) =>
    portugueseWords.includes(w),
  ).length;

  // German indicators (with umlauts)
  const germanWords = [
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "und",
    "ist",
    "nicht",
    "ich",
    "du",
    "er",
    "sie",
    "wir",
    "mit",
    "für",
  ];
  const germanCount = words.filter((w) => germanWords.includes(w)).length;
  if (/[äöüß]/i.test(text)) {
    return "de";
  }

  // Italian indicators
  const italianWords = [
    "il",
    "lo",
    "la",
    "i",
    "gli",
    "le",
    "di",
    "e",
    "è",
    "un",
    "una",
    "del",
    "che",
    "per",
    "con",
    "non",
    "sono",
  ];
  const italianCount = words.filter((w) => italianWords.includes(w)).length;

  // Dutch indicators
  const dutchWords = [
    "de",
    "het",
    "een",
    "en",
    "van",
    "is",
    "niet",
    "ik",
    "je",
    "hij",
    "zij",
    "wij",
    "met",
    "voor",
    "zijn",
  ];
  const dutchCount = words.filter((w) => dutchWords.includes(w)).length;

  // Compare counts
  const languageScores = [
    { lang: "fr", score: frenchCount },
    { lang: "es", score: spanishCount },
    { lang: "pt", score: portugueseCount },
    { lang: "de", score: germanCount },
    { lang: "it", score: italianCount },
    { lang: "nl", score: dutchCount },
  ];

  languageScores.sort((a, b) => b.score - a.score);

  // If we found good matches, return the best one
  if (languageScores[0].score > 0) {
    return languageScores[0].lang;
  }

  // Default to English for Latin script
  return "en";
};

export const translationRouter = Router();

translationRouter.post("/detect", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || !text.trim()) {
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing text for detection"));
  }

  const detectedLanguage = detectLanguage(text);

  return res.json([
    {
      language: detectedLanguage,
      confidence: 0.8,
    },
  ]);
});

translationRouter.post("/translate", async (req, res) => {
  // Debug logging for Netlify deployment
  console.log("=== Translation Request Debug ===");
  console.log("req.body type:", typeof req.body);
  console.log("req.body:", JSON.stringify(req.body, null, 2));
  console.log("req.headers:", JSON.stringify(req.headers, null, 2));

  const { text, source, target } = req.body as {
    text?: string;
    source?: string;
    target?: string;
  };

  if (typeof text !== "string" || !text.trim()) {
    console.error("Missing or invalid text field:", {
      text,
      bodyType: typeof req.body,
      body: req.body,
    });
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing text for translation"));
  }

  if (typeof target !== "string" || !target.trim()) {
    return res
      .status(400)
      .json(formatErrorPayload(400, "Missing target language"));
  }

  // Auto-detect source language if needed
  let sourceLanguage = source;
  if (!source || source === "auto") {
    sourceLanguage = detectLanguage(text);
    console.log(`Auto-detected source language: ${sourceLanguage}`);
  }

  // MyMemory API format: /get?q=text&langpair=source|target
  const langpair = `${sourceLanguage}|${target}`;
  console.log(`Translation langpair: ${langpair}`);

  const response = await callRemote("/get", {
    q: text,
    langpair: langpair,
    mt: "1", // Force machine translation to avoid odd TM matches like QFontDatabase
    de: "opensource@tumo.app", // Contact email recommended by MyMemory to improve quality/rate limiting
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
  let translatedText = json.responseData.translatedText || text;

  // Defensive: if target is Hindi or other non-Latin script but translation contains ASCII letters,
  // we consider it low quality (e.g., leaked technical tokens). In such case, retry once without TMs.
  const NON_LATIN_TARGETS = new Set([
    "hi",
    "ar",
    "zh",
    "ja",
    "ko",
    "ru",
    "he",
    "th",
  ]);
  if (
    NON_LATIN_TARGETS.has(target || "") &&
    /[A-Za-z]{2,}/.test(translatedText)
  ) {
    try {
      const retry = await callRemote("/get", {
        q: text,
        langpair: langpair,
        mt: "1",
        onlyprivate: "1", // avoid public TM suggestions
        de: "opensource@tumo.app",
      });
      if (retry && retry.ok) {
        const { json: retryJson } = await parseBody<{
          responseData?: { translatedText?: string };
        }>(retry);
        if (retryJson?.responseData?.translatedText) {
          translatedText = retryJson.responseData.translatedText;
        }
      }
    } catch (e) {
      console.warn("Retry translation failed", e);
    }
  }

  console.log("Translation response successful:", translatedText);

  return res.json({
    translatedText,
    detectedLanguage: sourceLanguage || source || "",
    confidence: 0.9,
    provider: "mymemory",
  });
});
