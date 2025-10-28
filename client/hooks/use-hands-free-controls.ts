import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceCommand {
  phrases: string[];
  action: () => void;
  description: string;
  enabled: boolean;
}

interface HandsFreeControlsOptions {
  isActive: boolean;
  language: string;
  commands: {
    startRecording?: () => void;
    stopRecording?: () => void;
    switchLanguages?: () => void;
    exportConversation?: () => void;
    clearConversation?: () => void;
  };
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useHandsFreeControls = ({
  isActive,
  language,
  commands
}: HandsFreeControlsOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout>();

  // Define voice commands in multiple languages
  const getVoiceCommands = useCallback((): VoiceCommand[] => {
    const commandSets: Record<string, VoiceCommand[]> = {
      en: [
        {
          phrases: ["start recording", "begin recording", "start conversation", "start listening"],
          action: () => commands.startRecording?.(),
          description: "Start recording conversation",
          enabled: !!commands.startRecording
        },
        {
          phrases: ["stop recording", "end recording", "stop conversation", "stop listening"],
          action: () => commands.stopRecording?.(),
          description: "Stop recording conversation", 
          enabled: !!commands.stopRecording
        },
        {
          phrases: ["switch languages", "change languages", "swap languages", "flip languages"],
          action: () => commands.switchLanguages?.(),
          description: "Switch speaker languages",
          enabled: !!commands.switchLanguages
        },
        {
          phrases: ["export conversation", "save conversation", "download transcript", "export transcript"],
          action: () => commands.exportConversation?.(),
          description: "Export conversation transcript",
          enabled: !!commands.exportConversation
        },
        {
          phrases: ["clear conversation", "delete conversation", "reset conversation", "new conversation"],
          action: () => commands.clearConversation?.(),
          description: "Clear conversation history",
          enabled: !!commands.clearConversation
        }
      ],
      es: [
        {
          phrases: ["iniciar grabación", "empezar grabación", "comenzar conversación", "empezar a escuchar"],
          action: () => commands.startRecording?.(),
          description: "Iniciar grabación de conversación",
          enabled: !!commands.startRecording
        },
        {
          phrases: ["parar grabación", "detener grabación", "terminar conversación", "parar de escuchar"],
          action: () => commands.stopRecording?.(),
          description: "Detener grabación de conversación",
          enabled: !!commands.stopRecording
        },
        {
          phrases: ["cambiar idiomas", "intercambiar idiomas", "alternar idiomas"],
          action: () => commands.switchLanguages?.(),
          description: "Cambiar idiomas de los hablantes",
          enabled: !!commands.switchLanguages
        },
        {
          phrases: ["exportar conversación", "guardar conversación", "descargar transcripción"],
          action: () => commands.exportConversation?.(),
          description: "Exportar transcripción de conversación",
          enabled: !!commands.exportConversation
        },
        {
          phrases: ["limpiar conversación", "borrar conversación", "reiniciar conversación", "nueva conversación"],
          action: () => commands.clearConversation?.(),
          description: "Limpiar historial de conversación",
          enabled: !!commands.clearConversation
        }
      ],
      fr: [
        {
          phrases: ["commencer l'enregistrement", "démarrer l'enregistrement", "commencer la conversation"],
          action: () => commands.startRecording?.(),
          description: "Commencer l'enregistrement de conversation",
          enabled: !!commands.startRecording
        },
        {
          phrases: ["arrêter l'enregistrement", "terminer l'enregistrement", "arrêter la conversation"],
          action: () => commands.stopRecording?.(),
          description: "Arrêter l'enregistrement de conversation",
          enabled: !!commands.stopRecording
        },
        {
          phrases: ["changer les langues", "échanger les langues", "alterner les langues"],
          action: () => commands.switchLanguages?.(),
          description: "Changer les langues des interlocuteurs",
          enabled: !!commands.switchLanguages
        },
        {
          phrases: ["exporter la conversation", "sauvegarder la conversation", "télécharger la transcription"],
          action: () => commands.exportConversation?.(),
          description: "Exporter la transcription de conversation",
          enabled: !!commands.exportConversation
        },
        {
          phrases: ["effacer la conversation", "supprimer la conversation", "nouvelle conversation"],
          action: () => commands.clearConversation?.(),
          description: "Effacer l'historique de conversation",
          enabled: !!commands.clearConversation
        }
      ],
      de: [
        {
          phrases: ["aufnahme starten", "aufzeichnung beginnen", "gespräch beginnen"],
          action: () => commands.startRecording?.(),
          description: "Gesprächsaufzeichnung starten",
          enabled: !!commands.startRecording
        },
        {
          phrases: ["aufnahme stoppen", "aufzeichnung beenden", "gespräch beenden"],
          action: () => commands.stopRecording?.(),
          description: "Gesprächsaufzeichnung beenden", 
          enabled: !!commands.stopRecording
        },
        {
          phrases: ["sprachen wechseln", "sprachen tauschen", "sprachen ändern"],
          action: () => commands.switchLanguages?.(),
          description: "Sprecher-Sprachen wechseln",
          enabled: !!commands.switchLanguages
        },
        {
          phrases: ["gespräch exportieren", "gespräch speichern", "transkript herunterladen"],
          action: () => commands.exportConversation?.(),
          description: "Gesprächstranskript exportieren",
          enabled: !!commands.exportConversation
        },
        {
          phrases: ["gespräch löschen", "unterhaltung löschen", "neues gespräch"],
          action: () => commands.clearConversation?.(),
          description: "Gesprächsverlauf löschen",
          enabled: !!commands.clearConversation
        }
      ]
    };

    return commandSets[language] || commandSets.en;
  }, [language, commands]);

  // Process speech for voice commands
  const processCommand = useCallback((transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const voiceCommands = getVoiceCommands();

    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      cmd.enabled && cmd.phrases.some(phrase => 
        normalizedTranscript.includes(phrase.toLowerCase())
      )
    );

    if (matchedCommand) {
      setLastCommand(matchedCommand.description);
      console.log(`Voice command executed: ${matchedCommand.description}`);
      matchedCommand.action();

      // Clear last command after 3 seconds
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      commandTimeoutRef.current = setTimeout(() => {
        setLastCommand(null);
      }, 3000);

      return true;
    }

    return false;
  }, [getVoiceCommands]);

  // Initialize speech recognition for voice commands
  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported for voice commands');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results for commands
    recognition.lang = language || 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('Voice command recognition started');
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.resultIndex];
      const transcript = lastResult[0].transcript;
      
      console.log('Voice command detected:', transcript);
      
      // Process as potential command
      const wasCommand = processCommand(transcript);
      
      if (!wasCommand) {
        console.log('No matching voice command found');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice command recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied for voice commands');
      } else if (event.error !== 'no-speech') {
        setError(`Voice command error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Auto-restart for continuous listening
      if (isActive) {
        setTimeout(() => {
          if (isActive && recognitionRef.current) {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart voice command recognition:', error);
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
      setError('Failed to start voice commands');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isActive, language, processCommand]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    lastCommand,
    error,
    availableCommands: getVoiceCommands(),
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
