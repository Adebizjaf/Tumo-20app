import { useState, useEffect, useRef, useCallback } from "react";
import { translateText } from "@/lib/translation-engine";
import { StreamingTranslator, COMMON_CONVERSATION_PHRASES } from "@/lib/streaming-translation";
import {
  isSafari,
  isIOSSafari,
  requestSafariMicrophonePermission,
  configureSafariSpeechRecognition,
  handleSafariSpeechError,
  checkSpeechRecognitionAvailable,
} from "@/lib/safari-speech-compat";

interface SpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  speaker?: 'A' | 'B';
}

interface UseDualSpeechRecognitionProps {
  isActive: boolean;
  speakerALanguage: string;
  speakerBLanguage: string;
  onSpeechResult?: (result: SpeechResult & { 
    translatedText?: string; 
    detectedLanguage?: string;
  }) => void;
  onSpeakerChange?: (speaker: 'A' | 'B' | null) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Convert language codes to speech recognition compatible format (BCP 47)
const getLangCode = (langCode: string): string => {
  const langMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'pt': 'pt-BR',
    'it': 'it-IT',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'tr': 'tr-TR',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'no': 'no-NO',
    'yo': 'en-US', // Yoruba fallback to English
  };
  return langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
};

export const useDualSpeechRecognition = ({
  isActive,
  speakerALanguage,
  speakerBLanguage,
  onSpeechResult,
  onSpeakerChange
}: UseDualSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B' | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const lastSpeechTimestamp = useRef<Date | null>(null);
  const speakerDetectionTimeout = useRef<NodeJS.Timeout>();
  const speechBuffer = useRef<string>('');
  const streamingTranslatorRef = useRef<StreamingTranslator | null>(null);

  // Detect which speaker is talking based on language patterns and timing
  const detectSpeaker = useCallback((text: string): 'A' | 'B' => {
    // Simple heuristic: detect language and assign to corresponding speaker
    const lowerText = text.toLowerCase();
    
    // Language-specific word patterns
    const languagePatterns = {
      en: /\b(the|and|is|to|a|in|that|have|i|it|for|not|on|with|he|as|you|do|at)\b/g,
      es: /\b(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al)\b/g,
      fr: /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se)\b/g,
      de: /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine)\b/g,
      pt: /\b(o|a|e|de|do|da|que|em|um|para|com|não|uma|os|no|se|na|por|mais|as|dos)\b/g,
    };
    
    // Count matches for each language
    const speakerAMatches = (languagePatterns[speakerALanguage as keyof typeof languagePatterns] || /(?:)/g);
    const speakerBMatches = (languagePatterns[speakerBLanguage as keyof typeof languagePatterns] || /(?:)/g);
    
    const aCount = (text.match(speakerAMatches) || []).length;
    const bCount = (text.match(speakerBMatches) || []).length;
    
    // If unclear, use timing and alternation logic
    if (aCount === bCount) {
      // Alternate speakers if no clear language indicator
      return currentSpeaker === 'A' ? 'B' : 'A';
    }
    
    return aCount > bCount ? 'A' : 'B';
  }, [speakerALanguage, speakerBLanguage, currentSpeaker]);

  // Store the latest speaker in a ref to avoid recreating the translator
  const currentSpeakerRef = useRef<'A' | 'B' | null>(null);
  
  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  // Initialize streaming translator (only when isActive changes or languages change)
  useEffect(() => {
    if (isActive) {
      // Don't recreate if already exists
      if (!streamingTranslatorRef.current) {
        console.log('🔄 Initializing streaming translator...');
        streamingTranslatorRef.current = new StreamingTranslator(
          {
            minChunkLength: 8, // Start translating after 8 characters for conversation
            maxDelay: 150, // 150ms max delay for responsive conversation
            predictiveTranslation: true,
            cacheResults: true
          },
          {
            onPartialResult: (result) => {
              // Send partial results for live captions using current speaker from ref
              onSpeechResult?.({
                text: speechBuffer.current,
                confidence: result.confidence || 0.5,
                isFinal: false,
                timestamp: new Date(),
                speaker: currentSpeakerRef.current || 'A',
                translatedText: result.text,
                detectedLanguage: result.detectedLanguage
              });
            },
            onFinalResult: (result) => {
              console.log('✅ Final translation result:', result);
              onSpeechResult?.({
                text: speechBuffer.current,
                confidence: result.confidence,
                isFinal: true,
                timestamp: new Date(),
                speaker: currentSpeakerRef.current || 'A',
                translatedText: result.text,
                detectedLanguage: result.detectedLanguage
              });
            }
          }
        );

        // Preload common phrases for both languages
        const phrases = [
          ...(COMMON_CONVERSATION_PHRASES[speakerALanguage as keyof typeof COMMON_CONVERSATION_PHRASES] || []),
          ...(COMMON_CONVERSATION_PHRASES[speakerBLanguage as keyof typeof COMMON_CONVERSATION_PHRASES] || [])
        ];

        streamingTranslatorRef.current.preloadCommonPhrases(phrases, speakerALanguage, speakerBLanguage);
        streamingTranslatorRef.current.preloadCommonPhrases(phrases, speakerBLanguage, speakerALanguage);
      }
    } else {
      if (streamingTranslatorRef.current) {
        console.log('🛑 Disposing streaming translator...');
        streamingTranslatorRef.current.dispose();
        streamingTranslatorRef.current = null;
      }
    }

    return () => {
      if (streamingTranslatorRef.current) {
        streamingTranslatorRef.current.dispose();
        streamingTranslatorRef.current = null;
      }
    };
  }, [isActive, speakerALanguage, speakerBLanguage, onSpeechResult]);

  // Initialize speech recognition
  // Check microphone permissions before starting
  const checkMicrophonePermissions = async (): Promise<boolean> => {
    try {
      // Check Safari-specific availability
      const availability = checkSpeechRecognitionAvailable();
      if (!availability.available) {
        setError(`❌ Speech Recognition not available: ${availability.reason}`);
        return false;
      }

      // For Safari, especially iOS, request microphone permission explicitly
      if (isSafari()) {
        try {
          const hasPermission = await requestSafariMicrophonePermission();
          if (!hasPermission) {
            return false;
          }
        } catch (safariError) {
          setError(safariError instanceof Error ? safariError.message : 'Failed to get microphone permission');
          return false;
        }
      }

      // First, check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media devices not available. Please use HTTPS or localhost.');
        return false;
      }

      // Check if any audio input devices are available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        console.log('🎤 Available audio input devices:', audioInputs.length);
        
        if (audioInputs.length === 0) {
          setError('No microphone detected on this device. Please:\n\n1. Connect a microphone or headset\n2. Check if your microphone is enabled in system settings\n3. Refresh the page after connecting a microphone');
          return false;
        }
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
        // Continue anyway, getUserMedia will give us a better error
      }

      // Check permissions API if available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🔐 Microphone permission status:', permission.state);
          
          if (permission.state === 'denied') {
            setError('🚫 Microphone access is blocked. Please:\n\n1. Click the 🔒 lock icon in your browser address bar\n2. Find "Microphone" permissions\n3. Change to "Allow"\n4. Refresh the page');
            return false;
          }
        } catch (permError) {
          console.warn('Permissions API not available:', permError);
        }
      }

      // Try to access microphone to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      // Stop the stream immediately as we only needed it for permission check
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('❌ Microphone access error:', err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          // For Safari, provide more specific guidance
          if (isSafari() && isIOSSafari()) {
            setError('🚫 Microphone access denied on iOS Safari.\n\n📱 To fix:\n1. Go to Settings → Safari\n2. Scroll down to find "Microphone" in privacy settings\n3. Change from "Ask" to "Allow"\n4. Return to this app and reload\n5. You may need to grant permission again when prompted');
          } else {
            setError('🚫 Microphone access denied. Please:\n\n1. Click the 🔒 lock icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again');
          }
        } else if (err.name === 'NotFoundError') {
          setError('🎤 No microphone found. Please:\n\n1. Connect a microphone or headset to your device\n2. Check System Settings → Sound → Input to verify it\'s recognized\n3. Make sure the microphone is not disabled\n4. Refresh the page after connecting\n\n💡 Tip: Built-in microphones on laptops should work automatically.');
        } else if (err.name === 'NotReadableError') {
          setError('⚠️ Microphone is busy. Please:\n\n1. Close other applications using the microphone (Zoom, Teams, etc.)\n2. Restart your browser\n3. Try again');
        } else if (err.name === 'OverconstrainedError') {
          setError('⚙️ Microphone configuration issue. Please try a different microphone or check system settings.');
        } else {
          setError(`❌ Microphone error: ${err.name}\n\n${err.message || 'Unknown error'}`);
        }
      } else {
        setError('❌ Failed to access microphone. Please check your device and browser settings.\n\nTry:\n1. Using Chrome, Edge, or Safari\n2. Granting microphone permissions\n3. Connecting a microphone device');
      }
      return false;
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
        setIsListening(false);
        recognitionRef.current = null;
      }
      setError(null); // Clear errors when stopping
      return;
    }

    // Initialize speech recognition when active
    const initializeSpeechRecognition = async () => {
      console.log('🚀 Initializing speech recognition...');
      console.log('📍 isActive:', isActive);
      console.log('📍 Speaker A language:', speakerALanguage);
      console.log('📍 Speaker B language:', speakerBLanguage);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ SpeechRecognition API not available');
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      
      console.log('✅ SpeechRecognition API available');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Use primary speaker's language for recognition (Web Speech API doesn't support 'auto')
    // The API will still recognize other languages, just optimized for this one
    recognition.lang = getLangCode(speakerALanguage) || 'en-US';
    recognition.maxAlternatives = 1;
    
    // Apply Safari-specific configurations
    if (isSafari()) {
      console.log('🔧 Applying Safari-specific configurations...');
      configureSafariSpeechRecognition(recognition);
    }
    
    console.log(`🎤 Speech recognition initialized with language: ${recognition.lang}`);

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('✅ Speech recognition started successfully');
      console.log(`🗣️ Listening for: Speaker A (${speakerALanguage}) ↔️ Speaker B (${speakerBLanguage})`);
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.resultIndex];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;
      
      console.log(`🎤 Speech ${isFinal ? 'FINAL' : 'interim'}:`, transcript, `(confidence: ${confidence?.toFixed(2) || 'N/A'})`);
      
      // Update speech buffer
      if (isFinal) {
        speechBuffer.current = transcript;
      }

      // Detect speaker
      const detectedSpeaker = detectSpeaker(transcript);
      
      console.log(`👤 Detected speaker: ${detectedSpeaker}`);
      
      // Update current speaker and notify parent
      if (detectedSpeaker !== currentSpeakerRef.current) {
        setCurrentSpeaker(detectedSpeaker);
        currentSpeakerRef.current = detectedSpeaker;
        onSpeakerChange?.(detectedSpeaker);
      }

      // Clear speaker detection timeout and set new one
      if (speakerDetectionTimeout.current) {
        clearTimeout(speakerDetectionTimeout.current);
      }
      
      speakerDetectionTimeout.current = setTimeout(() => {
        setCurrentSpeaker(null);
        currentSpeakerRef.current = null;
        onSpeakerChange?.(null);
      }, 2000); // Clear speaker after 2 seconds of silence

      const result: SpeechResult = {
        text: transcript,
        confidence: confidence || 0.8,
        isFinal,
        timestamp: new Date(),
        speaker: detectedSpeaker
      };

      // Use streaming translator for both interim and final results
      if (transcript.trim() && streamingTranslatorRef.current) {
        const targetLanguage = detectedSpeaker === 'A' ? speakerBLanguage : speakerALanguage;
        const sourceLanguage = detectedSpeaker === 'A' ? speakerALanguage : speakerBLanguage;
        
        console.log(`🔄 Translating: ${sourceLanguage} → ${targetLanguage}`, transcript.substring(0, 50) + '...');
        
        // Process with streaming translator
        streamingTranslatorRef.current.processPartialSpeech(
          transcript,
          sourceLanguage,
          targetLanguage,
          isFinal
        );
      } else if (!transcript.trim()) {
        // Send result without translation for empty text
        onSpeechResult?.(result);
      } else if (!streamingTranslatorRef.current) {
        console.warn('⚠️ Streaming translator not initialized!');
      }

      lastSpeechTimestamp.current = new Date();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Speech recognition error:', event.error, event.message);
      
      // Use Safari-specific error handling if on Safari
      if (isSafari()) {
        const safariErrorMessage = handleSafariSpeechError(event.error);
        
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log(safariErrorMessage);
        } else {
          setError(safariErrorMessage);
        }
        return;
      }
      
      // Enhanced error messages with troubleshooting for other browsers
      const errorMapping: Record<string, string> = {
        'not-allowed': `🚫 Speech recognition service not allowed. ⚠️ Common causes: 1. NOT using HTTPS or localhost • Must be: https://... OR http://localhost:... • Cannot be: http://... (insecure) 2. Browser doesn't support speech recognition • ✅ Use: Chrome, Edge, or Safari • ❌ Don't use: Firefox (not supported) 3. Browser settings blocking microphone • Open browser settings • Search for 'microphone' • Allow access for this site 4. Using private/incognito mode • Try regular browsing mode • Some features are restricted in private mode 💡 Quick Fix: • If on localhost, reload the page • If not localhost, make sure URL starts with 'https://' • Try Chrome if using another browser`,
        'service-not-allowed': `🚫 Speech recognition service not allowed. ⚠️ Common causes: 1. NOT using HTTPS or localhost • Must be: https://... OR http://localhost:... • Cannot be: http://... (insecure) 2. Browser doesn't support speech recognition • ✅ Use: Chrome, Edge, or Safari • ❌ Don't use: Firefox (not supported) 3. Browser settings blocking microphone • Open browser settings • Search for 'microphone' • Allow access for this site 4. Using private/incognito mode • Try regular browsing mode • Some features are restricted in private mode 💡 Quick Fix: • If on localhost, reload the page • If not localhost, make sure URL starts with 'https://' • Try Chrome if using another browser`,
        'no-speech': '⏸️ No speech detected, continuing...',
        'aborted': '⏹️ Speech recognition aborted',
        'audio-capture': '🎤 Audio capture failed. Please check your microphone connection, ensure it\'s not being used by another app, and try again.',
        'network': '🌐 Network error. Speech recognition requires an internet connection.',
        'bad-grammar': '⚠️ Speech recognition grammar error. Please refresh and try again.',
        'language-not-supported': `🌍 Language not supported: ${recognition.lang}. Try switching to a different language.`,
      };
      
      const errorMessage = errorMapping[event.error];
      
      if (event.error === 'no-speech' || event.error === 'aborted') {
        console.log(errorMessage);
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError(`❌ Speech recognition error: ${event.error}${event.message ? ' - ' + event.message : ''}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('⏹️ Speech recognition ended');
      
      // Restart if still active (for continuous listening)
      if (isActive) {
        console.log('🔄 Restarting speech recognition for continuous mode...');
        setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('❌ Failed to restart speech recognition:', error);
              // If restart fails, it might be because recognition is already running
              if (error instanceof Error && error.message.includes('already started')) {
                console.log('ℹ️ Speech recognition already running');
              }
            }
          }
        }, 100);
      }
    };

      recognitionRef.current = recognition;
      
      try {
        console.log('🎬 Starting speech recognition...');
        recognition.start();
      } catch (error) {
        console.error('❌ Failed to start speech recognition:', error);
        if (error instanceof Error) {
          if (error.message.includes('already started')) {
            console.log('ℹ️ Speech recognition already running');
          } else {
            setError(`Failed to start: ${error.message}`);
          }
        } else {
          setError('Failed to start speech recognition. Please refresh and try again.');
        }
      }
    };

    // Initialize speech recognition
    initializeSpeechRecognition();

    return () => {
      if (speakerDetectionTimeout.current) {
        clearTimeout(speakerDetectionTimeout.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isActive, speakerALanguage, speakerBLanguage, detectSpeaker, onSpeechResult, onSpeakerChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speakerDetectionTimeout.current) {
        clearTimeout(speakerDetectionTimeout.current);
      }
    };
  }, []);

  return {
    isListening,
    error,
    currentSpeaker,
    restart: () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current && isActive) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    }
  };
};