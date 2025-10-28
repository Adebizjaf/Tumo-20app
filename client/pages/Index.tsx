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
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <GlassCard className="p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tumọ Engine
                </div>
                <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                  Translate anything instantly, anywhere.
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">
                  Speak, type, or snap a photo and Tumọ streams live
                  translations with smart language detection, natural voice
                  playback, and offline resilience when you need it most.
                </p>
                <div className="flex flex-wrap items-center gap-3">
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
              <div className="relative flex min-w-[220px] flex-col items-center gap-4 rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background p-6 text-center shadow-brand">
                <span className="rounded-full bg-secondary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                  Live status
                </span>
                <p className="font-display text-3xl font-semibold text-foreground">
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
                <div className="w-full space-y-3 rounded-2xl bg-background/80 p-4 text-left text-xs text-muted-foreground backdrop-blur">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    id="latency-toggle"
                    checked={showLatency}
                    onCheckedChange={setShowLatency}
                  />
                  <Label htmlFor="latency-toggle">Auto refresh stats</Label>
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
                          "h-10 rounded-full border border-border/60 px-4",
                          state.speech.isSynthesizing &&
                            "border-primary/40 bg-primary/20 text-primary",
                        )}
                      >
                        {state.speech.isSynthesizing ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4" />
                        )}
                        TTS
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

      <section className="grid gap-6 rounded-3xl border border-border/60 bg-background/70 p-6 backdrop-blur lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Feature matrix
          </p>
          <h2 className="font-display text-2xl font-semibold">
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
