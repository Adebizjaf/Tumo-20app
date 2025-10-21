import type {
  TranslationRequest,
  TranslationResult,
} from "@/features/translation/types";

const TRANSLATION_TIMEOUT = 12_000;
const API_BASE = "/api/translation";
const CLIENT_TRANSLATE_ENDPOINT = `${API_BASE}/translate`;
const CLIENT_DETECT_ENDPOINT = `${API_BASE}/detect`;

const OFFLINE_DICTIONARY: Record<
  string,
  Record<string, Record<string, string>>
> = {
  en: {
    es: {
      hello: "hola",
      hi: "hola",
      "how are you": "¿cómo estás?",
      "how are you?": "¿cómo estás?",
      "good morning": "buenos días",
      "good afternoon": "buenas tardes",
      "good evening": "buenas tardes",
      "good night": "buenas noches",
      goodbye: "adiós",
      bye: "adiós",
      please: "por favor",
      "thank you": "gracias",
      thanks: "gracias",
      "you're welcome": "de nada",
      yes: "sí",
      no: "no",
      sorry: "lo siento",
      "excuse me": "perdón",
      help: "ayuda",
      translator: "traductor",
      language: "idioma",
      welcome: "bienvenido",
      love: "amor",
      friend: "amigo",
      water: "agua",
      food: "comida",
      time: "tiempo",
      today: "hoy",
      tomorrow: "mañana",
      yesterday: "ayer",
    },
    fr: {
      hello: "bonjour",
      hi: "salut",
      "how are you": "comment ça va",
      "how are you?": "comment ça va ?",
      "good morning": "bonjour",
      "good afternoon": "bon après-midi",
      "good evening": "bonsoir",
      "good night": "bonne nuit",
      goodbye: "au revoir",
      bye: "salut",
      please: "s'il vous plaît",
      "thank you": "merci",
      thanks: "merci",
      "you're welcome": "de rien",
      yes: "oui",
      no: "non",
      sorry: "désolé",
      "excuse me": "excusez-moi",
      help: "aide",
      translator: "traducteur",
      language: "langue",
      welcome: "bienvenue",
      love: "amour",
      friend: "ami",
      water: "eau",
      food: "nourriture",
      time: "temps",
      today: "aujourd'hui",
      tomorrow: "demain",
      yesterday: "hier",
    },
    yo: {
      hello: "bọ̀jọ̀",
      hi: "bọ̀jọ̀",
      "good morning": "ẹ káàrọ̀",
      "good afternoon": "ẹ káàsán",
      "good evening": "ẹ káàlẹ́",
      "good night": "ó dàárọ̀",
      "thank you": "ẹ se",
      thanks: "ẹ se",
      yes: "bẹ́ẹ̀ni",
      no: "bẹ́ẹ̀kọ́",
      translator: "onitumọ̀",
      language: "èdè",
      water: "omi",
      food: "oúnjẹ",
      friend: "ọ̀rẹ́",
    },
    ar: {
      hello: "مرحبا",
      hi: "مرحبا",
      "how are you": "كيف حالك",
      "how are you?": "كيف حالك؟",
      "good morning": "صباح الخير",
      "good afternoon": "مساء الخير",
      "good evening": "مساء الخير",
      "good night": "تصبح على خير",
      goodbye: "وداعا",
      bye: "وداعا",
      please: "من فضلك",
      "thank you": "شكرا",
      thanks: "شكرا",
      "you're welcome": "على الرحب",
      yes: "نعم",
      no: "لا",
      sorry: "آسف",
      "excuse me": "عفوا",
      help: "مساعدة",
      translator: "مترجم",
      language: "لغة",
      welcome: "أهلا وسهلا",
      love: "حب",
      friend: "صديق",
      water: "ماء",
      food: "طعام",
      time: "وقت",
      today: "اليوم",
      tomorrow: "غدا",
      yesterday: "أمس",
    },
    de: {
      hello: "hallo",
      hi: "hallo",
      "how are you": "wie geht es dir",
      "how are you?": "wie geht es dir?",
      "good morning": "guten morgen",
      "good afternoon": "guten tag",
      "good evening": "guten abend",
      "good night": "gute nacht",
      goodbye: "auf wiedersehen",
      bye: "tschüss",
      please: "bitte",
      "thank you": "danke",
      thanks: "danke",
      "you're welcome": "bitte schön",
      yes: "ja",
      no: "nein",
      sorry: "entschuldigung",
      "excuse me": "entschuldigung",
      help: "hilfe",
      translator: "übersetzer",
      language: "sprache",
      welcome: "willkommen",
      love: "liebe",
      friend: "freund",
      water: "wasser",
      food: "essen",
      time: "zeit",
      today: "heute",
      tomorrow: "morgen",
      yesterday: "gestern",
    },
    pt: {
      hello: "olá",
      hi: "oi",
      "how are you": "como vai você",
      "how are you?": "como vai você?",
      "good morning": "bom dia",
      "good afternoon": "boa tarde",
      "good evening": "boa noite",
      "good night": "boa noite",
      goodbye: "adeus",
      bye: "tchau",
      please: "por favor",
      "thank you": "obrigado",
      thanks: "obrigado",
      "you're welcome": "de nada",
      yes: "sim",
      no: "não",
      sorry: "desculpe",
      "excuse me": "com licença",
      help: "ajuda",
      translator: "tradutor",
      language: "idioma",
      welcome: "bem-vindo",
      love: "amor",
      friend: "amigo",
      water: "água",
      food: "comida",
      time: "tempo",
      today: "hoje",
      tomorrow: "amanhã",
      yesterday: "ontem",
    },
  },
  es: {
    en: {
      hola: "hello",
      "buenos días": "good morning",
      "buenas tardes": "good afternoon",
      "buenas noches": "good night",
      adiós: "goodbye",
      "por favor": "please",
      gracias: "thank you",
      "de nada": "you're welcome",
      sí: "yes",
      no: "no",
      "lo siento": "sorry",
      perdón: "excuse me",
      ayuda: "help",
      "¿cómo estás?": "how are you?",
      traductor: "translator",
      idioma: "language",
      bienvenido: "welcome",
      amor: "love",
      amigo: "friend",
      agua: "water",
      comida: "food",
      tiempo: "time",
      hoy: "today",
      mañana: "tomorrow",
      ayer: "yesterday",
    },
  },
  fr: {
    en: {
      bonjour: "hello",
      salut: "hi",
      "bonne nuit": "good night",
      bonsoir: "good evening",
      "au revoir": "goodbye",
      "s'il vous plaît": "please",
      merci: "thank you",
      "de rien": "you're welcome",
      oui: "yes",
      non: "no",
      désolé: "sorry",
      "excusez-moi": "excuse me",
      aide: "help",
      "comment ça va ?": "how are you?",
      "comment ça va": "how are you",
      traducteur: "translator",
      langue: "language",
      bienvenue: "welcome",
      amour: "love",
      ami: "friend",
      eau: "water",
      nourriture: "food",
      temps: "time",
      "aujourd'hui": "today",
      demain: "tomorrow",
      hier: "yesterday",
    },
  },
  yo: {
    en: {
      "bọ̀jọ̀": "hello",
      "ẹ káàrọ̀": "good morning",
      "ẹ káàsán": "good afternoon",
      "ẹ káalẹ́": "good evening",
      "ó dàárọ̀": "good night",
      "ẹ se": "thank you",
      "bẹ́ẹ̀ni": "yes",
      "bẹ́ẹ̀kọ́": "no",
      onitumọ̀: "translator",
      èdè: "language",
      omi: "water",
      oúnjẹ: "food",
      "ọ̀rẹ́": "friend",
    },
  },
  ar: {
    en: {
      "مرحبا": "hello",
      "كيف حالك": "how are you",
      "كيف حالك؟": "how are you?",
      "صباح الخير": "good morning",
      "مساء الخير": "good afternoon",
      "تصبح على خير": "good night",
      "وداعا": "goodbye",
      "من فضلك": "please",
      "شكرا": "thank you",
      "على الرحب": "you're welcome",
      "نعم": "yes",
      "لا": "no",
      "آسف": "sorry",
      "عفوا": "excuse me",
      "مساعدة": "help",
      "مترجم": "translator",
      "لغة": "language",
      "أهلا وسهلا": "welcome",
      "حب": "love",
      "صديق": "friend",
      "ماء": "water",
      "طعام": "food",
      "وقت": "time",
      "اليوم": "today",
      "غدا": "tomorrow",
      "أمس": "yesterday",
    },
  },
  de: {
    en: {
      hallo: "hello",
      "guten morgen": "good morning",
      "guten tag": "good afternoon",
      "guten abend": "good evening",
      "gute nacht": "good night",
      "auf wiedersehen": "goodbye",
      tschüss: "bye",
      bitte: "please",
      danke: "thank you",
      "bitte schön": "you're welcome",
      ja: "yes",
      nein: "no",
      entschuldigung: "sorry",
      hilfe: "help",
      "wie geht es dir": "how are you",
      "wie geht es dir?": "how are you?",
      übersetzer: "translator",
      sprache: "language",
      willkommen: "welcome",
      liebe: "love",
      freund: "friend",
      wasser: "water",
      essen: "food",
      zeit: "time",
      heute: "today",
      morgen: "tomorrow",
      gestern: "yesterday",
    },
  },
  pt: {
    en: {
      olá: "hello",
      oi: "hi",
      "bom dia": "good morning",
      "boa tarde": "good afternoon",
      "boa noite": "good night",
      adeus: "goodbye",
      tchau: "bye",
      "por favor": "please",
      obrigado: "thank you",
      "de nada": "you're welcome",
      sim: "yes",
      não: "no",
      desculpe: "sorry",
      "com licença": "excuse me",
      ajuda: "help",
      "como vai você": "how are you",
      "como vai você?": "how are you?",
      tradutor: "translator",
      idioma: "language",
      "bem-vindo": "welcome",
      amor: "love",
      amigo: "friend",
      água: "water",
      comida: "food",
      tempo: "time",
      hoje: "today",
      amanhã: "tomorrow",
      ontem: "yesterday",
    },
  },
};

const LANGUAGE_PATTERNS: Array<{
  language: string;
  pattern: RegExp;
  confidence: number;
}> = [
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
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "unknown";
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
      provider: "offline-unavailable",
      detectedLanguage: source === "auto" ? target : source,
      confidence: 0.1,
    };
  }

  // First try exact match (case-insensitive)
  const normalizedInput = normaliseText(text);
  if (dictionary[normalizedInput]) {
    return {
      text: dictionary[normalizedInput],
      provider: "offline",
      detectedLanguage: source === "auto" ? Object.keys(OFFLINE_DICTIONARY)[0] : source,
      confidence: 0.95,
    };
  }

  // Try word-by-word translation
  const words = text.split(/(\s+|[.,!?]+)/);
  let translatedCount = 0;
  const translated = words
    .map((segment) => {
      const clean = normaliseText(segment);
      if (!clean) return segment;
      
      if (dictionary[clean]) {
        translatedCount++;
        return dictionary[clean];
      }
      return segment;
    })
    .join("");

  // Calculate confidence based on how many words were translated
  const totalWords = words.filter(w => normaliseText(w).length > 0).length;
  const confidence = totalWords > 0 ? Math.min(0.85, (translatedCount / totalWords) * 0.85) : 0.3;

  return {
    text: translated,
    provider: "offline",
    detectedLanguage:
      source === "auto" ? Object.keys(OFFLINE_DICTIONARY)[0] : source,
    confidence,
  };
};

export const detectLanguage = async (
  text: string,
): Promise<{ language: string; confidence: number }> => {
  if (!text.trim()) {
    return { language: "", confidence: 0 };
  }

  try {
    const response = await fetchWithTimeout(CLIENT_DETECT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (response?.ok) {
      const data: Array<{ language: string; confidence: number }> =
        await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return { language: data[0].language, confidence: data[0].confidence };
      }
    }
  } catch (error) {
    console.warn("Language detection failed", error);
  }

  for (const pattern of LANGUAGE_PATTERNS) {
    if (pattern.pattern.test(text)) {
      return { language: pattern.language, confidence: pattern.confidence };
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
  const started = performance.now();

  try {
    const response = await fetchWithTimeout(CLIENT_TRANSLATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        source,
        target,
        stream: request.stream ?? false,
      }),
    });

    if (response?.ok) {
      const payload = await response.json();
      const translatedText =
        payload.translatedText ?? payload.translation ?? "";
      const detectedLanguage =
        payload.detectedLanguage ?? payload.detected ?? source;

      return {
        text: translatedText,
        detectedLanguage,
        confidence: payload.confidence ?? 0.9,
        provider: payload.provider ?? payload.providerName ?? "tumo-proxy",
        latencyMs: performance.now() - started,
      };
    } else if (response) {
      // Log the error response for debugging
      console.warn(`Translation API error: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.warn("Error details:", errorData);
      } catch {
        // Response wasn't JSON, ignore
      }
    }
  } catch (error) {
    console.warn("Remote translation failed", error);
  }

  // Use fallback translation
  console.info(`Using offline translation fallback for ${source} -> ${target}`);
  const fallback = fallbackTranslate(text, source, target);
  return {
    ...fallback,
    latencyMs: performance.now() - started,
  };
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

const getSpeechRecognitionConstructor = ():
  | RecognitionConstructor
  | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (
    (window as unknown as { SpeechRecognition?: RecognitionConstructor })
      .SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor })
      .webkitSpeechRecognition
  );
};

export const startSpeechRecognition = (
  language: string,
  callbacks: SpeechCallbacks,
): SpeechSession => {
  const RecognitionCtor = getSpeechRecognitionConstructor();
  if (!RecognitionCtor) {
    throw new Error("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
  }

  if (activeRecognition) {
    activeRecognition.stop();
    activeRecognition = null;
  }

  const recognition = new RecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = languageToSpeechLocale(language) ?? "en-US";

  recognition.onstart = () => {
    console.log("Speech recognition started");
    callbacks.onStart?.();
  };
  
  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event);
    
    let errorMessage = "Speech recognition error";
    
    // Provide specific error messages based on error type
    if (typeof event?.error === "string") {
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
          break;
        case "no-speech":
          errorMessage = "No speech detected. Please try speaking again.";
          break;
        case "audio-capture":
          errorMessage = "No microphone found. Please connect a microphone and try again.";
          break;
        case "network":
          errorMessage = "Network error. Please check your internet connection.";
          break;
        case "aborted":
          errorMessage = "Speech recognition was stopped.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
    }
    
    callbacks.onError?.(errorMessage);
  };
  
  recognition.onend = () => {
    console.log("Speech recognition ended");
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

  try {
    recognition.start();
    activeRecognition = recognition;
  } catch (error) {
    console.error("Failed to start speech recognition:", error);
    throw new Error("Failed to start microphone. Please check permissions and try again.");
  }

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

export const extractTextFromImage = async (
  file: File,
  languageHint = "eng",
) => {
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
