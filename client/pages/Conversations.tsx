import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveCaptions } from "@/components/conversation/LiveCaptions";
import { useDualSpeechRecognition } from "@/hooks/use-dual-speech-recognition";
import { 
  Mic, 
  MicOff, 
  Play,
  Volume2,
  Languages,
  MessageCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationEntry {
  id: string;
  timestamp: Date;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
  confidence: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

const Conversations = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B' | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [speakerALanguage, setSpeakerALanguage] = useState('en');
  const [speakerBLanguage, setSpeakerBLanguage] = useState('es');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const conversationRef = useRef<HTMLDivElement>(null);

  // Convert language codes to speech synthesis compatible format
  const getVoiceLanguage = (langCode: string): string => {
    const voiceMap: Record<string, string> = {
      'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      'pt': 'pt-BR', 'it': 'it-IT', 'ja': 'ja-JP', 'ko': 'ko-KR',
      'zh': 'zh-CN', 'ru': 'ru-RU', 'ar': 'ar-SA', 'hi': 'hi-IN',
    };
    return voiceMap[langCode] || langCode;
  };

  // Real-time Text-to-Speech - ALWAYS plays audio
  const speakTranslation = async (text: string, language: string, speaker: 'A' | 'B') => {
    if (!text.trim()) return;
    
    try {
      if ('speechSynthesis' in window) {
        // Cancel any current speech to avoid overlap
        speechSynthesis.cancel();
        
        // Small delay for cancellation to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getVoiceLanguage(language);
        utterance.rate = 0.95;
        utterance.pitch = speaker === 'A' ? 0.9 : 1.1; // Different pitch for each speaker
        utterance.volume = 0.9;
        
        utterance.onstart = () => {
          setCurrentlyPlaying(`${speaker}-${Date.now()}`);
          console.log(`🔊 Speaking: "${text}" (${language})`);
        };
        
        utterance.onend = () => {
          setCurrentlyPlaying(null);
        };
        
        utterance.onerror = (error) => {
          console.error('Speech error:', error);
          setCurrentlyPlaying(null);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Text-to-speech failed:', error);
      setCurrentlyPlaying(null);
    }
  };

  // Speech recognition hook with real-time translation
  const { isListening, error: speechError } = useDualSpeechRecognition({
    isActive: isRecording,
    speakerALanguage,
    speakerBLanguage,
    onSpeechResult: (result) => {
      if (result.isFinal && result.text.trim() && result.translatedText) {
        const speaker = result.speaker || 'A';
        const targetLanguage = speaker === 'A' ? speakerBLanguage : speakerALanguage;
        
        const newEntry: ConversationEntry = {
          id: Date.now().toString(),
          timestamp: result.timestamp,
          speaker,
          originalText: result.text,
          translatedText: result.translatedText,
          originalLanguage: result.detectedLanguage || (speaker === 'A' ? speakerALanguage : speakerBLanguage),
          targetLanguage,
          confidence: result.confidence
        };
        
        setConversation(prev => [...prev, newEntry]);
        
        // 🎵 REAL-TIME AUDIO: Speak translation immediately
        speakTranslation(result.translatedText, targetLanguage, speaker);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          conversationRef.current?.scrollTo({
            top: conversationRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    },
    onSpeakerChange: (speaker) => {
      setCurrentSpeaker(speaker);
    }
  });

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        // 1️⃣ Check for secure context (HTTPS requirement)
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
        const protocol = location.protocol;
        const hostname = location.hostname;
        
        console.log(`🔒 Secure Context Check: isSecureContext=${isSecureContext}, protocol=${protocol}, hostname=${hostname}`);
        
        if (!isSecureContext && hostname !== 'localhost') {
          alert(`🚫 Speech recognition requires a secure connection (HTTPS).\n\nCurrent: ${protocol}//${hostname}\n\n✅ To fix:\n1. Make sure you're using https:// in the URL\n2. Check that SSL certificate is valid\n3. Try https://tumoo.netlify.app\n\nIf on localhost, use: http://localhost:8080`);
          return;
        }

        // 2️⃣ Check if speech recognition is available
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('❌ Speech recognition is not supported in this browser.\n\nPlease use:\n• Chrome (recommended)\n• Edge\n• Safari\n\nFirefox does not support Web Speech API.');
          return;
        }

        console.log('✅ Speech Recognition API available');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        
        console.log('✅ Microphone access granted');
        console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
        
        setAudioStream(stream);
        setIsRecording(true);
        console.log('🎬 Starting conversation recording with speech recognition');
      } catch (error) {
        console.error('❌ Failed to access microphone:', error);
        
        let errorMessage = 'Failed to access microphone.';
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            errorMessage = '🚫 Microphone access denied.\n\nPlease:\n1. Click the 🔒 icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page';
          } else if (error.name === 'NotFoundError') {
            errorMessage = '🎤 No microphone found.\n\nPlease:\n1. Connect a microphone\n2. Check system settings\n3. Refresh the page';
          } else if (error.name === 'NotReadableError') {
            errorMessage = '⚠️ Microphone is busy.\n\nPlease close other apps using the microphone and try again.';
          }
        }
        
        alert(errorMessage);
      }
    } else {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      setIsRecording(false);
      setCurrentSpeaker(null);
      console.log('⏹️ Stopping conversation recording');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* Hero Header */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <MessageCircle className="h-12 w-12 text-primary" />
              <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Live Conversation Mode
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time bilingual conversations with instant audio translation
          </p>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse text-base px-4 py-2">
              <div className="h-3 w-3 bg-white rounded-full mr-2 animate-pulse" />
              Recording Live
            </Badge>
          )}
        </div>

        {/* Language Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Speaker A */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-background to-blue-50/50 dark:from-blue-950/30 dark:via-background dark:to-blue-950/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Speaker A</span>
                {currentSpeaker === 'A' && isRecording && (
                  <Badge variant="secondary" className="ml-auto animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    Speaking
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  Language
                </label>
                <Select value={speakerALanguage} onValueChange={setSpeakerALanguage} disabled={isRecording}>
                  <SelectTrigger className="h-14 text-lg font-semibold border-blue-200 dark:border-blue-800 bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-lg">
                        <span className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Speaker B */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 via-background to-green-50/50 dark:from-green-950/30 dark:via-background dark:to-green-950/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">Speaker B</span>
                {currentSpeaker === 'B' && isRecording && (
                  <Badge variant="secondary" className="ml-auto animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    Speaking
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  Language
                </label>
                <Select value={speakerBLanguage} onValueChange={setSpeakerBLanguage} disabled={isRecording}>
                  <SelectTrigger className="h-14 text-lg font-semibold border-green-200 dark:border-green-800 bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-lg">
                        <span className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Captions */}
        {isRecording && (
          <LiveCaptions 
            captions={conversation.map(entry => ({
              id: entry.id,
              speaker: entry.speaker,
              originalText: entry.originalText,
              translatedText: entry.translatedText,
              confidence: entry.confidence,
              isFinal: true,
              timestamp: entry.timestamp,
              originalLanguage: entry.originalLanguage,
              targetLanguage: entry.targetLanguage
            }))}
            isActive={isRecording}
            speakerALanguage={speakerALanguage}
            speakerBLanguage={speakerBLanguage}
            currentSpeaker={currentSpeaker}
          />
        )}

        {/* Recording Control */}
        <div className="flex flex-col items-center gap-6 py-8">
          <Button
            size="lg"
            onClick={toggleRecording}
            className={cn(
              "h-32 w-32 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110",
              isRecording 
                ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse" 
                : "bg-gradient-to-br from-primary via-purple-500 to-primary hover:scale-110"
            )}
          >
            {isRecording ? (
              <MicOff className="h-16 w-16 text-white drop-shadow-lg" />
            ) : (
              <Mic className="h-16 w-16 text-white drop-shadow-lg" />
            )}
          </Button>
          
          <div className="text-center space-y-2">
            {isRecording ? (
              <>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                  <Volume2 className="h-6 w-6 animate-pulse" />
                  Listening for conversations...
                </p>
                <p className="text-muted-foreground">
                  Speak naturally • Translations play automatically
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold">Click to Start Recording</p>
                <p className="text-muted-foreground">
                  Press the microphone to begin real-time translation
                </p>
              </>
            )}
          </div>

          {currentlyPlaying && (
            <Badge variant="secondary" className="animate-pulse text-base px-4 py-2">
              <Volume2 className="h-4 w-4 mr-2" />
              Playing Translation Audio...
            </Badge>
          )}
        </div>

        {/* Microphone Error */}
        {speechError && (
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <MicOff className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-red-800 dark:text-red-200 text-lg">
                  Microphone Access Required
                </h3>
                <p className="text-red-700 dark:text-red-300 whitespace-pre-line">
                  {speechError}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="bg-white dark:bg-red-900/50"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Transcript */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-6 sm:p-8 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Live Transcript</h3>
                  <p className="text-sm text-muted-foreground">{conversation.length} messages</p>
                </div>
              </div>
              
              {conversation.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setConversation([]);
                    speechSynthesis.cancel();
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div 
              ref={conversationRef}
              className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            >
              {conversation.length === 0 ? (
                <div className="text-center py-16 space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <MessageCircle className="h-20 w-20 text-primary/30" />
                      <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-muted-foreground">
                      Ready for Real-Time Translation
                    </p>
                    <div className="max-w-md mx-auto space-y-2 text-sm text-muted-foreground bg-muted/30 rounded-xl p-6">
                      <p className="font-medium text-base mb-3">How it works:</p>
                      <p>🎤 Click the microphone to start recording</p>
                      <p>�️ Speak naturally in your language</p>
                      <p>✨ Instant translation with automatic audio playback</p>
                      <p>� Hear translations in real-time</p>
                      <p>💬 Full conversation history saved below</p>
                    </div>
                  </div>
                </div>
              ) : (
                conversation.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={cn(
                      "relative group animate-in fade-in slide-in-from-bottom-4 duration-500",
                      "overflow-hidden rounded-2xl border-2 p-5 shadow-md hover:shadow-xl transition-all duration-300",
                      entry.speaker === 'A' 
                        ? "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/30 dark:via-background dark:to-blue-950/10" 
                        : "border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 via-background to-green-50/30 dark:from-green-950/30 dark:via-background dark:to-green-950/10"
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-3 w-3 rounded-full",
                            entry.speaker === 'A' ? "bg-blue-500" : "bg-green-500"
                          )} />
                          <span className="font-bold text-lg">Speaker {entry.speaker}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {entry.originalLanguage.toUpperCase()} → {entry.targetLanguage.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                            onClick={() => speakTranslation(entry.translatedText, entry.targetLanguage, entry.speaker)}
                            disabled={currentlyPlaying?.includes(entry.speaker) || false}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Original
                          </p>
                          <p className="text-base font-medium leading-relaxed">
                            {entry.originalText}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Translation
                          </p>
                          <p className="text-base leading-relaxed bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-border/50">
                            {entry.translatedText}
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        ✓ {Math.round(entry.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Conversations;
