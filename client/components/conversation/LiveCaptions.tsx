import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LiveCaptionEntry {
  id: string;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText?: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

interface LiveCaptionsProps {
  currentSpeaker: 'A' | 'B' | null;
  isActive: boolean;
  entries: LiveCaptionEntry[];
  speakerALanguage: string;
  speakerBLanguage: string;
  className?: string;
  maxVisibleEntries?: number;
}

export const LiveCaptions = ({
  currentSpeaker,
  isActive,
  entries,
  speakerALanguage,
  speakerBLanguage,
  className,
  maxVisibleEntries = 6
}: LiveCaptionsProps) => {
  const [visibleEntries, setVisibleEntries] = useState<LiveCaptionEntry[]>([]);
  const captionsRef = useRef<HTMLDivElement>(null);

  // Update visible entries when new entries arrive
  useEffect(() => {
    const recentEntries = entries
      .slice(-maxVisibleEntries)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    setVisibleEntries(recentEntries);
  }, [entries, maxVisibleEntries]);

  // Auto-scroll to show latest entries
  useEffect(() => {
    if (captionsRef.current) {
      captionsRef.current.scrollTop = captionsRef.current.scrollHeight;
    }
  }, [visibleEntries]);

  const getSpeakerColor = (speaker: 'A' | 'B', isText = false) => {
    const colors = {
      A: isText ? "text-blue-600 dark:text-blue-400" : "bg-blue-500",
      B: isText ? "text-green-600 dark:text-green-400" : "bg-green-500"
    };
    return colors[speaker];
  };

  const getSpeakerLanguage = (speaker: 'A' | 'B') => {
    return speaker === 'A' ? speakerALanguage : speakerBLanguage;
  };

  const getTargetLanguage = (speaker: 'A' | 'B') => {
    return speaker === 'A' ? speakerBLanguage : speakerALanguage;
  };

  if (!isActive) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground", className)}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full opacity-30" />
            <div className="h-2 w-2 bg-green-500 rounded-full opacity-30" />
          </div>
          <p className="text-sm">Live captions will appear here during conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 py-2 bg-background/95 backdrop-blur rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className={cn(
              "h-2 w-2 rounded-full transition-opacity",
              currentSpeaker === 'A' ? "bg-blue-500 animate-pulse" : "bg-blue-300 opacity-50"
            )} />
            <div className={cn(
              "h-2 w-2 rounded-full transition-opacity",
              currentSpeaker === 'B' ? "bg-green-500 animate-pulse" : "bg-green-300 opacity-50"
            )} />
          </div>
          <span className="text-sm font-medium">Live Captions</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary">{speakerALanguage.toUpperCase()}</Badge>
          <span className="text-muted-foreground">↔</span>
          <Badge variant="secondary">{speakerBLanguage.toUpperCase()}</Badge>
        </div>
      </div>

      {/* Captions Display */}
      <div 
        ref={captionsRef}
        className="space-y-3 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {visibleEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="animate-pulse mb-2">🎤</div>
              <p className="text-sm">Waiting for speech...</p>
            </div>
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <div key={entry.id} className="space-y-2">
              {/* Original Text */}
              <div className={cn(
                "p-3 rounded-lg transition-all duration-200",
                entry.speaker === 'A' 
                  ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500"
                  : "bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500",
                !entry.isFinal && "opacity-70 animate-pulse"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    getSpeakerColor(entry.speaker)
                  )} />
                  <span className="text-xs font-medium">
                    Speaker {entry.speaker}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {getSpeakerLanguage(entry.speaker).toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {entry.timestamp.toLocaleTimeString([], { 
                      hour12: false, 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </span>
                </div>
                
                <p className={cn(
                  "text-sm font-medium leading-relaxed",
                  getSpeakerColor(entry.speaker, true)
                )}>
                  {entry.originalText}
                </p>
                
                {!entry.isFinal && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" />
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">Speaking...</span>
                  </div>
                )}
              </div>

              {/* Translation */}
              {entry.translatedText && entry.isFinal && (
                <div className="pl-6 pr-3 py-2 rounded-lg bg-muted/50 border-l-2 border-muted-foreground/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Translation:</span>
                    <Badge variant="outline" className="text-xs">
                      {getTargetLanguage(entry.speaker).toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(entry.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {entry.translatedText}
                  </p>
                </div>
              )}

              {/* Loading Translation */}
              {entry.isFinal && !entry.translatedText && (
                <div className="pl-6 pr-3 py-2 rounded-lg bg-muted/30 border-l-2 border-muted-foreground/10">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">Translating...</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Current Speaking Indicator */}
      {currentSpeaker && (
        <div className="absolute -top-2 right-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg",
            getSpeakerColor(currentSpeaker),
            "animate-pulse"
          )}>
            <div className="h-2 w-2 bg-white rounded-full animate-ping" />
            Speaker {currentSpeaker} speaking
          </div>
        </div>
      )}
    </div>
  );
};