// Enhanced offline cache system for translations
interface CachedTranslation {
  text: string;
  source: string;
  target: string;
  translatedText: string;
  timestamp: number;
  confidence: number;
  provider: string;
}

interface OfflineStatus {
  isOnline: boolean;
  lastOnlineTime: number;
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
}

class OfflineTranslationCache {
  private static instance: OfflineTranslationCache;
  private cache: Map<string, CachedTranslation> = new Map();
  private status: OfflineStatus = {
    isOnline: navigator.onLine,
    lastOnlineTime: Date.now(),
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  private readonly CACHE_PREFIX = 'tumo_translation_cache';
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of cached translations
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    this.loadFromLocalStorage();
    this.setupNetworkListeners();
    this.cleanExpiredCache();
  }

  public static getInstance(): OfflineTranslationCache {
    if (!OfflineTranslationCache.instance) {
      OfflineTranslationCache.instance = new OfflineTranslationCache();
    }
    return OfflineTranslationCache.instance;
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.status.lastOnlineTime = Date.now();
      console.log('🌐 Back online! Translation cache ready for sync.');
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      console.log('📴 Offline mode activated. Using cached translations.');
    });
  }

  private generateCacheKey(text: string, source: string, target: string): string {
    return `${source}-${target}:${text.toLowerCase().trim()}`;
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_PREFIX);
      if (stored) {
        const data: CachedTranslation[] = JSON.parse(stored);
        data.forEach(item => {
          const key = this.generateCacheKey(item.text, item.source, item.target);
          this.cache.set(key, item);
        });
        this.status.cacheSize = this.cache.size;
        console.log(`📦 Loaded ${this.cache.size} translations from offline cache`);
      }
    } catch (error) {
      console.warn('Failed to load offline translation cache:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(this.CACHE_PREFIX, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save offline translation cache:', error);
      // If storage is full, clear oldest entries
      this.clearOldestEntries(100);
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.status.cacheSize = this.cache.size;
      this.saveToLocalStorage();
      console.log(`🧹 Cleaned ${cleaned} expired translations from cache`);
    }
  }

  private clearOldestEntries(count: number): void {
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < count && i < sortedEntries.length; i++) {
      this.cache.delete(sortedEntries[i][0]);
    }
    
    this.status.cacheSize = this.cache.size;
    this.saveToLocalStorage();
  }

  public get(text: string, source: string, target: string): CachedTranslation | null {
    const key = this.generateCacheKey(text, source, target);
    const cached = this.cache.get(key);
    
    if (cached) {
      this.status.cacheHits++;
      return cached;
    }
    
    this.status.cacheMisses++;
    return null;
  }

  public set(text: string, source: string, target: string, translatedText: string, confidence: number, provider: string): void {
    const key = this.generateCacheKey(text, source, target);
    
    // Check cache size and clean if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.clearOldestEntries(100);
    }
    
    const cached: CachedTranslation = {
      text,
      source,
      target,
      translatedText,
      timestamp: Date.now(),
      confidence,
      provider: `${provider} (cached)`
    };
    
    this.cache.set(key, cached);
    this.status.cacheSize = this.cache.size;
    
    // Debounced save to localStorage
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveToLocalStorage(), 1000);
  }

  private saveTimeout?: NodeJS.Timeout;

  public getStatus(): OfflineStatus {
    return { ...this.status };
  }

  public clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(this.CACHE_PREFIX);
    this.status.cacheSize = 0;
    this.status.cacheHits = 0;
    this.status.cacheMisses = 0;
    console.log('🗑️ Translation cache cleared');
  }

  public exportCache(): CachedTranslation[] {
    return Array.from(this.cache.values());
  }

  public importCache(translations: CachedTranslation[]): void {
    translations.forEach(item => {
      const key = this.generateCacheKey(item.text, item.source, item.target);
      this.cache.set(key, item);
    });
    this.status.cacheSize = this.cache.size;
    this.saveToLocalStorage();
    console.log(`📥 Imported ${translations.length} translations to cache`);
  }
}

// Export singleton instance
export const offlineCache = OfflineTranslationCache.getInstance();

// Enhanced offline detection
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

export const getNetworkStatus = () => {
  return offlineCache.getStatus();
};