export type TranslationMode = "text" | "speech" | "conversation" | "camera";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  supportsVoice?: boolean;
  supportsText?: boolean;
}

export interface TranslationRequest {
  text: string;
  source: string;
  target: string;
  stream?: boolean;
}

export interface TranslationResult {
  text: string;
  detectedLanguage?: string;
  confidence?: number;
  provider?: string;
  latencyMs?: number;
}

export interface TranslationRecord extends TranslationResult {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  inputText: string;
  mode: TranslationMode;
  createdAt: number;
  favorite: boolean;
  offlineAvailable: boolean;
}

export interface ConversationTurn {
  id: string;
  speaker: "user" | "partner";
  languageCode: string;
  transcript: string;
  translation: string;
  createdAt: number;
}

export interface SpeechState {
  isListening: boolean;
  isSynthesizing: boolean;
  error?: string;
  transcript?: string;
}

export interface TranslationState {
  inputText: string;
  outputText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string;
  detectionConfidence?: number;
  mode: TranslationMode;
  isTranslating: boolean;
  speech: SpeechState;
  history: TranslationRecord[];
  favorites: string[];
  conversation: ConversationTurn[];
  offlineReady: boolean;
  realtimeLatency?: number;
  lastUpdated?: number;
}

export interface TranslationActions {
  setSourceLanguage: (code: string) => void;
  setTargetLanguage: (code: string) => void;
  swapLanguages: () => void;
  updateInputText: (value: string) => void;
  translate: (options?: { immediate?: boolean }) => Promise<TranslationResult | undefined>;
  clearOutput: () => void;
  speakOutput: () => Promise<void>;
  stopSpeaking: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  importFromImage: (file: File) => Promise<void>;
  toggleFavorite: (id: string) => void;
  removeHistoryItem: (id: string) => void;
  replayHistoryItem: (id: string) => void;
  clearConversation: () => void;
  appendConversationTurn: (turn: ConversationTurn) => void;
  setMode: (mode: TranslationMode) => void;
  shareOutput: () => Promise<void>;
  copyOutput: () => Promise<void>;
}

export interface TranslationContextValue {
  state: TranslationState;
  actions: TranslationActions;
  languages: LanguageOption[];
}
