import type { TranslationRequest, TranslationResult } from "@/features/translation/types";

const TRANSLATION_TIMEOUT = 12_000;
const API_BASE = "/api/translation";
const CLIENT_TRANSLATE_ENDPOINT = `${API_BASE}/translate`;
const CLIENT_DETECT_ENDPOINT = `${API_BASE}/detect`;

const OFFLINE_DICTIONARY: Record<string, Record<string, Record<string, string>>> = {
  en: {
    es: {
      hello: "hola",
      "good morning": "buenos días",
      "good night": "buenas noches",
      "how are you?": "¿cómo estás?",
      translator: "traductor",
      language: "idioma",
      "thank you": "gracias",
    },
    fr: {
      hello: "bonjour",
      "good morning": "bonjour",
      "good night": "bonne nuit",
      "how are you?": "comment ça va ?",
      translator: "traducteur",
      language: "langue",
      "thank you": "merci",
    },
    yo: {
      hello: "bọ̀jọ̀",
      "good morning": "ẹ káàrọ̀",
      "good night": "káalẹ́",
      translator: "onitumọ̀",
      language: "èdè",
      "thank you": "ẹ se",
    },
  },
  es: {
    en: {
      hola: "hello",
      "buenos días": "good morning",
      "buenas noches": "good night",
      "¿cómo estás?": "how are you?",
      traductor: "translator",
      idioma: "language",
      gracias: "thank you",
    },
  },
  fr: {
    en: {
      bonjour: "hello",
      "bonne nuit": "good night",
      "comment ça va ?": "how are you?",
      traducteur: "translator",
      langue: "language",
      merci: "thank you",
    },
  },
  yo: {
    en: {
      "ẹ káàrọ̀": "good morning",
      "ẹ káalẹ́": "good night",
      "ẹ se": "thank you",
      onitumọ̀: "translator",
    },
  },
};

const LANGUAGE_PATTERNS: Array<{ language: string; pattern: RegExp; confidence: number }> = [
  { language: "es", pattern: /[ñáéíóúü¿¡]/i, confidence: 0.88 },
  { language: "fr", pattern: /[àâçéèêëîïôûùüÿœæ]/i, confidence: 0.86 },
  { language: "de", pattern: /[äöüß]/i, confidence: 0.8 },
  { language: "yo", pattern: /[ẹọṣńÀÈÌÒÙáéíóụ́̀́̄]/i, confidence: 0.82 },
  { language: "zh", pattern: /[\u4e00-\u9fff]/, confidence: 0.92 },
  { language: "ar", pattern: /[\u0600-\u06ff]/, confidence: 0.9 },
  { language: "pt", pattern: /[ãõâêôç]/i, confidence: 0.82 },
  { language: "ja", pattern: /[\u3040-\u30ff]/, confidence: 0.88 },
  { language: "hi", pattern: /[\u0900-\u097f]/, confidence: 0.9 },
];

const sanitizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, "");

let remoteCooldownUntil = 0;

const markRemoteFailure = () => {
  remoteCooldownUntil = Date.now() + REMOTE_COOLDOWN_MS;
};

const canAttemptRemote = () => {
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  if (!online) {
    return false;
  }
  return Date.now() >= remoteCooldownUntil;
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response | undefined> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    markRemoteFailure();
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";
    console.warn(`Translation fetch failed: ${message}`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

const normaliseText = (text: string) => text.toLowerCase().trim();

const fallbackTranslate = (
  text: string,
  source: string,
  target: string,
): TranslationResult => {
  const dictionary = OFFLINE_DICTIONARY[source]?.[target];
  if (!dictionary) {
    return {
      text,
      provider: "local",
      detectedLanguage: source === "auto" ? target : source,
      confidence: 0.2,
    };
  }

  const words = text.split(/(\s+|[.,!?]+)/);
  const translated = words
    .map((segment) => {
      const clean = normaliseText(segment);
      if (!clean) return segment;
      return dictionary[clean] ?? segment;
    })
    .join("");

  return {
    text: translated,
    provider: "local",
    detectedLanguage: source === "auto" ? Object.keys(OFFLINE_DICTIONARY)[0] : source,
    confidence: 0.4,
  };
};

export const detectLanguage = async (
  text: string,
): Promise<{ language: string; confidence: number }> => {
  if (!text.trim()) {
    return { language: "", confidence: 0 };
  }

  const attemptRemote = canAttemptRemote();

  try {
    if (!attemptRemote) {
      throw new Error("skip-remote-detect");
    }

    const response = await fetchWithTimeout(
      `${sanitizeEndpoint(DEFAULT_TRANSLATION_ENDPOINT)}/detect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: text }),
      },
    );

    if (response?.ok) {
      remoteCooldownUntil = 0;
      const data: Array<{ language: string; confidence: number }> = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return { language: data[0].language, confidence: data[0].confidence };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message !== "skip-remote-detect") {
      markRemoteFailure();
    }
    for (const pattern of LANGUAGE_PATTERNS) {
      if (pattern.pattern.test(text)) {
        return { language: pattern.language, confidence: pattern.confidence };
      }
    }
  }

  return { language: "", confidence: 0 };
};

export const translateText = async (
  request: TranslationRequest,
): Promise<TranslationResult> => {
  const { text, source, target } = request;
  if (!text.trim()) {
    return { text: "", detectedLanguage: source, confidence: 0, provider: "" };
  }
  const endpoint = sanitizeEndpoint(DEFAULT_TRANSLATION_ENDPOINT);
  const started = performance.now();

  const attemptRemote = canAttemptRemote();

  try {
    if (!attemptRemote) {
      throw new Error("skip-remote-translate");
    }

    const body = {
      q: text,
      source: source === "auto" ? "auto" : source,
      target,
      format: "text",
    };
    const response = await fetchWithTimeout(`${endpoint}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response?.ok) {
      remoteCooldownUntil = 0;
      const payload = await response.json();
      const translatedText = payload.translatedText ?? payload.translation ?? "";
      const detectedLanguage = payload.detectedLanguage ?? payload.detected ?? source;

      return {
        text: translatedText,
        detectedLanguage,
        confidence: payload.confidence ?? 0.9,
        provider: payload.provider ?? "libretranslate",
        latencyMs: performance.now() - started,
      };
    }

    throw new Error(response ? `Translation failed with status ${response.status}` : "Translation network error");
  } catch (error) {
    if (error instanceof Error && error.message !== "skip-remote-translate") {
      markRemoteFailure();
    }
    const fallback = fallbackTranslate(text, source, target);
    return {
      ...fallback,
      latencyMs: performance.now() - started,
    };
  }
};

const languageToSpeechLocale = (language: string) => {
  switch (language) {
    case "auto":
      return undefined;
    case "en":
      return "en-US";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    case "yo":
      return "yo-NG";
    case "zh":
      return "zh-CN";
    case "ar":
      return "ar-SA";
    case "pt":
      return "pt-BR";
    case "hi":
      return "hi-IN";
    case "ja":
      return "ja-JP";
    default:
      return `${language}-${language.toUpperCase()}`;
  }
};

let activeUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = async (text: string, language: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Text-to-speech not supported in this browser");
  }

  if (activeUtterance) {
    window.speechSynthesis.cancel();
  }

  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = languageToSpeechLocale(language) ?? "en-US";
    utterance.lang = locale;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      activeUtterance = null;
      resolve();
    };
    utterance.onerror = (event) => {
      activeUtterance = null;
      reject(event.error ?? new Error("Unable to play narration"));
    };

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => voice.lang === locale);
    if (preferred) {
      utterance.voice = preferred;
    }

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  activeUtterance = null;
};

export interface SpeechSession {
  stop: () => void;
}

interface SpeechCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

type SpeechRecognitionInstance = any;

let activeRecognition: SpeechRecognitionInstance | null = null;

type RecognitionConstructor = new () => SpeechRecognitionInstance;

const getSpeechRecognitionConstructor = (): RecognitionConstructor | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (
    (window as unknown as { SpeechRecognition?: RecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
  );
};

export const startSpeechRecognition = (
  language: string,
  callbacks: SpeechCallbacks,
): SpeechSession => {
  const RecognitionCtor = getSpeechRecognitionConstructor();
  if (!RecognitionCtor) {
    throw new Error("Speech recognition not supported in this browser");
  }

  if (activeRecognition) {
    activeRecognition.stop();
    activeRecognition = null;
  }

  const recognition = new RecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = languageToSpeechLocale(language) ?? "en-US";

  recognition.onstart = () => callbacks.onStart?.();
  recognition.onerror = (event: any) => {
    const errorMessage = typeof event?.error === "string" ? event.error : "Speech recognition error";
    callbacks.onError?.(errorMessage);
  };
  recognition.onend = () => {
    callbacks.onEnd?.();
  };
  recognition.onresult = (event: any) => {
    let transcript = "";
    let isFinal = false;
    const results: any[] = Array.from(event.results ?? []);
    results.forEach((result) => {
      const alternative = result[0];
      transcript += alternative?.transcript ?? "";
      if (result.isFinal) {
        isFinal = true;
      }
    });
    callbacks.onResult?.(transcript.trim(), isFinal);
  };

  recognition.start();
  activeRecognition = recognition;

  return {
    stop: () => {
      recognition.stop();
      activeRecognition = null;
    },
  };
};

export const stopSpeechRecognition = () => {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (error) {
      // ignore
    }
    activeRecognition = null;
  }
};

export const extractTextFromImage = async (file: File, languageHint = "eng") => {
  const { default: Tesseract } = await import(
    /* @vite-ignore */ "tesseract.js"
  );
  const { data } = await Tesseract.recognize(file, languageHint, {
    logger: () => {
      // swallow logs to avoid noisy console output
    },
  });
  return data.text?.trim() ?? "";
};
