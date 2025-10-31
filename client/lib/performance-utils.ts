/**
 * Performance Optimization Utilities
 * Lazy loading, caching, debouncing, and responsive image handling
 */

/**
 * Debounce function to limit function calls
 * Useful for resize, scroll, and input events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 * Useful for scroll and resize events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images with intersection observer
 */
export const lazyLoadImages = (): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => imageObserver.observe(img));
  }
};

/**
 * Prefetch important resources
 */
export const prefetchResources = (urls: string[]): void => {
  if ('link' in document) {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

/**
 * Preload critical resources
 */
export const preloadResources = (urls: string[]): void => {
  if ('link' in document) {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      if (url.endsWith('.woff2')) link.as = 'font';
      if (url.endsWith('.js')) link.as = 'script';
      if (url.endsWith('.css')) link.as = 'style';
      if (url.endsWith('.woff')) link.type = 'font/woff';
      if (url.endsWith('.woff2')) link.type = 'font/woff2';
      document.head.appendChild(link);
    });
  }
};

/**
 * Simple memory cache with TTL (time to live)
 */
export class CacheWithTTL<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttlMs: number = 3600000): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Request animation frame debounce for smooth scrolling
 */
export const rafDebounce = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number;
  return (...args: Parameters<T>) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => func(...args));
  };
};

/**
 * Batch DOM updates for better performance
 */
export const batchDOMUpdates = (updates: (() => void)[]): void => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

/**
 * Measure performance metric
 */
export const measurePerformance = (label: string): (() => number) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    const duration = end - start;
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  };
};

/**
 * Get memory usage (if available)
 */
export const getMemoryUsage = (): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null => {
  if ((performance as any).memory) {
    return {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

/**
 * Get network information
 */
export const getNetworkInfo = (): {
  type: string;
  effectiveType: string;
  rtt: number;
  downlink: number;
} | null => {
  const connection = (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return null;

  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    rtt: connection.rtt,
    downlink: connection.downlink,
  };
};

/**
 * Detect if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detect if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get effective connection type
 */
export const getEffectiveConnectionType = (): '4g' | '3g' | '2g' | 'slow-2g' | 'unknown' => {
  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';
  return connection.effectiveType;
};

/**
 * Should reduce animations based on connection
 */
export const shouldReduceAnimations = (): boolean => {
  return prefersReducedMotion() || getEffectiveConnectionType() === 'slow-2g' || getEffectiveConnectionType() === '3g';
};

/**
 * Optimize images for responsive display
 */
export const getResponsiveImageSrc = (
  baseUrl: string,
  width: number,
  quality: 'low' | 'medium' | 'high' = 'medium'
): string => {
  const qualities = { low: 50, medium: 75, high: 95 };
  // This assumes you have an image optimization service
  // For Netlify, this could be Netlify Image CDN
  return `${baseUrl}?w=${width}&q=${qualities[quality]}`;
};

/**
 * Check if device is low-end (low memory)
 */
export const isLowEndDevice = (): boolean => {
  // Check available memory (if available)
  const memory = getMemoryUsage();
  if (memory && memory.jsHeapSizeLimit < 268435456) { // < 256MB
    return true;
  }

  // Check connection
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === '3g' || connection.effectiveType === '2g')) {
    return true;
  }

  // Check processor count
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return true;
  }

  return false;
};

/**
 * Adaptive loading based on device capabilities
 */
export const getAdaptiveLoadingStrategy = (): {
  loadImages: boolean;
  loadVideos: boolean;
  useAnimations: boolean;
  useHighQuality: boolean;
  prefetchData: boolean;
} => {
  const isLowEnd = isLowEndDevice();
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';

  return {
    loadImages: !isLowEnd,
    loadVideos: !isLowEnd && (effectiveType === '4g'),
    useAnimations: !prefersReducedMotion() && !isLowEnd,
    useHighQuality: !isLowEnd && (effectiveType === '4g'),
    prefetchData: effectiveType === '4g' && !isLowEnd,
  };
};

/**
 * Report Core Web Vitals
 */
export const reportWebVitals = (callback: (metric: any) => void): void => {
  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        callback({ type: 'LCP', value: lastEntry.renderTime || lastEntry.loadTime });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP observer not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            callback({ type: 'CLS', value: clsValue });
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS observer not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          callback({ type: 'FID', value: (entry as any).processingDuration });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID observer not supported
    }
  }
};

/**
 * Setup service worker for offline support
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.warn('❌ Service Worker registration failed:', error);
    }
  }
};
