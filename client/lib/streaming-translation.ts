import { translateText } from "./translation-engine";
import type { TranslationRequest, TranslationResult } from "@/features/translation/types";

interface CachedTranslation {
  result: TranslationResult;
  timestamp: Date;
  accessCount: number;
}

interface StreamingTranslationOptions {
  maxCacheSize?: number;
  cacheExpiryMs?: number;
  prefetchCommonPhrases?: boolean;
  adaptiveDelay?: boolean;
}

class StreamingTranslationService {
  private cache = new Map<string, CachedTranslation>();
  private readonly maxCacheSize: number;
  private readonly cacheExpiryMs: number;
  private readonly adaptiveDelay: boolean;
  private prefetchQueue: string[] = [];
  private isProcessingQueue = false;
  
  // Performance tracking
  private translationTimes: number[] = [];
  private readonly maxPerformanceHistory = 20;

  // Common phrases for prefetching
  private readonly commonPhrases = {
    en: [
      "hello", "hi", "thank you", "please", "excuse me", "sorry", 
      "yes", "no", "good morning", "good afternoon", "good evening",
      "how are you", "nice to meet you", "goodbye", "see you later",
      "I don't understand", "can you help me", "where is", "how much",
      "what time", "I need", "I want", "I would like"
    ],
    es: [
      "hola", "gracias", "por favor", "perdón", "disculpe", "lo siento",
      "sí", "no", "buenos días", "buenas tardes", "buenas noches",
      "¿cómo estás?", "mucho gusto", "adiós", "hasta luego",
      "no entiendo", "¿puedes ayudarme?", "¿dónde está?", "¿cuánto cuesta?",
      "¿qué hora es?", "necesito", "quiero", "me gustaría"
    ],
    fr: [
      "bonjour", "salut", "merci", "s'il vous plaît", "excusez-moi", "désolé",
      "oui", "non", "bon matin", "bon après-midi", "bonsoir",
      "comment allez-vous", "ravi de vous rencontrer", "au revoir", "à bientôt",
      "je ne comprends pas", "pouvez-vous m'aider", "où est", "combien",
      "quelle heure", "j'ai besoin", "je veux", "j'aimerais"
    ]
  };

  constructor(options: StreamingTranslationOptions = {}) {
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.cacheExpiryMs = options.cacheExpiryMs || 1000 * 60 * 30; // 30 minutes
    this.adaptiveDelay = options.adaptiveDelay || true;
    
    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  private getCacheKey(text: string, source: string, target: string): string {
    return `${text.toLowerCase().trim()}|${source}|${target}`;
  }

  private cleanupCache(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      const age = now.getTime() - cached.timestamp.getTime();
      if (age > this.cacheExpiryMs) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove least accessed items
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private recordTranslationTime(duration: number): void {
    this.translationTimes.push(duration);
    if (this.translationTimes.length > this.maxPerformanceHistory) {
      this.translationTimes.shift();
    }
  }

  private getAverageTranslationTime(): number {
    if (this.translationTimes.length === 0) return 200;
    return this.translationTimes.reduce((sum, time) => sum + time, 0) / this.translationTimes.length;
  }

  private shouldPrefetch(text: string): boolean {
    // Prefetch if text is short and common-looking
    return text.length < 50 && /^[a-zA-Z\s,.'?!]+$/.test(text);
  }

  async translateWithCache(request: TranslationRequest): Promise<TranslationResult> {
    const { text, source, target } = request;
    const cacheKey = this.getCacheKey(text, source, target);
    const startTime = performance.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.accessCount++;
      cached.timestamp = new Date(); // Update access time
      console.log(`🚀 Cache hit for: "${text}" (${performance.now() - startTime}ms)`);
      return {
        ...cached.result,
        latencyMs: performance.now() - startTime
      };
    }

    // Not in cache, translate
    try {
      const result = await translateText(request);
      const duration = performance.now() - startTime;

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: new Date(),
        accessCount: 1
      });

      // Record performance
      this.recordTranslationTime(duration);

      // Trigger prefetching if appropriate
      if (this.shouldPrefetch(text)) {
        this.enqueuePrefetch(text, source, target);
      }

      console.log(`⚡ Fresh translation for: "${text}" (${duration}ms)`);
      return result;

    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  private enqueuePrefetch(baseText: string, source: string, target: string): void {
    // Add variations to prefetch queue
    const variations = [
      baseText + "?",
      baseText + ".",
      baseText + "!",
      "what is " + baseText,
      "where is " + baseText,
    ];

    variations.forEach(variation => {
      const cacheKey = this.getCacheKey(variation, source, target);
      if (!this.cache.has(cacheKey) && !this.prefetchQueue.includes(cacheKey)) {
        this.prefetchQueue.push(cacheKey);
      }
    });

    this.processPrefetchQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.isProcessingQueue || this.prefetchQueue.length === 0) return;
    
    this.isProcessingQueue = true;

    // Process up to 3 prefetch items at a time to avoid overloading
    const batchSize = Math.min(3, this.prefetchQueue.length);
    const batch = this.prefetchQueue.splice(0, batchSize);

    const prefetchPromises = batch.map(async (cacheKey) => {
      try {
        const [text, source, target] = cacheKey.split('|');
        await this.translateWithCache({ text, source, target });
        console.log(`🔮 Prefetched: "${text}"`);
      } catch (error) {
        console.log(`❌ Prefetch failed for: ${cacheKey}`);
      }
    });

    await Promise.allSettled(prefetchPromises);

    this.isProcessingQueue = false;

    // Continue processing if more items in queue
    if (this.prefetchQueue.length > 0) {
      setTimeout(() => this.processPrefetchQueue(), 100);
    }
  }

  async prefetchCommonPhrases(sourceLanguage: string, targetLanguage: string): Promise<void> {
    const sourcePhrases = this.commonPhrases[sourceLanguage as keyof typeof this.commonPhrases] || [];
    const targetPhrases = this.commonPhrases[targetLanguage as keyof typeof this.commonPhrases] || [];

    // Prefetch in both directions
    const allPrefetchRequests = [
      ...sourcePhrases.map(phrase => ({ text: phrase, source: sourceLanguage, target: targetLanguage })),
      ...targetPhrases.map(phrase => ({ text: phrase, source: targetLanguage, target: sourceLanguage }))
    ];

    console.log(`🔮 Starting prefetch of ${allPrefetchRequests.length} common phrases`);

    // Process in small batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < allPrefetchRequests.length; i += batchSize) {
      const batch = allPrefetchRequests.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(request => this.translateWithCache(request))
      );

      // Small delay between batches
      if (i + batchSize < allPrefetchRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Completed prefetching common phrases`);
  }

  getPerformanceStats() {
    return {
      cacheSize: this.cache.size,
      averageTranslationTime: this.getAverageTranslationTime(),
      cacheHitRate: this.translationTimes.length > 0 ? 
        (this.cache.size / (this.cache.size + this.translationTimes.length)) : 0,
      prefetchQueueSize: this.prefetchQueue.length
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.prefetchQueue = [];
    console.log("Translation cache cleared");
  }
}

// Create singleton instance
export const streamingTranslationService = new StreamingTranslationService({
  maxCacheSize: 2000,
  cacheExpiryMs: 1000 * 60 * 60, // 1 hour
  prefetchCommonPhrases: true,
  adaptiveDelay: true
});

// Export convenience function
export const translateWithStreaming = (request: TranslationRequest): Promise<TranslationResult> => {
  return streamingTranslationService.translateWithCache(request);
};