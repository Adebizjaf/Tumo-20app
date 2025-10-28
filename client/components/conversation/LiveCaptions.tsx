import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionEntry {
  id: string;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText?: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  originalLanguage: string;
  targetLanguage: string;
}

interface LiveCaptionsProps {
  captions: CaptionEntry[];
  isActive: boolean;
  speakerALanguage: string;
  speakerBLanguage: string;
  currentSpeaker?: 'A' | 'B' | null;
  className?: string;
}

export const LiveCaptions = ({ 
  captions, 
  isActive, 
  speakerALanguage, 
  speakerBLanguage,
  currentSpeaker,
  className 
}: LiveCaptionsProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const captionsRef = useRef<HTMLDivElement>(null);
  const latestCaptionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest caption
  useEffect(() => {
    if (autoScroll && latestCaptionRef.current) {
      latestCaptionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [captions, autoScroll]);

  // Get current active caption (most recent non-final or latest final)
  const activeCaption = captions.length > 0 ? captions[captions.length - 1] : null;
  const recentCaptions = captions.slice(-10); // Show last 10 captions

  const getSpeakerColor = (speaker: 'A' | 'B') => {
    return speaker === 'A' 
      ? { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-500' }
      : { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', accent: 'bg-green-500' };
  };

  const getSpeakerLanguage = (speaker: 'A' | 'B') => {
    return speaker === 'A' ? speakerALanguage : speakerBLanguage;
  };

  const getTargetLanguage = (speaker: 'A' | 'B') => {
    return speaker === 'A' ? speakerBLanguage : speakerALanguage;
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isFullscreen ? "fixed inset-4 z-50 bg-background/95 backdrop-blur" : "",
      className
    )}>
      {/* Controls Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-3 w-3 rounded-full transition-colors",
              isActive ? "bg-red-500 animate-pulse" : "bg-gray-300"
            )} />
            <span className="text-sm font-medium">
              {isActive ? "Live Captions" : "Captions Ready"}
            </span>
          </div>
          
          {currentSpeaker && (
            <Badge variant="outline" className="animate-pulse">
              Speaker {currentSpeaker} speaking
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOriginal(!showOriginal)}
            className={cn(!showOriginal && "opacity-50")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Original
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslation(!showTranslation)}
            className={cn(!showTranslation && "opacity-50")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Translation
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize(prev => prev === 16 ? 20 : prev === 20 ? 24 : 16)}
          >
            A{fontSize > 16 && fontSize > 20 ? "+" : fontSize > 16 ? "" : "-"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Live Caption Area */}
      <div 
        ref={captionsRef}
        className="p-4 space-y-4 h-64 overflow-y-auto"
        style={{ fontSize: `${fontSize}px` }}
      >
        {!isActive && captions.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Live captions will appear here during conversation</p>
              <p className="text-xs mt-1">Both original speech and translations will be shown</p>
            </div>
          </div>
        )}

        {recentCaptions.map((caption, index) => {
          const colors = getSpeakerColor(caption.speaker);
          const isLatest = index === recentCaptions.length - 1;
          
          return (
            <div
              key={caption.id}
              ref={isLatest ? latestCaptionRef : undefined}
              className={cn(
                "p-3 rounded-lg border transition-all duration-300",
                colors.bg,
                !caption.isFinal && "animate-pulse border-dashed",
                isLatest && currentSpeaker === caption.speaker && "ring-2 ring-offset-2",
                isLatest && currentSpeaker === caption.speaker && caption.speaker === 'A' && "ring-blue-400",
                isLatest && currentSpeaker === caption.speaker && caption.speaker === 'B' && "ring-green-400"
              )}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", colors.accent)} />
                  <span className={cn("text-xs font-medium", colors.text)}>
                    Speaker {caption.speaker}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {getSpeakerLanguage(caption.speaker).toUpperCase()}
                  </Badge>
                  {!caption.isFinal && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Speaking...
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{Math.round(caption.confidence * 100)}%</span>
                  <span>{caption.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Original Text */}
              {showOriginal && caption.originalText && (
                <div className="mb-2">
                  <p className={cn(
                    "font-medium leading-relaxed",
                    !caption.isFinal && "opacity-70"
                  )}>
                    {caption.originalText}
                  </p>
                </div>
              )}

              {/* Translated Text */}
              {showTranslation && caption.translatedText && (
                <div className="border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Translation:</span>
                    <Badge variant="outline" className="text-xs">
                      {getTargetLanguage(caption.speaker).toUpperCase()}
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-sm italic leading-relaxed",
                    colors.text,
                    !caption.isFinal && "opacity-70"
                  )}>
                    {caption.translatedText}
                  </p>
                </div>
              )}

              {/* Confidence Bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      caption.confidence > 0.8 ? "bg-green-500" : 
                      caption.confidence > 0.6 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${caption.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Current Speaking Indicator */}
        {isActive && currentSpeaker && (
          <div className={cn(
            "p-3 rounded-lg border-2 border-dashed animate-pulse",
            currentSpeaker === 'A' ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : "border-green-400 bg-green-50 dark:bg-green-950/20"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                currentSpeaker === 'A' ? "bg-blue-500" : "bg-green-500"
              )} />
              <span className="text-sm font-medium">
                Speaker {currentSpeaker} is speaking...
              </span>
              <Badge variant="outline" className="text-xs">
                {getSpeakerLanguage(currentSpeaker).toUpperCase()}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      {captions.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{captions.length} total captions</span>
            <span>
              Avg. confidence: {Math.round(
                captions.reduce((sum, c) => sum + c.confidence, 0) / captions.length * 100
              )}%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};