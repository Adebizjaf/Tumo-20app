import { DemoResponse } from "@shared/api";
import { NavLink } from "react-router-dom";
import {
  Copy,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  MicOff,
  Repeat,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import GlassCard from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { OfflineStatusIndicator } from "@/components/status/OfflineStatusIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslationWorkspace } from "@/features/translation/TranslationProvider";
import { MAX_INPUT_CHARACTERS } from "@/features/translation/constants";

const microcopy = [
  "Type, speak, or snap",
  "Latency <200ms",
  "Focus on African languages",
];
const linguisticInsights = [
  { title: "Auto detect", description: "Smart detection of over 35 languages" },
  { title: "Context aware", description: "Understands idioms and slang" },
  {
    title: "Speech tuned",
    description: "Optimised for hands-free translation",
  },
];

// Common phrases for quick translation by language
const commonPhrases: Record<string, string[]> = {
  en: [
    "Hello", "Good morning", "Good afternoon", "Good evening",
    "Thank you", "Please", "Yes", "No", "Excuse me",
    "How are you?", "I don't understand", "Help",
    "Where is...?", "How much?", "Goodbye"
  ],
  es: [
    "Hola", "Buenos días", "Buenas tardes", "Buenas noches",
    "Gracias", "Por favor", "Sí", "No", "Perdón",
    "¿Cómo estás?", "No entiendo", "Ayuda",
    "¿Dónde está...?", "¿Cuánto cuesta?", "Adiós"
  ],
  fr: [
    "Bonjour", "Bonne journée", "Bon après-midi", "Bonsoir",
    "Merci", "S'il vous plaît", "Oui", "Non", "Excusez-moi",
    "Comment allez-vous?", "Je ne comprends pas", "Aide",
    "Où est...?", "Combien?", "Au revoir"
  ],
  de: [
    "Hallo", "Guten Morgen", "Guten Tag", "Guten Abend",
    "Danke", "Bitte", "Ja", "Nein", "Entschuldigung",
    "Wie geht es dir?", "Ich verstehe nicht", "Hilfe",
    "Wo ist...?", "Wie viel?", "Auf Wiedersehen"
  ],
  pt: [
    "Olá", "Bom dia", "Boa tarde", "Boa noite",
    "Obrigado", "Por favor", "Sim", "Não", "Com licença",
    "Como vai?", "Não entendo", "Ajuda",
    "Onde está...?", "Quanto custa?", "Adeus"
  ],
  it: [
    "Ciao", "Buongiorno", "Buon pomeriggio", "Buonasera",
    "Grazie", "Per favore", "Sì", "No", "Mi scusi",
    "Come stai?", "Non capisco", "Aiuto",
    "Dove è...?", "Quanto costa?", "Arrivederci"
  ],
  ar: [
    "مرحبا", "صباح الخير", "مساء الخير", "مساء الخير",
    "شكرا", "من فضلك", "نعم", "لا", "عفوا",
    "كيف حالك؟", "لا أفهم", "مساعدة",
    "أين...؟", "كم السعر؟", "وداعا"
  ],
  zh: [
    "你好", "早上好", "下午好", "晚上好",
    "谢谢", "请", "是", "不是", "对不起",
    "你好吗？", "我不明白", "帮助",
    "在哪里...？", "多少钱？", "再见"
  ],
  ja: [
    "こんにちは", "おはよう", "こんにちは", "こんばんは",
    "ありがとう", "お願いします", "はい", "いいえ", "すみません",
    "元気ですか？", "わかりません", "助けて",
    "どこですか...？", "いくらですか？", "さようなら"
  ],
  ko: [
    "안녕하세요", "좋은 아침", "좋은 오후", "좋은 저녁",
    "감사합니다", "부탁합니다", "예", "아니오", "실례합니다",
    "어떻게 지내세요?", "이해가 안 돼요", "도와주세요",
    "어디에 있나요...?", "얼마예요?", "안녕히 가세요"
  ],
  yo: [
    "Bọ̀jọ̀", "Ẹ káàrọ̀", "Ẹ káàsán", "Ẹ káàlẹ́",
    "Ẹ se", "Jọ̀wọ́", "Bẹ́ẹ̀ni", "Bẹ́ẹ̀kọ́", "Mo tọrọ gafara",
    "Bawo ni?", "Mi ò yé mi", "Ràn mí lọ́wọ́",
    "Níbo ni...?", "Elo ni?", "Ó dàbọ̀"
  ],
};

const Index = () => {
  const { state, actions, languages } = useTranslationWorkspace();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showLatency, setShowLatency] = useState(true);
  const speechToggleLabel = state.speech.isListening
    ? "Listening"
    : "Voice input";
  const realtimeStatus = useMemo(() => {
    if (state.isTranslating) {
      return "Translating";
    }
    if (state.realtimeLatency) {
      if (state.realtimeLatency < 300) return "Lightning fast";
      if (state.realtimeLatency < 750) return "Responsive";
      return "Processing";
    }
    return "Idle";
  }, [state.isTranslating, state.realtimeLatency]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const activeVoice = state.speech.isListening;

  return (
    <div className="w-full max-w-full space-y-8 lg:space-y-10">
      <section className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-6 min-w-0">
          <GlassCard className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tumọ Engine
                </div>
                <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl xl:text-5xl">
                  Translate anything instantly, anywhere.
                </h1>
                <p className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Speak, type, or snap a photo and Tumọ streams live
                  translations with smart language detection, natural voice
                  playback, and offline resilience when you need it most.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {microcopy.map((line) => (
                    <Badge
                      key={line}
                      variant="secondary"
                      className="rounded-full border border-primary/20 bg-primary/10 text-primary"
                    >
                      {line}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 lg:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={state.sourceLanguage}
                    onValueChange={actions.setSourceLanguage}
                  >
                    <SelectTrigger className="w-48 rounded-2xl border-border/60 bg-background/80 text-base font-medium">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/60 bg-card/95 backdrop-blur">
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex flex-col">
                            <span className="font-medium">{language.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {language.nativeName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-border/60 text-muted-foreground hover:text-foreground"
                    onClick={actions.swapLanguages}
                  >
                    <Repeat className="h-4 w-4" />
                    Swap
                  </Button>
                  <Select
                    value={state.targetLanguage}
                    onValueChange={actions.setTargetLanguage}
                  >
                    <SelectTrigger className="w-48 rounded-2xl border-border/60 bg-background/80 text-base font-medium">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/60 bg-card/95 backdrop-blur">
                      {languages
                        .filter((language) => language.code !== "auto")
                        .map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {language.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {language.nativeName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {state.detectedLanguage ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/40 text-primary"
                    >
                      Auto detected · {state.detectedLanguage.toUpperCase()} ·
                      {state.detectionConfidence
                        ? ` ${(state.detectionConfidence * 100).toFixed(0)}%`
                        : ""}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60"
                    >
                      Detection active
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/60"
                  >
                    Mode · {state.mode.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Quick Phrases Section - Separate and Stylish */}
              {(commonPhrases[state.sourceLanguage] || commonPhrases[state.targetLanguage]) && (
                <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6 shadow-lg backdrop-blur-sm">
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                  
                  <div className="relative space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-3 pb-3 border-b border-border/30">
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                        QUICK PHRASES
                      </h3>
                    </div>

                    {/* Two Language Columns */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Source Language Phrases */}
                      {commonPhrases[state.sourceLanguage] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium uppercase tracking-wider text-primary">
                              {languages.find(l => l.code === state.sourceLanguage)?.name || state.sourceLanguage}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {(commonPhrases[state.sourceLanguage] || []).slice(0, 7).map((phrase, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  actions.updateInputText(phrase);
                                  actions.translate();
                                }}
                                className="w-full justify-start rounded-xl border-border/40 bg-background/80 px-4 py-5 text-left font-medium transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/20"
                              >
                                <span className="truncate">{phrase}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target Language Phrases */}
                      {commonPhrases[state.targetLanguage] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium uppercase tracking-wider text-primary">
                              {languages.find(l => l.code === state.targetLanguage)?.name || state.targetLanguage}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {(commonPhrases[state.targetLanguage] || []).slice(0, 7).map((phrase, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  actions.updateInputText(phrase);
                                  actions.translate();
                                }}
                                className="w-full justify-start rounded-xl border-border/40 bg-background/80 px-4 py-5 text-left font-medium transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/20"
                              >
                                <span className="truncate">{phrase}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Offline Status Indicator */}
              <OfflineStatusIndicator />

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-muted-foreground">
                    <span>Source input</span>
                    <span>
                      {state.inputText.length}/{MAX_INPUT_CHARACTERS}
                    </span>
                  </div>
                  <Textarea
                    value={state.inputText}
                    onChange={(event) =>
                      actions.updateInputText(event.target.value)
                    }
                    placeholder="Start typing or dictate your message..."
                    className="min-h-[180px] rounded-3xl border-border/60 bg-background/80 p-6 text-base leading-relaxed shadow-inner focus-visible:ring-primary"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Toggle
                        pressed={activeVoice}
                        onPressedChange={() =>
                          activeVoice
                            ? actions.stopListening()
                            : actions.startListening()
                        }
                        className={cn(
                          "h-10 rounded-full border border-border/60 px-4",
                          activeVoice &&
                            "border-secondary/40 bg-secondary/20 text-secondary",
                        )}
                      >
                        {activeVoice ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MicOff className="h-4 w-4" />
                        )}
                        {speechToggleLabel}
                      </Toggle>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full"
                        onClick={handleUploadClick}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Camera input
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            actions.importFromImage(file);
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-border/60"
                        onClick={actions.copyOutput}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-border/60"
                        onClick={actions.shareOutput}
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-muted-foreground">
                    <span>Translated output</span>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={state.speech.isSynthesizing}
                        onPressedChange={() =>
                          state.speech.isSynthesizing
                            ? actions.stopSpeaking()
                            : actions.speakOutput()
                        }
                        className={cn(
                          "group relative h-11 w-11 rounded-full p-0",
                          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                          "border-2 border-primary/20",
                          "hover:border-primary/40 hover:bg-primary/15 hover:scale-110",
                          "hover:shadow-lg hover:shadow-primary/25",
                          "active:scale-95",
                          "transition-all duration-300 ease-out",
                          state.speech.isSynthesizing &&
                            "border-primary bg-primary/20 shadow-lg shadow-primary/30 animate-pulse",
                        )}
                        aria-label={
                          state.speech.isSynthesizing
                            ? "Stop speaking"
                            : "Speak translation"
                        }
                      >
                        {state.speech.isSynthesizing ? (
                          <Volume2 className="h-5 w-5 text-primary transition-all duration-200" />
                        ) : (
                          <VolumeX className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        )}
                      </Toggle>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60"
                      >
                        {state.realtimeLatency
                          ? `${Math.round(state.realtimeLatency)}ms`
                          : ""}
                      </Badge>
                    </div>
                  </div>
                  <GlassCard className="min-h-[180px] p-6">
                    <ScrollArea className="max-h-[220px]">
                      <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                        {state.outputText ||
                          "Your translation will appear here with rich context"}
                      </p>
                    </ScrollArea>
                  </GlassCard>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Provider · {state.realtimeLatency ? "Realtime" : "Hybrid"}
                    </span>
                    <span>
                      Confidence ·{" "}
                      {state.detectionConfidence
                        ? `${(state.detectionConfidence * 100).toFixed(0)}%`
                        : "Adaptive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <span className="rounded-full bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                  Live status
                </span>
              </div>
              <p className="font-display text-3xl font-semibold text-foreground text-center">
                {realtimeStatus}
              </p>
              <div className="h-2 w-full rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{
                    width: state.isTranslating
                      ? "82%"
                      : showLatency && state.realtimeLatency
                        ? `${Math.min(Math.max(state.realtimeLatency / 10, 20), 100)}%`
                        : "22%",
                  }}
                />
              </div>
              <div className="space-y-3 rounded-2xl bg-background/80 p-4 text-xs text-muted-foreground backdrop-blur">
                <div className="flex items-center justify-between">
                  <span>Latency</span>
                  <span>
                    {state.realtimeLatency
                      ? `${Math.round(state.realtimeLatency)}ms`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Offline cache</span>
                  <span>{state.offlineReady ? "Enabled" : "Pending"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mode</span>
                  <span className="capitalize">{state.mode}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Switch
                  id="latency-toggle"
                  checked={showLatency}
                  onCheckedChange={setShowLatency}
                />
                <Label htmlFor="latency-toggle">Auto refresh stats</Label>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                Translation history
              </h2>
              <Button
                variant="ghost"
                className="gap-2 rounded-full px-4"
                disabled
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Access saved translations, even offline. Pin your favourites for
              quick playback.
            </p>
            <ScrollArea className="mt-4 max-h-[320px] pr-2">
              <div className="space-y-3">
                {state.history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    History will appear as you translate.
                  </div>
                ) : (
                  state.history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => actions.replayHistoryItem(item.id)}
                      className="w-full rounded-2xl border border-border/60 bg-background/80 p-4 text-left transition hover:border-primary/40 hover:bg-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          {item.sourceLanguage.toUpperCase()} →{" "}
                          {item.targetLanguage.toUpperCase()}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">
                        {item.text}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/80">
                        <span>
                          Confidence{" "}
                          {(item.confidence ?? 0.85 * 100).toFixed(0)}%
                        </span>
                        <span>
                          Offline {item.offlineAvailable ? "cached" : "—"}
                        </span>
                        <span>
                          Latency{" "}
                          {item.latencyMs
                            ? `${Math.round(item.latencyMs)}ms`
                            : "—"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-xl font-semibold">
              Conversational mode
            </h2>
            <p className="text-sm text-muted-foreground">
              Switch to dual-channel translation with diarised transcripts and
              live captions.
            </p>
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="rounded-full bg-muted/40 p-1">
                <TabsTrigger
                  value="overview"
                  className="rounded-full px-4 text-xs"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="latency"
                  className="rounded-full px-4 text-xs"
                >
                  Latency
                </TabsTrigger>
                <TabsTrigger
                  value="devices"
                  className="rounded-full px-4 text-xs"
                >
                  Devices
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="overview"
                className="mt-4 space-y-3 text-sm text-muted-foreground"
              >
                <p>
                  Split-screen dialogue with live captions over Bluetooth
                  headsets.
                </p>
                <p>Adaptive volumes and auto-turn-taking reduce crosstalk.</p>
              </TabsContent>
              <TabsContent value="latency" className="mt-4">
                <Progress
                  value={
                    state.realtimeLatency
                      ? Math.min(state.realtimeLatency / 10, 100)
                      : 25
                  }
                  className="h-2 rounded-full"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  We maintain sub-200ms latency for natural flow. Performance
                  adapts to network and device throughput.
                </p>
              </TabsContent>
              <TabsContent
                value="devices"
                className="mt-4 space-y-3 text-sm text-muted-foreground"
              >
                <p>Seamless handoff between mobile, desktop, and wearables.</p>
                <p>
                  Real-time transcripts sync to the cloud when connectivity
                  returns.
                </p>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-border/50">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <NavLink to="/conversations">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Try Conversation Mode
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                    New
                  </Badge>
                </NavLink>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Real-time bilingual conversations with live captions
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-xl font-semibold">
              Linguistic intelligence
            </h2>
            <div className="mt-4 grid gap-4">
              {linguisticInsights.map((insight) => (
                <div
                  key={insight.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/90 p-4"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {insight.title.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl border border-border/60 bg-background/70 p-4 sm:p-6 backdrop-blur lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Feature matrix
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold">
            Technical foundation
          </h2>
          <p className="text-sm text-muted-foreground">
            Built with resilient offline caches, adaptive network handling, and
            low-latency speech processing.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 text-sm">
          <h3 className="font-semibold text-foreground">State management</h3>
          <p className="text-muted-foreground">
            Deterministic store managing translation modes and history with
            local persistence.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 text-sm">
          <h3 className="font-semibold text-foreground">Network manager</h3>
          <p className="text-muted-foreground">
            Adaptive requests with timeouts, offline fallbacks, and streaming
            readiness.
          </p>
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 text-sm">
          <h3 className="font-semibold text-foreground">Device intelligence</h3>
          <p className="text-muted-foreground">
            Speech APIs leverage native capabilities with graceful degradation
            across browsers.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
