import { LanguageOption } from "./types";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "auto", name: "Detect language", nativeName: "Auto", supportsText: true },
  { code: "en", name: "English", nativeName: "English", supportsVoice: true, supportsText: true },
  { code: "es", name: "Spanish", nativeName: "Español", supportsVoice: true, supportsText: true },
  { code: "fr", name: "French", nativeName: "Français", supportsVoice: true, supportsText: true },
  { code: "de", name: "German", nativeName: "Deutsch", supportsVoice: true, supportsText: true },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", supportsVoice: false, supportsText: true },
  { code: "zh", name: "Chinese", nativeName: "中文", supportsVoice: true, supportsText: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", supportsVoice: true, supportsText: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", supportsVoice: true, supportsText: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", supportsVoice: true, supportsText: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", supportsVoice: true, supportsText: true },
];

export const DEFAULT_SOURCE = "auto";
export const DEFAULT_TARGET = "en";
export const MAX_INPUT_CHARACTERS = 5000;
