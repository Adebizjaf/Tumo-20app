import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceCommand {
  phrases: string[];
  action: string;
  description: string;
  callback: () => void;
}

interface UseHandsFreeControlsProps {
  isActive: boolean;
  language?: string;
  onToggleRecording?: () => void;
  onSwitchLanguages?: () => void;
  onAdjustVolume?: (direction: 'up' | 'down') => void;
  onToggleCaptions?: () => void;
  onExportConversation?: () => void;
}

export const useHandsFreeControls = ({
  isActive,
  language = 'en',
  onToggleRecording,
  onSwitchLanguages,
  onAdjustVolume,
  onToggleCaptions,
  onExportConversation
}: UseHandsFreeControlsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout>();

  // Define voice commands for different languages
  const getCommands = useCallback((): VoiceCommand[] => {
    const commands: Record<string, VoiceCommand[]> = {
      en: [
        {
          phrases: ["start recording", "begin conversation", "start translation"],
          action: "start_recording",
          description: "Start recording conversation",
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["stop recording", "end conversation", "stop translation"],
          action: "stop_recording", 
          description: "Stop recording conversation",
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["switch languages", "swap languages", "reverse languages"],
          action: "switch_languages",
          description: "Switch speaker languages",
          callback: () => onSwitchLanguages?.()
        },
        {
          phrases: ["volume up", "louder", "increase volume"],
          action: "volume_up",
          description: "Increase volume",
          callback: () => onAdjustVolume?.('up')
        },
        {
          phrases: ["volume down", "quieter", "decrease volume"],
          action: "volume_down",
          description: "Decrease volume", 
          callback: () => onAdjustVolume?.('down')
        },
        {
          phrases: ["toggle captions", "show captions", "hide captions"],
          action: "toggle_captions",
          description: "Toggle live captions",
          callback: () => onToggleCaptions?.()
        },
        {
          phrases: ["export conversation", "save conversation", "download transcript"],
          action: "export",
          description: "Export conversation transcript",
          callback: () => onExportConversation?.()
        }
      ],
      es: [
        {
          phrases: ["empezar grabación", "iniciar conversación", "comenzar traducción"],
          action: "start_recording",
          description: "Empezar grabación de conversación",
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["parar grabación", "terminar conversación", "parar traducción"],
          action: "stop_recording",
          description: "Parar grabación de conversación", 
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["cambiar idiomas", "intercambiar idiomas"],
          action: "switch_languages",
          description: "Cambiar idiomas de los hablantes",
          callback: () => onSwitchLanguages?.()
        },
        {
          phrases: ["subir volumen", "más alto", "aumentar volumen"],
          action: "volume_up", 
          description: "Subir volumen",
          callback: () => onAdjustVolume?.('up')
        },
        {
          phrases: ["bajar volumen", "más bajo", "disminuir volumen"],
          action: "volume_down",
          description: "Bajar volumen",
          callback: () => onAdjustVolume?.('down')
        }
      ],
      fr: [
        {
          phrases: ["commencer enregistrement", "débuter conversation", "démarrer traduction"],
          action: "start_recording",
          description: "Commencer l'enregistrement de conversation",
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["arrêter enregistrement", "finir conversation", "stopper traduction"],
          action: "stop_recording",
          description: "Arrêter l'enregistrement de conversation",
          callback: () => onToggleRecording?.()
        },
        {
          phrases: ["changer langues", "échanger langues", "inverser langues"],
          action: "switch_languages", 
          description: "Changer les langues des locuteurs",
          callback: () => onSwitchLanguages?.()
        }
      ]
    };

    return commands[language] || commands.en;
  }, [language, onToggleRecording, onSwitchLanguages, onAdjustVolume, onToggleCaptions, onExportConversation]);

  // Process voice command
  const processCommand = useCallback((transcript: string): VoiceCommand | null => {
    const commands = getCommands();
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Find matching command
    for (const command of commands) {
      for (const phrase of command.phrases) {
        if (lowerTranscript.includes(phrase.toLowerCase())) {
          return command;
        }
      }
    }
    
    return null;
  }, [getCommands]);

  // Initialize voice command recognition
  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported for voice commands');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results for commands
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('Voice commands listening started');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      const commandConfidence = event.results[event.resultIndex][0].confidence;
      
      setConfidence(commandConfidence || 0.8);
      
      // Process the command
      const command = processCommand(transcript);
      
      if (command && commandConfidence > 0.7) { // Higher threshold for commands
        console.log(`Executing voice command: ${command.action} (${transcript})`);
        setLastCommand(command.action);
        
        // Execute command with a slight delay for user feedback
        setTimeout(() => {
          command.callback();
        }, 100);

        // Clear last command after 3 seconds
        if (commandTimeoutRef.current) {
          clearTimeout(commandTimeoutRef.current);
        }
        commandTimeoutRef.current = setTimeout(() => {
          setLastCommand(null);
        }, 3000);
      } else {
        console.log(`Voice input not recognized as command: ${transcript}`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice command recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access required for voice commands');
      } else if (event.error !== 'no-speech') {
        setError(`Voice command error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Voice commands recognition ended');
      
      // Restart if still active
      if (isActive) {
        setTimeout(() => {
          if (isActive) {
            try {
              recognition.start();
            } catch (error) {
              console.warn('Failed to restart voice command recognition:', error);
            }
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start voice command recognition:', error);
      setError('Failed to start voice command recognition');
    }

    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isActive, language, processCommand]);

  // Get available commands for display
  const getAvailableCommands = useCallback(() => {
    return getCommands().map(cmd => ({
      action: cmd.action,
      phrases: cmd.phrases,
      description: cmd.description
    }));
  }, [getCommands]);

  // Manual command trigger (for testing or accessibility)
  const triggerCommand = useCallback((action: string) => {
    const commands = getCommands();
    const command = commands.find(cmd => cmd.action === action);
    if (command) {
      setLastCommand(action);
      command.callback();
      
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      commandTimeoutRef.current = setTimeout(() => {
        setLastCommand(null);
      }, 3000);
    }
  }, [getCommands]);

  return {
    isListening,
    lastCommand,
    confidence,
    error,
    availableCommands: getAvailableCommands(),
    triggerCommand,
    
    // Status information
    status: isListening ? 'listening' : isActive ? 'ready' : 'inactive'
  };
};