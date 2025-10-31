/**
 * Safari-specific Speech Recognition compatibility layer
 * Handles iOS/macOS Safari quirks and permission requirements
 */

export const getSafariSpeechRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition = 
    window.SpeechRecognition || 
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;
  
  return SpeechRecognition;
};

export const isSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  const isSafariUA = /safari/.test(ua) && !/chrome|chromium|crios/.test(ua);
  const isWebkitOnly = /webkit/.test(ua) && !/blink/.test(ua);
  
  return isSafariUA || isWebkitOnly;
};

export const isIOSSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/crios|fxios|chrome|edge/.test(ua);
};

export const isMacSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  return /macintosh/.test(ua) && /safari/.test(ua) && !/chrome|chromium|crios/.test(ua);
};

/**
 * Request Safari-specific microphone permissions
 * iOS Safari requires explicit user gesture (click/tap)
 */
export const requestSafariMicrophonePermission = async (): Promise<boolean> => {
  try {
    console.log('🎤 Requesting Safari microphone permission...');
    
    // For iOS Safari, we need to actually try to access the microphone
    // This will trigger the permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      // Explicitly NOT requesting video
    });
    
    // Stop the stream immediately - we only needed it for permission
    stream.getTracks().forEach(track => track.stop());
    
    console.log('✅ Safari microphone permission granted');
    return true;
  } catch (error) {
    console.error('❌ Safari microphone permission denied:', error);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error(
          `🚫 Microphone permission denied.\n\n` +
          `📱 iOS Safari fix:\n` +
          `1. Open Settings → Safari\n` +
          `2. Find "Microphone" setting\n` +
          `3. Change from "Ask" to "Allow"\n` +
          `4. Return to app and reload\n\n` +
          `🖥️ macOS Safari fix:\n` +
          `1. Go to System Preferences → Security & Privacy\n` +
          `2. Click "Microphone"\n` +
          `3. Allow Safari to access microphone\n` +
          `4. Reload the page`
        );
      } else if (error.name === 'NotFoundError') {
        throw new Error(
          `🎤 No microphone found.\n\n` +
          `Please ensure:\n` +
          `• Microphone is connected and enabled\n` +
          `• No other app is using the microphone\n` +
          `• Refresh the page and try again`
        );
      } else if (error.name === 'NotReadableError') {
        throw new Error(
          `⚠️ Microphone is busy.\n\n` +
          `Please:\n` +
          `1. Close other apps using the microphone\n` +
          `2. Restart Safari\n` +
          `3. Try again`
        );
      }
    }
    
    return false;
  }
};

/**
 * Configure Safari-specific speech recognition
 */
export const configureSafariSpeechRecognition = (recognition: any): void => {
  // Safari-specific configurations
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;
  
  // Some Safari versions require lower timeouts
  if (isIOSSafari()) {
    console.log('📱 Configuring for iOS Safari...');
    // iOS Safari can be finicky with timeouts
    recognition.maxAlternatives = 1;
  }
  
  if (isMacSafari()) {
    console.log('🖥️ Configuring for macOS Safari...');
    // macOS Safari generally works better
  }
};

/**
 * Check if speech recognition is available and working
 */
export const checkSpeechRecognitionAvailable = (): {
  available: boolean;
  reason: string;
  browser: string;
} => {
  const SpeechRecognition = getSafariSpeechRecognition();
  
  if (!SpeechRecognition) {
    return {
      available: false,
      reason: 'Speech Recognition API not available in this browser',
      browser: navigator.userAgent,
    };
  }
  
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    return {
      available: false,
      reason: 'Speech Recognition requires HTTPS or localhost',
      browser: `${window.location.protocol}//${window.location.hostname}`,
    };
  }
  
  return {
    available: true,
    reason: 'Speech Recognition is available',
    browser: isSafari() ? 'Safari' : 'Other Webkit Browser',
  };
};

/**
 * Detect if running in private/incognito mode (Safari specific)
 */
export const isPrivateMode = async (): Promise<boolean> => {
  try {
    const test = localStorage.setItem('_private_test', 'test');
    localStorage.removeItem('_private_test');
    return false;
  } catch (e) {
    return true;
  }
};

/**
 * Handle Safari-specific speech recognition restart
 */
export const restartSafariSpeechRecognition = (recognition: any): void => {
  try {
    // Stop gracefully
    recognition.stop();
  } catch (e) {
    console.log('Recognition already stopped');
  }
  
  // Small delay before restart for Safari
  setTimeout(() => {
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to restart recognition:', e);
    }
  }, 100);
};

/**
 * Safari-specific error handler with detailed messages
 */
export const handleSafariSpeechError = (error: string): string => {
  const errorMessages: Record<string, string> = {
    'no-speech': '⏸️ No speech detected. Please try speaking again.',
    'audio-capture': 
      '🎤 Microphone not working.\n\n' +
      'Try:\n' +
      '1. Reload the page\n' +
      '2. Check microphone permissions\n' +
      '3. Try a different browser (Chrome/Edge)',
    'not-allowed': 
      '🚫 Microphone access not allowed.\n\n' +
      '📱 iOS: Settings → Safari → Microphone → Allow\n' +
      '🖥️ macOS: System Prefs → Security → Microphone',
    'service-not-allowed':
      '🚫 Speech recognition service not allowed.\n\n' +
      'This usually means:\n' +
      '• Using HTTP instead of HTTPS\n' +
      '• Using private/incognito mode\n' +
      '• Browser blocking speech API\n\n' +
      'Try:\n' +
      '1. Use https:// (not http://)\n' +
      '2. Use regular browsing mode (not private)\n' +
      '3. Check browser security settings',
    'network': 
      '🌐 Network error. Please check your internet connection.',
    'aborted':
      '⏹️ Speech recognition stopped.',
    'service-not-available':
      '⚠️ Speech recognition service is not available.\n\n' +
      'This is usually temporary. Try:\n' +
      '1. Wait a moment and try again\n' +
      '2. Reload the page\n' +
      '3. Restart the browser',
  };
  
  return errorMessages[error] || `❌ Speech error: ${error}`;
};

/**
 * Enable Safari debugging for speech recognition
 */
export const enableSpeechRecognitionDebug = (recognition: any): void => {
  const originalOnStart = recognition.onstart;
  const originalOnResult = recognition.onresult;
  const originalOnError = recognition.onerror;
  const originalOnEnd = recognition.onend;
  
  recognition.onstart = function(...args: any[]) {
    console.log('🎤 [Safari] Speech recognition started');
    originalOnStart?.apply(this, args);
  };
  
  recognition.onresult = function(event: any) {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    console.log(`🎤 [Safari] Speech result: ${transcript} (isFinal: ${event.results[event.results.length - 1].isFinal})`);
    originalOnResult?.apply(this, [event]);
  };
  
  recognition.onerror = function(event: any) {
    console.error(`❌ [Safari] Speech error: ${event.error}`);
    originalOnError?.apply(this, [event]);
  };
  
  recognition.onend = function(...args: any[]) {
    console.log('⏹️ [Safari] Speech recognition ended');
    originalOnEnd?.apply(this, args);
  };
};
