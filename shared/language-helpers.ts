export interface LanguagePattern {
  language: string;
  pattern: RegExp;
  confidence: number;
}

export interface LanguageGuess {
  language: string;
  confidence: number;
}

const ASCII_PATTERN = /[A-Za-z]/;
const EXTENDED_LATIN_PATTERN = /[À-ÖØ-öø-ÿ]/;
const CYRILLIC_PATTERN = /[\u0400-\u04ff]/;
const GREEK_PATTERN = /[\u0370-\u03ff]/;
const DEVANAGARI_PATTERN = /[\u0900-\u097f]/;
const ARABIC_PATTERN = /[\u0600-\u06ff]/;
const HANGUL_PATTERN = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;
const KANA_PATTERN = /[\u3040-\u30ff]/;
const HAN_PATTERN = /[\u4e00-\u9fff]/;

export const LANGUAGE_PATTERNS: LanguagePattern[] = [
  { language: "es", pattern: /[ñá��íóúü¿¡]/i, confidence: 0.88 },
  { language: "fr", pattern: /[àâçéèêëîïôûùüÿœæ]/i, confidence: 0.86 },
  { language: "de", pattern: /[äöüß]/i, confidence: 0.82 },
  { language: "pt", pattern: /[ãõâêôç]/i, confidence: 0.82 },
  { language: "yo", pattern: /[ẹọṣńÀÈÌÒÙáéíóụ́̀́̄]/i, confidence: 0.84 },
  { language: "zh", pattern: HAN_PATTERN, confidence: 0.94 },
  { language: "ar", pattern: ARABIC_PATTERN, confidence: 0.92 },
  { language: "hi", pattern: DEVANAGARI_PATTERN, confidence: 0.92 },
  { language: "ja", pattern: KANA_PATTERN, confidence: 0.9 },
  { language: "ko", pattern: HANGUL_PATTERN, confidence: 0.9 },
];

const clampConfidence = (value: number) =>
  Math.max(0, Math.min(1, Number(value.toFixed(2))));

const registerCandidate = (
  store: Map<string, number>,
  language: string,
  confidence: number,
) => {
  if (!language) return;
  const clamped = clampConfidence(confidence);
  const current = store.get(language);
  if (current === undefined || clamped > current) {
    store.set(language, clamped);
  }
};

export const detectLanguageHeuristics = (
  text: string,
  options?: { maxCandidates?: number },
): LanguageGuess[] => {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const candidates = new Map<string, number>();

  for (const { language, pattern, confidence } of LANGUAGE_PATTERNS) {
    if (pattern.test(normalized)) {
      registerCandidate(candidates, language, confidence);
    }
  }

  if (ASCII_PATTERN.test(normalized)) {
    const asciiConfidence = EXTENDED_LATIN_PATTERN.test(normalized) ? 0.54 : 0.62;
    registerCandidate(candidates, "en", asciiConfidence);
  }

  if (CYRILLIC_PATTERN.test(normalized)) {
    registerCandidate(candidates, "ru", 0.86);
  }

  if (GREEK_PATTERN.test(normalized)) {
    registerCandidate(candidates, "el", 0.84);
  }

  if (DEVANAGARI_PATTERN.test(normalized)) {
    registerCandidate(candidates, "hi", 0.92);
  }

  if (ARABIC_PATTERN.test(normalized)) {
    registerCandidate(candidates, "ar", 0.92);
  }

  if (HANGUL_PATTERN.test(normalized)) {
    registerCandidate(candidates, "ko", 0.9);
  }

  if (KANA_PATTERN.test(normalized)) {
    registerCandidate(candidates, "ja", 0.9);
  }

  if (HAN_PATTERN.test(normalized)) {
    registerCandidate(candidates, "zh", 0.94);
  }

  if (candidates.size === 0 && normalized.length > 0) {
    registerCandidate(candidates, "en", 0.4);
  }

  const guesses = Array.from(candidates.entries()).map(
    ([language, confidence]) => ({
      language,
      confidence,
    }),
  );

  guesses.sort((a, b) => {
    if (b.confidence === a.confidence) {
      return a.language.localeCompare(b.language);
    }
    return b.confidence - a.confidence;
  });

  if (options?.maxCandidates) {
    return guesses.slice(0, options.maxCandidates);
  }

  return guesses;
};
