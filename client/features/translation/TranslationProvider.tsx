import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { useToast } from "@/components/ui/use-toast";
import {
  detectLanguage,
  extractTextFromImage,
  speakText,
  startSpeechRecognition,
  stopSpeaking,
  stopSpeechRecognition,
  translateText,
} from "@/lib/translation-engine";
import useNetworkStatus from "@/hooks/use-network-status";
import {
  DEFAULT_SOURCE,
  DEFAULT_TARGET,
  LANGUAGE_OPTIONS,
  MAX_INPUT_CHARACTERS,
} from "./constants";
import type {
  ConversationTurn,
  TranslationActions,
  TranslationContextValue,
  TranslationMode,
  TranslationRecord,
  TranslationResult,
  TranslationState,
} from "./types";

const HISTORY_STORAGE_KEY = "tumo.history.v1";
const CONVERSATION_STORAGE_KEY = "tumo.conversation.v1";
const LAST_SESSION_KEY = "tumo.session.v1";

const loadHistory = (): TranslationRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TranslationRecord[];
  } catch (error) {
    console.warn("Failed to load translation history", error);
    return [];
  }
};

const loadConversation = (): ConversationTurn[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ConversationTurn[];
  } catch (error) {
    console.warn("Failed to load conversation data", error);
    return [];
  }
};

const loadSessionDraft = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as Pick<
      TranslationState,
      "inputText" | "outputText"
    > & {
      sourceLanguage: string;
      targetLanguage: string;
    };
  } catch (error) {
    return undefined;
  }
};

const persistHistory = (history: TranslationRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

const persistConversation = (conversation: ConversationTurn[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    CONVERSATION_STORAGE_KEY,
    JSON.stringify(conversation),
  );
};

const persistSessionDraft = (state: TranslationState) => {
  if (typeof window === "undefined") {
    return;
  }
  const payload = {
    inputText: state.inputText,
    outputText: state.outputText,
    sourceLanguage: state.sourceLanguage,
    targetLanguage: state.targetLanguage,
  };
  window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(payload));
};

const buildInitialState = (): TranslationState => {
  const history = loadHistory();
  const conversation = loadConversation();
  const session = loadSessionDraft();

  return {
    inputText: session?.inputText ?? "",
    outputText: session?.outputText ?? "",
    sourceLanguage: session?.sourceLanguage ?? DEFAULT_SOURCE,
    targetLanguage: session?.targetLanguage ?? DEFAULT_TARGET,
    detectedLanguage: undefined,
    detectionConfidence: undefined,
    mode: "text",
    isTranslating: false,
    speech: {
      isListening: false,
      isSynthesizing: false,
      transcript: undefined,
    },
    history,
    favorites: history.filter((item) => item.favorite).map((item) => item.id),
    conversation,
    offlineReady: history.length > 0,
    realtimeLatency: undefined,
    lastUpdated: undefined,
  };
};

type Action =
  | { type: "PATCH"; payload: Partial<TranslationState> }
  | { type: "SET_SPEECH"; payload: Partial<TranslationState["speech"]> }
  | { type: "ADD_HISTORY"; payload: TranslationRecord }
  | { type: "UPDATE_HISTORY"; payload: TranslationRecord[] }
  | { type: "REMOVE_HISTORY"; payload: string }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "SET_MODE"; payload: TranslationMode }
  | { type: "APPEND_CONVERSATION"; payload: ConversationTurn }
  | { type: "SET_CONVERSATION"; payload: ConversationTurn[] }
  | { type: "CLEAR_CONVERSATION" };

const reducer = (state: TranslationState, action: Action): TranslationState => {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.payload };
    case "SET_SPEECH":
      return { ...state, speech: { ...state.speech, ...action.payload } };
    case "ADD_HISTORY": {
      const existing = state.history.filter(
        (item) => item.id !== action.payload.id,
      );
      const history = [action.payload, ...existing].slice(0, 100);
      return {
        ...state,
        history,
        favorites: history
          .filter((item) => item.favorite)
          .map((item) => item.id),
        offlineReady: history.length > 0,
      };
    }
    case "UPDATE_HISTORY": {
      const history = action.payload;
      return {
        ...state,
        history,
        favorites: history
          .filter((item) => item.favorite)
          .map((item) => item.id),
        offlineReady: history.length > 0,
      };
    }
    case "REMOVE_HISTORY": {
      const history = state.history.filter(
        (item) => item.id !== action.payload,
      );
      return {
        ...state,
        history,
        favorites: history
          .filter((item) => item.favorite)
          .map((item) => item.id),
        offlineReady: history.length > 0,
      };
    }
    case "TOGGLE_FAVORITE": {
      const history = state.history.map((item) =>
        item.id === action.payload
          ? { ...item, favorite: !item.favorite }
          : item,
      );
      return {
        ...state,
        history,
        favorites: history
          .filter((item) => item.favorite)
          .map((item) => item.id),
      };
    }
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "APPEND_CONVERSATION":
      return {
        ...state,
        conversation: [...state.conversation, action.payload],
      };
    case "SET_CONVERSATION":
      return { ...state, conversation: action.payload };
    case "CLEAR_CONVERSATION":
      return { ...state, conversation: [] };
    default:
      return state;
  }
};

const TranslationContext = createContext<TranslationContextValue | undefined>(
  undefined,
);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const network = useNetworkStatus();
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const speechSessionRef = useRef<{ stop: () => void } | null>(null);
  const lastRealtimeRequestRef = useRef<string>("");

  useEffect(() => {
    persistHistory(state.history);
  }, [state.history]);

  useEffect(() => {
    persistConversation(state.conversation);
  }, [state.conversation]);

  useEffect(() => {
    persistSessionDraft(state);
  }, [
    state.inputText,
    state.outputText,
    state.sourceLanguage,
    state.targetLanguage,
  ]);

  const setSourceLanguage = useCallback((code: string) => {
    dispatch({ type: "PATCH", payload: { sourceLanguage: code } });
  }, []);

  const setTargetLanguage = useCallback((code: string) => {
    dispatch({ type: "PATCH", payload: { targetLanguage: code } });
  }, []);

  const swapLanguages = useCallback(() => {
    dispatch({
      type: "PATCH",
      payload: {
        sourceLanguage: state.targetLanguage,
        targetLanguage:
          state.sourceLanguage === "auto"
            ? state.targetLanguage
            : state.sourceLanguage,
        inputText: state.outputText,
        outputText: state.inputText,
      },
    });
  }, [
    state.inputText,
    state.outputText,
    state.sourceLanguage,
    state.targetLanguage,
  ]);

  const updateInputText = useCallback((value: string) => {
    const trimmed = value.slice(0, MAX_INPUT_CHARACTERS);
    dispatch({ type: "PATCH", payload: { inputText: trimmed } });
  }, []);

  const clearOutput = useCallback(() => {
    dispatch({
      type: "PATCH",
      payload: {
        outputText: "",
        detectedLanguage: undefined,
        detectionConfidence: undefined,
      },
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_FAVORITE", payload: id });
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_HISTORY", payload: id });
  }, []);

  const replayHistoryItem = useCallback(
    (id: string) => {
      const record = state.history.find((item) => item.id === id);
      if (!record) return;
      dispatch({
        type: "PATCH",
        payload: {
          inputText: record.inputText,
          outputText: record.text,
          sourceLanguage: record.sourceLanguage,
          targetLanguage: record.targetLanguage,
          detectedLanguage: record.detectedLanguage,
          detectionConfidence: record.confidence,
          lastUpdated: Date.now(),
        },
      });
    },
    [state.history],
  );

  const clearConversation = useCallback(() => {
    dispatch({ type: "CLEAR_CONVERSATION" });
  }, []);

  const appendConversationTurn = useCallback((turn: ConversationTurn) => {
    dispatch({ type: "APPEND_CONVERSATION", payload: turn });
  }, []);

  const setMode = useCallback((mode: TranslationMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const copyOutput = useCallback(async () => {
    if (!state.outputText) {
      toast({
        title: "No translation yet",
        description: "Generate a translation before copying",
      });
      return;
    }
    if (!navigator?.clipboard) {
      toast({
        title: "Clipboard unavailable",
        description: "Your browser does not expose the Clipboard API.",
        variant: "destructive",
      });
      return;
    }
    await navigator.clipboard.writeText(state.outputText);
    toast({ title: "Copied translation" });
  }, [state.outputText, toast]);

  const shareOutput = useCallback(async () => {
    if (!state.outputText) {
      toast({
        title: "Nothing to share",
        description: "Translate some text first",
      });
      return;
    }
    if (navigator.share) {
      await navigator.share({
        title: "Tumọ translation",
        text: state.outputText,
      });
      return;
    }
    await copyOutput();
  }, [copyOutput, state.outputText, toast]);

  const translate = useCallback<TranslationActions["translate"]>(
    async (options) => {
      const text = state.inputText.trim();
      if (!text) {
        clearOutput();
        return undefined;
      }

      const realtimeKey = `${state.sourceLanguage}|${state.targetLanguage}|${text}`;
      if (
        options?.immediate &&
        lastRealtimeRequestRef.current === realtimeKey
      ) {
        return undefined;
      }

      dispatch({ type: "PATCH", payload: { isTranslating: true } });
      try {
        let detectedLanguage = state.sourceLanguage;
        let detectionConfidence = state.detectionConfidence;
        if (state.sourceLanguage === "auto") {
          const detection = await detectLanguage(text);
          detectedLanguage = detection.language;
          detectionConfidence = detection.confidence;
        }

        const result = await translateText({
          text,
          source: state.sourceLanguage,
          target: state.targetLanguage,
          stream: options?.immediate ?? false,
        });

        dispatch({
          type: "PATCH",
          payload: {
            outputText: result.text,
            detectedLanguage: detectedLanguage || result.detectedLanguage,
            detectionConfidence: detectionConfidence ?? result.confidence,
            realtimeLatency: result.latencyMs,
            lastUpdated: Date.now(),
          },
        });

        if (!options?.immediate) {
          const record: TranslationRecord = {
            id: crypto.randomUUID(),
            sourceLanguage: detectedLanguage || state.sourceLanguage,
            targetLanguage: state.targetLanguage,
            inputText: text,
            text: result.text,
            detectedLanguage: detectedLanguage || result.detectedLanguage,
            confidence: detectionConfidence ?? result.confidence,
            mode: state.mode,
            createdAt: Date.now(),
            favorite: false,
            offlineAvailable: true,
            provider: result.provider,
            latencyMs: result.latencyMs,
          };
          dispatch({ type: "ADD_HISTORY", payload: record });
        } else {
          lastRealtimeRequestRef.current = realtimeKey;
        }

        return result;
      } catch (error) {
        console.error("Translation error", error);
        toast({
          title: "Translation failed",
          description:
            error instanceof Error
              ? error.message
              : "Please try again shortly.",
          variant: "destructive",
        });
        return undefined;
      } finally {
        dispatch({ type: "PATCH", payload: { isTranslating: false } });
      }
    },
    [
      clearOutput,
      state.inputText,
      state.mode,
      state.sourceLanguage,
      state.targetLanguage,
      state.detectionConfidence,
      toast,
    ],
  );

  const speakOutput = useCallback(async () => {
    if (!state.outputText) {
      toast({ title: "No translation to play" });
      return;
    }
    dispatch({ type: "SET_SPEECH", payload: { isSynthesizing: true } });
    try {
      await speakText(state.outputText, state.targetLanguage);
    } catch (error) {
      toast({
        title: "Text-to-speech unavailable",
        description:
          error instanceof Error
            ? error.message
            : "Try a different language for audio playback.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_SPEECH", payload: { isSynthesizing: false } });
    }
  }, [state.outputText, state.targetLanguage, toast]);

  const startListening = useCallback(async () => {
    if (speechSessionRef.current) {
      speechSessionRef.current.stop();
    }
    try {
      const session = startSpeechRecognition(state.sourceLanguage, {
        onStart: () => {
          dispatch({
            type: "SET_SPEECH",
            payload: { isListening: true, error: undefined, transcript: "" },
          });
        },
        onResult: (transcript, isFinal) => {
          dispatch({
            type: "SET_SPEECH",
            payload: { transcript },
          });
          if (isFinal) {
            dispatch({
              type: "PATCH",
              payload: { inputText: `${state.inputText} ${transcript}`.trim() },
            });
          }
        },
        onError: (error) => {
          dispatch({
            type: "SET_SPEECH",
            payload: { isListening: false, error },
          });
          toast({
            title: "Could not capture audio",
            description: error,
            variant: "destructive",
          });
        },
        onEnd: () => {
          dispatch({ type: "SET_SPEECH", payload: { isListening: false } });
        },
      });
      speechSessionRef.current = session;
    } catch (error) {
      toast({
        title: "Speech capture unsupported",
        description:
          error instanceof Error
            ? error.message
            : "Your browser does not implement the Web Speech API yet.",
        variant: "destructive",
      });
    }
  }, [state.inputText, state.sourceLanguage, toast]);

  const stopListening = useCallback(() => {
    speechSessionRef.current?.stop();
    speechSessionRef.current = null;
    stopSpeechRecognition();
    dispatch({ type: "SET_SPEECH", payload: { isListening: false } });
  }, []);

  const stopSynthesizing = useCallback(() => {
    stopSpeaking();
    dispatch({ type: "SET_SPEECH", payload: { isSynthesizing: false } });
  }, []);

  const importFromImage = useCallback(
    async (file: File) => {
      dispatch({ type: "PATCH", payload: { isTranslating: true } });
      try {
        const text = await extractTextFromImage(file);
        if (!text) {
          toast({
            title: "No readable text",
            description: "Try capturing the document in brighter lighting.",
          });
          return;
        }
        dispatch({
          type: "PATCH",
          payload: { inputText: `${state.inputText}\n${text}`.trim() },
        });
      } catch (error) {
        toast({
          title: "Image recognition failed",
          description:
            error instanceof Error
              ? error.message
              : "We could not extract any text. Please retry with a sharper image.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "PATCH", payload: { isTranslating: false } });
      }
    },
    [state.inputText, toast],
  );

  useEffect(() => {
    if (state.mode !== "text") {
      return;
    }
    if (!state.inputText.trim()) {
      clearOutput();
      return;
    }
    const handler = window.setTimeout(() => {
      translate({ immediate: true });
    }, 900);
    return () => window.clearTimeout(handler);
  }, [clearOutput, state.inputText, state.mode, translate]);

  useEffect(() => {
    if (!network.online) {
      dispatch({
        type: "PATCH",
        payload: { offlineReady: state.history.length > 0 },
      });
    }
  }, [network.online, state.history.length]);

  const actions: TranslationActions = useMemo(
    () => ({
      setSourceLanguage,
      setTargetLanguage,
      swapLanguages,
      updateInputText,
      translate,
      clearOutput,
      speakOutput,
      stopSpeaking: stopSynthesizing,
      startListening,
      stopListening,
      importFromImage,
      toggleFavorite,
      removeHistoryItem,
      replayHistoryItem,
      clearConversation,
      appendConversationTurn,
      setMode,
      shareOutput,
      copyOutput,
    }),
    [
      appendConversationTurn,
      clearConversation,
      clearOutput,
      copyOutput,
      importFromImage,
      removeHistoryItem,
      replayHistoryItem,
      setMode,
      setSourceLanguage,
      setTargetLanguage,
      shareOutput,
      speakOutput,
      startListening,
      stopListening,
      stopSynthesizing,
      swapLanguages,
      toggleFavorite,
      translate,
      updateInputText,
    ],
  );

  const value = useMemo<TranslationContextValue>(
    () => ({
      state,
      actions,
      languages: LANGUAGE_OPTIONS,
    }),
    [actions, state],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationWorkspace = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error(
      "useTranslationWorkspace must be used within TranslationProvider",
    );
  }
  return ctx;
};
