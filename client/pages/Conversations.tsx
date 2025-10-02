import { Button } from "@/components/ui/button";
import PagePlaceholder from "@/components/layout/PagePlaceholder";
import { MessageCircle, Waves } from "lucide-react";

const Conversations = () => (
  <section className="space-y-10">
    <PagePlaceholder
      icon={MessageCircle}
      title="Conversational Mode"
      description="A dedicated interface for real-time bilingual conversations is coming next. We will orchestrate duet captions, hands-free controls, and live transcripts across devices here."
      ctaLabel="Return to Translator"
      ctaTo="/"
      secondaryAction={
        <Button
          variant="outline"
          asChild
          className="rounded-full border-dashed"
        >
          <a href="mailto:adebisijafojo1@gmail.com?subject=Tumọ%20Conversation%20Flow">
            Request early access
          </a>
        </Button>
      }
    />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <Waves className="h-5 w-5 text-primary" />
          Live waveform visualiser
        </div>
        <p className="text-sm text-muted-foreground">
          Stay tuned for interactive waveforms that react to each speaker in
          real time, paired with adaptive translation delays under 200ms.
        </p>
      </div>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <MessageCircle className="h-5 w-5 text-secondary" />
          Dual-channel transcripts
        </div>
        <p className="text-sm text-muted-foreground">
          Multi-language transcripts and smart diarisation will land here, so
          you can review an entire conversation and export it instantly.
        </p>
      </div>
    </div>
  </section>
);

export default Conversations;
