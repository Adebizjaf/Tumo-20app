import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  isRecording: boolean;
  currentSpeaker: 'A' | 'B' | null;
  audioStream?: MediaStream;
  className?: string;
}

export const WaveformVisualizer = ({ 
  isRecording, 
  currentSpeaker, 
  audioStream,
  className 
}: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // Set up Web Audio API
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyzer = audioContext.createAnalyser();
    
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;
    source.connect(analyzer);
    
    analyzerRef.current = analyzer;
    const bufferLength = analyzer.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(new ArrayBuffer(bufferLength));

    const animate = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;
      
      const dataArray = dataArrayRef.current;
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      // Calculate audio levels for visualization
      const levels = [];
      const chunks = Math.floor(dataArrayRef.current.length / 32); // 32 bars
      
      for (let i = 0; i < 32; i++) {
        const start = i * chunks;
        const end = start + chunks;
        const slice = dataArray.slice(start, end);
        const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
        levels.push(average / 255); // Normalize to 0-1
      }
      
      setAudioLevels(levels);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [isRecording, audioStream]);

  const getSpeakerColor = () => {
    if (!currentSpeaker) return "bg-gray-400";
    return currentSpeaker === 'A' ? "bg-blue-500" : "bg-green-500";
  };

  const getSpeakerGradient = () => {
    if (!currentSpeaker) return "from-gray-300 to-gray-500";
    return currentSpeaker === 'A' 
      ? "from-blue-400 to-blue-600" 
      : "from-green-400 to-green-600";
  };

  return (
    <div className={cn("relative h-20 bg-background/50 rounded-lg overflow-hidden", className)}>
      {isRecording ? (
        <div className="flex items-center justify-center h-full gap-1 px-4">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className={cn(
                "w-2 bg-gradient-to-t transition-all duration-75 rounded-full",
                getSpeakerGradient()
              )}
              style={{
                height: `${Math.max(2, level * 60 + 10)}px`,
                opacity: level > 0.01 ? 0.8 + (level * 0.2) : 0.3
              }}
            />
          ))}
          
          {audioLevels.length === 0 && (
            // Fallback animated bars when no audio data yet
            <div className="flex items-center gap-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 bg-gradient-to-t transition-all duration-150 rounded-full animate-pulse",
                    getSpeakerGradient()
                  )}
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
          <div>
            <div className="flex justify-center mb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-6 bg-gray-300 dark:bg-gray-600 mx-0.5 rounded opacity-30"
                />
              ))}
            </div>
            <p className="text-sm">Audio waveforms appear during recording</p>
          </div>
        </div>
      )}
      
      {/* Speaker indicator */}
      {isRecording && currentSpeaker && (
        <div className="absolute top-2 right-2">
          <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium text-white",
            currentSpeaker === 'A' ? "bg-blue-500" : "bg-green-500"
          )}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Speaker {currentSpeaker}
          </div>
        </div>
      )}
      
      {/* Audio level meter */}
      {isRecording && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-1 bg-background rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-100 rounded-full",
                getSpeakerColor()
              )}
              style={{
                width: `${Math.max(...audioLevels) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};