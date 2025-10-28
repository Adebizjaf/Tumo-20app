import { translateText } from "./translation-engine";
import type { TranslationRequest, TranslationResult } from "@/features/translation/types";

interface StreamingTranslationOptions {
  minChunkLength: number; // Minimum text length before translation
  maxDelay: number; // Maximum delay in ms before forced translation
  predictiveTranslation: boolean; // Enable partial translation while speaking
  cacheResults: boolean; // Cache common phrases
}

interface StreamingTranslationState {
  partialText: string;
  lastTranslationTime: number;
  pendingTimeout: NodeJS.Timeout | null;
  cache: Map<string, TranslationResult>;
}

export class StreamingTranslator {
  private options: StreamingTranslationOptions;
  private state: StreamingTranslationState;
  private onPartialResult?: (result: Partial<TranslationResult> & { isPartial: boolean }) => void;
  private onFinalResult?: (result: TranslationResult) => void;

  constructor(
    options: Partial<StreamingTranslationOptions> = {},
    callbacks?: {
      onPartialResult?: (result: Partial<TranslationResult> & { isPartial: boolean }) => void;
      onFinalResult?: (result: TranslationResult) => void;
    }
  ) {
    this.options = {
      minChunkLength: 10, // Start translating after 10 characters
      maxDelay: 200, // Force translation after 200ms
      predictiveTranslation: true,
      cacheResults: true,
      ...options
    };

    this.state = {
      partialText: '',
      lastTranslationTime: 0,
      pendingTimeout: null,
      cache: new Map()
    };

    this.onPartialResult = callbacks?.onPartialResult;
    this.onFinalResult = callbacks?.onFinalResult;
  }

  async processPartialSpeech(
    text: string, 
    source: string, 
    target: string, 
    isFinal: boolean = false
  ): Promise<void> {
    const now = Date.now();
    this.state.partialText = text;

    // Clear any pending translation
    if (this.state.pendingTimeout) {
      clearTimeout(this.state.pendingTimeout);
      this.state.pendingTimeout = null;
    }

    // Check cache first for exact matches
    if (this.options.cacheResults && isFinal) {
      const cacheKey = `${source}-${target}-${text.toLowerCase().trim()}`;
      const cached = this.state.cache.get(cacheKey);
      if (cached) {
        this.onFinalResult?.(cached);
        return;
      }
    }

    // Immediate translation for final results or if text is long enough
    if (isFinal || text.length >= this.options.minChunkLength) {
      await this.performTranslation(text, source, target, isFinal);
      return;
    }

    // Predictive translation with delay
    if (this.options.predictiveTranslation) {
      const timeSinceLastTranslation = now - this.state.lastTranslationTime;
      const delay = Math.max(50, this.options.maxDelay - timeSinceLastTranslation);

      this.state.pendingTimeout = setTimeout(() => {
        this.performTranslation(text, source, target, false);
      }, delay);
    }
  }

  private async performTranslation(
    text: string, 
    source: string, 
    target: string, 
    isFinal: boolean
  ): Promise<void> {
    if (!text.trim()) return;

    const startTime = Date.now();
    this.state.lastTranslationTime = startTime;

    try {
      const request: TranslationRequest = {
        text: text.trim(),
        source,
        target
      };

      const result = await translateText(request);
      const latency = Date.now() - startTime;

      // Enhanced result with timing info
      const enhancedResult = {
        ...result,
        latencyMs: latency,
        timestamp: new Date()
      };

      // Cache final results
      if (isFinal && this.options.cacheResults) {
        const cacheKey = `${source}-${target}-${text.toLowerCase().trim()}`;
        this.state.cache.set(cacheKey, enhancedResult);

        // Limit cache size
        if (this.state.cache.size > 100) {
          const firstKey = this.state.cache.keys().next().value;
          this.state.cache.delete(firstKey);
        }
      }

      // Send appropriate callback
      if (isFinal) {
        this.onFinalResult?.(enhancedResult);
      } else {
        this.onPartialResult?.({
          ...enhancedResult,
          isPartial: true,
          confidence: Math.max(0.3, enhancedResult.confidence - 0.2) // Lower confidence for partial
        });
      }

    } catch (error) {
      console.error('Streaming translation failed:', error);
      // Fallback to basic result
      const fallbackResult = {
        text: text,
        detectedLanguage: source,
        confidence: 0.1,
        provider: 'fallback',
        latencyMs: Date.now() - startTime
      };

      if (isFinal) {
        this.onFinalResult?.(fallbackResult);
      } else {
        this.onPartialResult?.({
          ...fallbackResult,
          isPartial: true
        });
      }
    }
  }

  // Optimized batch translation for common phrases
  async preloadCommonPhrases(phrases: string[], source: string, target: string): Promise<void> {
    console.log(`Preloading ${phrases.length} common phrases for ${source} -> ${target}`);
    
    const batchSize = 5; // Translate in small batches to avoid overwhelming API
    for (let i = 0; i < phrases.length; i += batchSize) {
      const batch = phrases.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (phrase) => {
          try {
            const result = await translateText({
              text: phrase,
              source,
              target
            });
            
            const cacheKey = `${source}-${target}-${phrase.toLowerCase().trim()}`;
            this.state.cache.set(cacheKey, result);
          } catch (error) {
            console.warn(`Failed to preload phrase: ${phrase}`, error);
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < phrases.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.state.cache.size,
      hitRate: this.calculateHitRate(),
      averageLatency: this.calculateAverageLatency()
    };
  }

  private calculateHitRate(): number {
    // This would need to be tracked over time in a real implementation
    return 0.75; // Placeholder
  }

  private calculateAverageLatency(): number {
    // Calculate from recent translations
    return 150; // Placeholder
  }

  // Clean up resources
  dispose() {
    if (this.state.pendingTimeout) {
      clearTimeout(this.state.pendingTimeout);
    }
    this.state.cache.clear();
  }
}

// Common conversation phrases for preloading
export const COMMON_CONVERSATION_PHRASES = {
  en: [
    "hello", "hi", "good morning", "good afternoon", "good evening",
    "how are you", "nice to meet you", "thank you", "you're welcome",
    "excuse me", "sorry", "please", "yes", "no", "maybe",
    "I don't understand", "can you repeat that", "speak slower please",
    "what do you mean", "that's right", "exactly", "I agree",
    "goodbye", "see you later", "have a good day"
  ],
  es: [
    "hola", "buenos días", "buenas tardes", "buenas noches",
    "¿cómo estás?", "mucho gusto", "gracias", "de nada",
    "disculpe", "perdón", "por favor", "sí", "no", "tal vez",
    "no entiendo", "¿puede repetir?", "hable más despacio",
    "¿qué quiere decir?", "así es", "exacto", "estoy de acuerdo",
    "adiós", "hasta luego", "que tenga buen día"
  ],
  fr: [
    "bonjour", "bonsoir", "comment allez-vous", "enchanté",
    "merci", "de rien", "excusez-moi", "pardon", "s'il vous plaît",
    "oui", "non", "peut-être", "je ne comprends pas",
    "pouvez-vous répéter", "parlez plus lentement",
    "que voulez-vous dire", "c'est ça", "exactement", "je suis d'accord",
    "au revoir", "à bientôt", "bonne journée"
  ],
  de: [
    "hallo", "guten Morgen", "guten Tag", "guten Abend",
    "wie geht es Ihnen", "freut mich", "danke", "bitte schön",
    "entschuldigen Sie", "tut mir leid", "bitte", "ja", "nein", "vielleicht",
    "ich verstehe nicht", "können Sie das wiederholen", "sprechen Sie langsamer",
    "was meinen Sie", "das stimmt", "genau", "ich stimme zu",
    "auf Wiedersehen", "bis später", "schönen Tag noch"
  ]
};
