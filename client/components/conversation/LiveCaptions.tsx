import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LiveCaption {
  id: string;
  text: string;
  translatedText?: string;
  speaker: 'A' | 'B';
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  isVisible: boolean;
}

interface LiveCaptionsProps {
  currentSpeech?: {
    text: string;
    translatedText?: string;
    speaker: 'A' | 'B';
    confidence: number;
    isFinal: boolean;
  };
  speakerALanguage: string;
  speakerBLanguage: string;
  isEnabled: boolean;
  className?: string;
}

export const LiveCaptions = ({
  currentSpeech,
  speakerALanguage,
  speakerBLanguage,
  isEnabled,
  className
}: LiveCaptionsProps) => {
  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const [currentInterimCaption, setCurrentInterimCaption] = useState<LiveCaption | null>(null);
  const captionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Process new speech input
  useEffect(() => {
    if (!currentSpeech || !isEnabled || !currentSpeech.text.trim()) {
      setCurrentInterimCaption(null);
      return;
    }

    const captionId = `caption-${Date.now()}`;
    const caption: LiveCaption = {
      id: captionId,
      text: currentSpeech.text,
      translatedText: currentSpeech.translatedText,
      speaker: currentSpeech.speaker,
      confidence: currentSpeech.confidence,
      isFinal: currentSpeech.isFinal,
      timestamp: new Date(),
      isVisible: true
    };

    if (currentSpeech.isFinal) {
      // Add to final captions list
      setCaptions(prev => {
        const filtered = prev.filter(c => c.speaker !== currentSpeech.speaker || c.isFinal);
        return [...filtered, caption].slice(-6); // Keep last 6 captions
      });

      // Clear interim caption
      setCurrentInterimCaption(null);

      // Auto-hide after 8 seconds
      const timeout = setTimeout(() => {
        setCaptions(prev => 
          prev.map(c => 
            c.id === captionId ? { ...c, isVisible: false } : c
          )
        );

        // Remove completely after fade out
        setTimeout(() => {
          setCaptions(prev => prev.filter(c => c.id !== captionId));
          captionTimeouts.current.delete(captionId);
        }, 500);
      }, 8000);

      captionTimeouts.current.set(captionId, timeout);
    } else {
      // Update interim caption
      setCurrentInterimCaption(caption);
    }
  }, [currentSpeech, isEnabled]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      captionTimeouts.current.forEach(timeout => clearTimeout(timeout));
      captionTimeouts.current.clear();
    };
  }, []);

  const getSpeakerConfig = (speaker: 'A' | 'B') => {
    return speaker === 'A' 
      ? {
          color: 'bg-blue-500',
          borderColor: 'border-blue-200 dark:border-blue-800',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          language: speakerALanguage.toUpperCase(),
          position: 'justify-start' // Left side
        }
      : {
          color: 'bg-green-500', 
          borderColor: 'border-green-200 dark:border-green-800',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          language: speakerBLanguage.toUpperCase(),
          position: 'justify-end' // Right side
        };
  };

  const renderCaption = (caption: LiveCaption, isInterim: boolean = false) => {
    const config = getSpeakerConfig(caption.speaker);
    
    return (
      <div 
        key={caption.id}
        className={cn(
          "flex w-full transition-all duration-500 ease-in-out",
          config.position,
          !caption.isVisible && "opacity-0 translate-y-2"
        )}
      >
        <div 
          className={cn(
            "max-w-md rounded-2xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300",
            config.borderColor,
            config.bgColor,
            isInterim && "animate-pulse border-dashed"
          )}
        >
          {/* Speaker header */}
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("h-3 w-3 rounded-full", config.color)} />
            <span className="text-xs font-medium">Speaker {caption.speaker}</span>
            <Badge variant="outline" className="text-xs h-5">
              {config.language}
            </Badge>
            <div className="flex-1" />
            {!isInterim && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs h-5",
                  caption.confidence > 0.8 ? "bg-green-100 text-green-800" :
                  caption.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                )}
              >
                {Math.round(caption.confidence * 100)}%
              </Badge>
            )}
          </div>

          {/* Original text */}
          <div className="space-y-2">
            <p className={cn(
              "text-sm font-medium leading-relaxed",
              isInterim && "text-muted-foreground"
            )}>
              {caption.text}
            </p>

            {/* Translation */}
            {caption.translatedText && caption.translatedText !== caption.text && (
              <div className="pt-2 border-t border-border/50">
                <p className={cn(
                  "text-sm italic text-muted-foreground leading-relaxed",
                  isInterim && "opacity-70"
                )}>
                  {caption.translatedText}
                </p>
              </div>
            )}
          </div>

          {/* Timestamp for final captions */}
          {!isInterim && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                {caption.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isEnabled) {
    return (
      <div className={cn(
        "flex items-center justify-center h-32 text-center text-muted-foreground",
        className
      )}>
        <div>
          <div className="text-lg font-medium mb-1">Live Captions</div>
          <p className="text-sm">Start recording to see live captions</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-4 h-96 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30",
      className
    )}>
      {captions.length === 0 && !currentInterimCaption && (
        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
          <div>
            <div className="animate-pulse mb-2">
              <div className="h-8 w-8 bg-primary/20 rounded-full mx-auto mb-2" />
            </div>
            <p className="text-sm">Listening for speech...</p>
          </div>
        </div>
      )}

      {/* Final captions */}
      {captions.map(caption => renderCaption(caption))}

      {/* Current interim caption */}
      {currentInterimCaption && renderCaption(currentInterimCaption, true)}

      {/* Auto-scroll anchor */}
      <div id="captions-bottom" />
    </div>
  );
};
