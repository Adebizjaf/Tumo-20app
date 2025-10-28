import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WaveformVisualizer } from "@/components/conversation/WaveformVisualizer";
import { OfflineStatusIndicator } from "@/components/status/OfflineStatusIndicator";
import { useDualSpeechRecognition } from "@/hooks/use-dual-speech-recognition";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Languages,
  MessageCircle,
  Waves,
  User,
  Users
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

const Conversations = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B' | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [speakerALanguage, setSpeakerALanguage] = useState('en');
  const [speakerBLanguage, setSpeakerBLanguage] = useState('es');
  const [audioLevels, setAudioLevels] = useState({ speakerA: 0, speakerB: 0 });
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [enableAudioFeedback, setEnableAudioFeedback] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const conversationRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop all audio playback
  const stopAudioPlayback = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setCurrentlyPlaying(null);
  };

  // Text-to-Speech for real-time audio feedback
  const speakTranslation = async (text: string, language: string, speaker: 'A' | 'B') => {
    if (!enableAudioFeedback || !text.trim()) return;
    
    try {
      // Use Web Speech API for text-to-speech
      if ('speechSynthesis' in window) {
        // Cancel any current speech to avoid overlap
        speechSynthesis.cancel();
        
        // Wait a moment for cancellation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getVoiceLanguage(language);
        utterance.rate = 0.95; // Slightly slower for clarity in conversations
        utterance.pitch = speaker === 'A' ? 0.9 : 1.1; // Different pitch for each speaker
        utterance.volume = 0.85;
        
        utterance.onstart = () => {
          setCurrentlyPlaying(`${speaker}-${Date.now()}`);
          console.log(`🔊 Speaking ${speaker}: "${text}" (${language})`);
        };
        
        utterance.onend = () => {
          setCurrentlyPlaying(null);
          console.log(`✅ Finished speaking ${speaker}`);
        };
        
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setCurrentlyPlaying(null);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Text-to-speech failed:', error);
      setCurrentlyPlaying(null);
    }
  };

  // Convert language codes to speech synthesis compatible format
  const getVoiceLanguage = (langCode: string): string => {
    const voiceMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES', 
      'fr': 'fr-FR',
      'de': 'de-DE',
      'pt': 'pt-BR',
      'it': 'it-IT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
    };
    return voiceMap[langCode] || langCode;
  };

  // Speech recognition hook
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
        
        // 🎵 REAL-TIME AUDIO: Speak the translation immediately
        setTimeout(() => {
          speakTranslation(result.translatedText, targetLanguage, speaker);
        }, 200); // Small delay to avoid conflicts
        
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

  // Mock conversation for demo
  useEffect(() => {
    const mockConversation: ConversationEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 120000),
        speaker: 'A',
        originalText: 'Hello, how are you today?',
        translatedText: 'Hola, ¿cómo estás hoy?',
        originalLanguage: 'en',
        targetLanguage: 'es',
        confidence: 0.95
      },
      {
        id: '2', 
        timestamp: new Date(Date.now() - 110000),
        speaker: 'B',
        originalText: 'Muy bien, gracias. ¿Y tú?',
        translatedText: 'Very well, thank you. And you?',
        originalLanguage: 'es',
        targetLanguage: 'en',
        confidence: 0.92
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 100000),
        speaker: 'A',
        originalText: 'I\'m doing great! Are you ready for the meeting?',
        translatedText: '¡Me va muy bien! ¿Estás listo para la reunión?',
        originalLanguage: 'en',
        targetLanguage: 'es',
        confidence: 0.88
      }
    ];
    setConversation(mockConversation);
  }, []);

  // Simulate speaker switching for demo purposes
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      // Randomly switch speakers for demo
      const speakers: ('A' | 'B')[] = ['A', 'B'];
      const randomSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
      setCurrentSpeaker(Math.random() > 0.7 ? randomSpeaker : null);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Stop audio playback when recording stops
  useEffect(() => {
    if (!isRecording) {
      stopAudioPlayback();
    }
  }, [isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        setAudioStream(stream);
        setIsRecording(true);
        console.log('Starting conversation recording');
      } catch (error) {
        console.error('Failed to access microphone:', error);
        alert('Failed to access microphone. Please check permissions.');
      }
    } else {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      setIsRecording(false);
      setCurrentSpeaker(null);
      console.log('Stopping conversation recording');
    }
  };

  const exportConversation = () => {
    const transcript = conversation.map(entry => 
      `[${entry.timestamp.toLocaleTimeString()}] Speaker ${entry.speaker} (${entry.originalLanguage}): ${entry.originalText}\n` +
      `Translation (${entry.targetLanguage}): ${entry.translatedText}\n`
    ).join('\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="h-full flex flex-col space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Live Conversation</h1>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <div className="h-2 w-2 bg-white rounded-full mr-2" />
              Recording
            </Badge>
          )}
          {isListening && (
            <Badge variant="secondary" className="animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              Listening
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportConversation}
            disabled={conversation.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Offline Status Indicator */}
      <OfflineStatusIndicator />

      {/* Speaker Language Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-3 bg-blue-500 rounded-full" />
            <span className="font-medium">Speaker A</span>
            <Badge variant="secondary">{speakerALanguage.toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <select 
              value={speakerALanguage}
              onChange={(e) => setSpeakerALanguage(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-3 bg-green-500 rounded-full" />
            <span className="font-medium">Speaker B</span>
            <Badge variant="secondary">{speakerBLanguage.toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <select 
              value={speakerBLanguage}
              onChange={(e) => setSpeakerBLanguage(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Live Waveform Visualizer */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
        <div className="flex items-center gap-3 mb-4">
          <Waves className="h-5 w-5 text-primary" />
          <span className="font-medium">Live Audio Visualization</span>
          {isRecording && (
            <Badge variant="outline" className="ml-auto">
              Real-time
            </Badge>
          )}
        </div>
        <WaveformVisualizer 
          isRecording={isRecording}
          currentSpeaker={currentSpeaker}
          audioStream={audioStream || undefined}
        />
      </Card>

      {/* Microphone Permission Help */}
      {speechError && (
        <Card className="p-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <Mic className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Microphone Access Required
              </h3>
              <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                {speechError}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-white dark:bg-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/70"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Recording Button & Audio Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Audio Feedback Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnableAudioFeedback(!enableAudioFeedback)}
            className={cn(
              "transition-colors",
              enableAudioFeedback ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50"
            )}
          >
            {enableAudioFeedback ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <span className="text-sm font-medium">
            Audio Feedback {enableAudioFeedback ? "ON" : "OFF"}
          </span>
        </div>

        {/* Main Recording Button */}
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          onClick={toggleRecording}
          className="h-16 w-16 rounded-full"
        >
          {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {/* Audio Status */}
        <div className="flex items-center gap-2">
          {currentlyPlaying && (
            <Badge variant="secondary" className="animate-pulse">
              <Play className="h-3 w-3 mr-1" />
              Playing...
            </Badge>
          )}
          {!currentlyPlaying && enableAudioFeedback && (
            <Badge variant="outline">
              Ready to speak
            </Badge>
          )}
        </div>
      </div>

      {/* Live Conversation Transcript */}
      <Card className="flex-1 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium">Live Transcript</span>
          <Badge variant="outline">{conversation.length} messages</Badge>
        </div>
        
        <div 
          ref={conversationRef}
          className="space-y-4 max-h-96 overflow-y-auto pr-2"
        >
          {conversation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-3">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-base font-medium">Start recording to see live translations</p>
              <div className="text-sm space-y-1">
                <p>🎤 Click the microphone to start recording</p>
                <p>🔊 Toggle "Audio Feedback" to hear translations spoken aloud</p>
                <p>🗣️ Speak naturally - AI will detect languages and speakers</p>
                <p>▶️ Click play buttons to replay any translation</p>
              </div>
            </div>
          ) : (
            conversation.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <div className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  entry.speaker === 'A' ? "bg-blue-50 dark:bg-blue-950/20" : "bg-green-50 dark:bg-green-950/20"
                )}>
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                    entry.speaker === 'A' ? "bg-blue-500" : "bg-green-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Speaker {entry.speaker}</span>
                      <Badge variant="outline" className="text-xs">
                        {entry.originalLanguage.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      {/* Audio playback button for translations */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-auto"
                        onClick={() => speakTranslation(entry.translatedText, entry.targetLanguage, entry.speaker)}
                        disabled={currentlyPlaying?.includes(entry.speaker) || false}
                        title="Play translation audio"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium mb-1">{entry.originalText}</p>
                    <p className="text-sm text-muted-foreground italic">
                      {entry.translatedText}
                    </p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Confidence: {Math.round(entry.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
};

export default Conversations;
