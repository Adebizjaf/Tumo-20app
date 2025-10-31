import { Router } from "express";

// Translation using Google Translate (free, no API key needed!)
// Falls back to MyMemory if Google fails
const TRANSLATION_TIMEOUT_MS = 8_000;

// Translate using Google Translate API (works without auth!)
const translateWithGoogle = async (
  text: string,
  source: string,
  target: string,
): Promise<string | null> => {
  try {
    const sourceLang = source === "auto" ? "auto" : source.split("-")[0];
    const targetLang = target.split("-")[0];

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://translate.google.com/',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`Google Translate returned status ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0]) && data[0][0]) {
        const translatedText = data[0][0][0];
        console.log(`✅ Google Translate: "${text.substring(0, 30)}" → "${translatedText.substring(0, 30)}"`);
        return translatedText;
      }
      
      console.warn('Google Translate: Unexpected response format');
      return null;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn('Google Translate error:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Translate using MyMemory API (fallback)
const translateWithMyMemory = async (
  text: string,
  source: string,
  target: string,
): Promise<string | null> => {
  try {
    const sourceLang = source === "auto" ? "en" : source.split("-")[0];
    const targetLang = target.split("-")[0];
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseData?.translatedText) {
          console.log(`✅ MyMemory: "${text.substring(0, 30)}" → "${data.responseData.translatedText.substring(0, 30)}"`);
          return data.responseData.translatedText;
        }
      } else {
        console.warn(`MyMemory returned status ${response.status}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn('MyMemory error:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Simple language detection
const detectLanguage = (text: string): string => {
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return "en";
};

export const translationRouter = Router();

// Main translation endpoint
translationRouter.post("/translate", async (req, res) => {
  try {
    const { text, source, target, stream } = req.body;

    if (!text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const sourceLanguage = source === "auto" ? detectLanguage(text) : source;
    const targetLanguage = target || "en";

    console.log(`🔄 Translating (${sourceLanguage} → ${targetLanguage}): "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`);

    // Try Google first, then MyMemory
    let translatedText = await translateWithGoogle(text, sourceLanguage, targetLanguage);
    
    if (!translatedText) {
      console.log('⚠️ Google Translate failed or returned null, trying MyMemory...');
      translatedText = await translateWithMyMemory(text, sourceLanguage, targetLanguage);
    }

    if (!translatedText) {
      console.error('❌ All translation APIs failed, using offline cache');
      return res.status(503).json({ 
        error: "Translation service temporarily unavailable",
        useOfflineFallback: true,
        originalText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    // Return in LibreTranslate format for compatibility
    res.json({
      translatedText,
      detectedLanguage: {
        language: sourceLanguage,
        confidence: 1.0,
      },
    });

  } catch (error) {
    console.error('Translation endpoint error:', error);
    res.status(500).json({ 
      error: "Internal server error",
      useOfflineFallback: true,
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Language detection endpoint
translationRouter.post("/detect", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const language = detectLanguage(text);
    res.json({ language });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
translationRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Translation API is healthy" });
});
