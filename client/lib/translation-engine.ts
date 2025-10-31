import type {
  TranslationRequest,
  TranslationResult,
} from "@/features/translation/types";
import { offlineCache, isOffline } from "./offline-cache";

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

  // Check offline cache first
  const cached = offlineCache.get(text, source || 'auto', target);
  if (cached) {
    console.log('📦 Using cached translation:', { text, cached: cached.translatedText });
    return {
      text: cached.translatedText,
      detectedLanguage: cached.source,
      confidence: cached.confidence,
      provider: cached.provider,
      latencyMs: performance.now() - started,
    };
  }

  // If offline, use fallback immediately
  if (isOffline()) {
    console.log('📴 Offline - using fallback translation');
    const fallback = fallbackTranslate(text, source, target);
    
    // Cache the fallback result
    if (fallback.text && fallback.text !== text) {
      offlineCache.set(text, source || 'auto', target, fallback.text, fallback.confidence, fallback.provider);
    }
    
    return {
      ...fallback,
      latencyMs: performance.now() - started,
    };
  }

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

      // Cache successful translation
      if (translatedText && translatedText !== text) {
        offlineCache.set(
          text, 
          source || detectedLanguage || 'auto', 
          target, 
          translatedText, 
          payload.confidence ?? 0.9, 
          payload.provider ?? "libretranslate"
        );
      }

      return {
        text: translatedText,
        detectedLanguage,
        confidence: payload.confidence ?? 0.9,
        provider: payload.provider ?? payload.providerName ?? "tumo-proxy",
        latencyMs: performance.now() - started,
      };
    } else if (response) {
      // API returned an error - check if it's a 503 (service unavailable)
      const status = response.status;
      if (status === 503) {
        console.info(`🔄 Translation API temporarily unavailable (${status}), using offline mode`);
      } else {
        console.warn(`⚠️ Translation API error: ${status}`);
      }
      
      try {
        const errorData = await response.json();
        if (errorData.useOfflineFallback) {
          console.info('📦 Server recommends offline fallback');
        }
      } catch {
        // Response wasn't JSON, ignore
      }
    }
  } catch (error) {
    console.info("🔌 Using offline translation mode", error);
  }

  // Use fallback translation
  console.info(`📴 Using offline translation: ${source} -> ${target}`);
  const fallback = fallbackTranslate(text, source, target);
  
  // Cache the fallback result for future use
  if (fallback.text && fallback.text !== text) {
    offlineCache.set(
      text, 
      source || 'auto', 
      target, 
      fallback.text, 
      fallback.confidence, 
      fallback.provider
    );
  }
  
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

  // Stop any active recognition first
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // Ignore errors when stopping
    }
    activeRecognition = null;
  }

  const recognition = new RecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  
  // Handle "auto" language by defaulting to English
  const locale = language === "auto" ? "en-US" : (languageToSpeechLocale(language) ?? "en-US");
  recognition.lang = locale;
  recognition.maxAlternatives = 1;

  console.log(`🎤 Starting speech recognition with locale: ${locale}`);

  recognition.onstart = () => {
    console.log("✅ Speech recognition started successfully");
    callbacks.onStart?.();
  };
  
    recognition.onerror = (event: any) => {
    console.error("❌ Speech recognition error:", event.error, event);
    
    let errorMessage = "Speech recognition error";
    let shouldShowError = true;
    
    // Provide specific error messages based on error type
    if (typeof event?.error === "string") {
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          errorMessage = "🚫 Microphone permission denied.\n\nPlease:\n1. Click the 🔒 lock icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again\n\n💡 Tip: Check if other apps are using your microphone.";
          break;
        case "no-speech":
          // Don't treat no-speech as critical error in continuous mode
          console.log("⏸️ No speech detected, continuing...");
          shouldShowError = false;
          return; // Don't call error callback for no-speech
        case "audio-capture":
          errorMessage = "🎤 No microphone found.\n\nPlease:\n1. Connect a microphone or headset to your device\n2. Check System Settings → Sound → Input\n3. Make sure the microphone is not disabled or muted\n4. Refresh the page after connecting\n\n💡 Tip: Built-in laptop microphones should work automatically.\n\n🔍 Troubleshooting:\n• Close other apps that might be using the microphone\n• Try a different browser (Chrome works best)\n• Check if your microphone needs drivers or updates";
          break;
        case "network":
          errorMessage = "🌐 Network error.\n\nSpeech recognition requires an internet connection.\nPlease check your connection and try again.\n\n💡 Tip: Check if your firewall is blocking the connection.";
          break;
        case "aborted":
          console.log("⏹️ Speech recognition was stopped");
          shouldShowError = false;
          return; // Don't treat abort as error
        case "service-not-allowed":
          errorMessage = "🚫 Speech recognition service not allowed.\n\nPlease:\n1. Check browser settings and permissions\n2. Make sure you're using HTTPS (not HTTP)\n3. Try a different browser\n\n💡 Tip: Chrome and Edge have the best speech recognition support.";
          break;
        case "bad-grammar":
          errorMessage = "⚠️ Speech recognition configuration error.\n\nPlease refresh the page and try again.\n\nIf the problem persists, try:\n• Clearing your browser cache\n• Using a different browser";
          break;
        case "language-not-supported":
          errorMessage = `🌍 Language not supported: ${locale}.\n\nPlease try a different language.\n\n💡 Tip: English, Spanish, French, and German have the best support.`;
          break;
        default:
          errorMessage = `❌ Speech recognition error: ${event.error}${event.message ? '\n\n' + event.message : ''}`;
      }
    }
    
    if (shouldShowError) {
      callbacks.onError?.(errorMessage);
    }
  };  recognition.onend = () => {
    console.log("⏹️ Speech recognition ended");
    callbacks.onEnd?.();
    activeRecognition = null;
  };
  
  recognition.onresult = (event: any) => {
    try {
      let transcript = "";
      let isFinal = false;
      let confidence = 0;
      
      const results: any[] = Array.from(event.results ?? []);
      
      // Get the last result (most recent)
      const lastResultIndex = event.resultIndex;
      const lastResult = event.results[lastResultIndex];
      
      if (lastResult) {
        const alternative = lastResult[0];
        transcript = alternative?.transcript ?? "";
        confidence = alternative?.confidence ?? 0;
        isFinal = lastResult.isFinal;
        
        console.log(`🗣️ Speech ${isFinal ? 'FINAL' : 'interim'}: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
      }
      
      if (transcript.trim()) {
        callbacks.onResult?.(transcript.trim(), isFinal);
      }
    } catch (error) {
      console.error("Error processing speech result:", error);
    }
  };

  try {
    recognition.start();
    activeRecognition = recognition;
    console.log("🎬 Speech recognition start initiated...");
  } catch (error) {
    console.error("❌ Failed to start speech recognition:", error);
    activeRecognition = null;
    
    let errorMessage = "Failed to start microphone.";
    if (error instanceof Error) {
      if (error.message.includes("already started")) {
        console.log("ℹ️  Speech recognition already running, restarting...");
        // Try to stop and restart
        setTimeout(() => {
          try {
            recognition.start();
            activeRecognition = recognition;
          } catch (retryError) {
            console.error("Failed to restart:", retryError);
          }
        }, 100);
        return {
          stop: () => {
            try {
              recognition.stop();
            } catch (e) {
              // Ignore
            }
            activeRecognition = null;
          },
        };
      }
      errorMessage = error.message;
    }
    
    throw new Error(`${errorMessage}\n\nPlease check microphone permissions and try again.`);
  }

  return {
    stop: () => {
      try {
        if (recognition && activeRecognition === recognition) {
          recognition.stop();
          console.log("🛑 Speech recognition stopped");
        }
      } catch (error) {
        console.warn("Error stopping speech recognition:", error);
      }
      activeRecognition = null;
    },
  };
};

export const stopSpeechRecognition = () => {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
      console.log("🛑 Active speech recognition stopped");
    } catch (error) {
      console.warn("Warning while stopping speech recognition:", error);
      // Ignore errors, just clear the reference
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
