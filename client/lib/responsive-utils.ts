/**
 * Responsive design utilities for all screen sizes including wearables
 * Breakpoints:
 * - xs: 0-320px (small phones)
 * - sm: 320-640px (standard phones)
 * - md: 640-1024px (tablets)
 * - lg: 1024-1280px (large tablets/desktops)
 * - xl: 1280px+ (large desktops)
 * - 2xl: 1536px+ (extra large desktops)
 */

export const VIEWPORT_SIZES = {
  xs: 0,      // Small phones (320px)
  sm: 320,    // Standard phones (640px)
  md: 640,    // Tablets (1024px)
  lg: 1024,   // Large tablets (1280px)
  xl: 1280,   // Desktops (1536px)
  '2xl': 1536 // Extra large desktops
} as const;

export const DEVICE_TYPES = {
  smartwatch: 400,      // Smartwatch (< 400px)
  smallPhone: 600,      // Small phone (< 600px)
  phone: 768,           // Standard phone (< 768px)
  tablet: 1024,         // Tablet (< 1024px)
  desktop: 1280,        // Desktop (>= 1280px)
} as const;

/**
 * Detect current viewport size
 */
export const getViewportSize = (width: number): keyof typeof DEVICE_TYPES => {
  if (width < DEVICE_TYPES.smartwatch) return 'smartwatch';
  if (width < DEVICE_TYPES.smallPhone) return 'smallPhone';
  if (width < DEVICE_TYPES.phone) return 'phone';
  if (width < DEVICE_TYPES.tablet) return 'tablet';
  return 'desktop';
};

/**
 * Check if current screen is mobile/touch device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            ((navigator as any).msMaxTouchPoints > 0));
  };
  
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  return isMobileUA || isTouchDevice();
};

/**
 * Check if screen is small (smartwatch/small phone)
 */
export const isSmallScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 600;
};

/**
 * Check if screen is wearable (smartwatch size)
 */
export const isWearableScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 400;
};

/**
 * Check if screen is tablet or larger
 */
export const isTabletOrLarger = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768;
};

/**
 * Get appropriate font size for viewport
 */
export const getResponsiveFontSize = (width: number): Record<string, string> => {
  if (width < 400) {
    return {
      h1: 'text-xl sm:text-2xl',
      h2: 'text-lg sm:text-xl',
      h3: 'text-base sm:text-lg',
      body: 'text-xs sm:text-sm',
      small: 'text-xs'
    };
  } else if (width < 768) {
    return {
      h1: 'text-2xl sm:text-3xl',
      h2: 'text-xl sm:text-2xl',
      h3: 'text-lg sm:text-xl',
      body: 'text-sm sm:text-base',
      small: 'text-xs sm:text-sm'
    };
  } else {
    return {
      h1: 'text-4xl sm:text-5xl',
      h2: 'text-2xl sm:text-3xl',
      h3: 'text-xl sm:text-2xl',
      body: 'text-base sm:text-lg',
      small: 'text-sm sm:text-base'
    };
  }
};

/**
 * Get appropriate spacing for viewport
 */
export const getResponsiveSpacing = (width: number): Record<string, string> => {
  if (width < 400) {
    return {
      containerPadding: 'px-2 py-4',
      sectionGap: 'gap-3',
      componentGap: 'gap-2',
      buttonSize: 'h-8 px-2 text-xs'
    };
  } else if (width < 768) {
    return {
      containerPadding: 'px-4 py-6',
      sectionGap: 'gap-4',
      componentGap: 'gap-3',
      buttonSize: 'h-10 px-3 text-sm'
    };
  } else {
    return {
      containerPadding: 'px-6 py-8',
      sectionGap: 'gap-6',
      componentGap: 'gap-4',
      buttonSize: 'h-12 px-4 text-base'
    };
  }
};

/**
 * Check browser support for Web APIs
 */
export const checkBrowserSupport = (): {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaDevices: boolean;
  vibration: boolean;
  serviceWorker: boolean;
} => {
  if (typeof window === 'undefined') {
    return {
      speechRecognition: false,
      speechSynthesis: false,
      mediaDevices: false,
      vibration: false,
      serviceWorker: false,
    };
  }

  return {
    speechRecognition: !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition),
    speechSynthesis: !!window.speechSynthesis,
    mediaDevices: !!navigator.mediaDevices?.getUserMedia,
    vibration: !!navigator.vibrate,
    serviceWorker: 'serviceWorker' in navigator,
  };
};

/**
 * Optimize button size based on screen
 */
export const getButtonSize = (width: number): 'sm' | 'md' | 'lg' => {
  if (width < 400) return 'sm';
  if (width < 768) return 'md';
  return 'lg';
};

/**
 * Get padding for touch targets (minimum 44x44px for mobile, 48x48px recommended)
 */
export const getTouchTargetPadding = (width: number): string => {
  if (width < 768) {
    return 'min-h-11 min-w-11'; // 44x44px minimum
  }
  return 'min-h-12 min-w-12'; // 48x48px for larger screens
};
