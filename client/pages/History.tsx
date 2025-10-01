import PagePlaceholder from "@/components/layout/PagePlaceholder";
import { Button } from "@/components/ui/button";
import { BookmarkCheck, CloudOff, Download } from "lucide-react";

const History = () => (
  <section className="space-y-10">
    <PagePlaceholder
      icon={BookmarkCheck}
      title="Translation History"
      description="Soon you will be able to revisit every translation, pin favourites for offline playback, and sync them securely across devices."
      ctaLabel="Start a new translation"
      ctaTo="/"
      secondaryAction={
        <Button variant="ghost" className="rounded-full px-6" disabled>
          Import history
        </Button>
      }
    />
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <Download className="h-5 w-5 text-primary" />
          Export insights
        </div>
        <p className="text-sm text-muted-foreground">
          Generate PDF or CSV summaries of your translation history, grouped by
          language pairs and usage context.
        </p>
      </div>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <CloudOff className="h-5 w-5 text-secondary" />
          Offline-first cache
        </div>
        <p className="text-sm text-muted-foreground">
          Everything you translate will be accessible offline with smart
          expiration logic and manual pinning.
        </p>
      </div>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <BookmarkCheck className="h-5 w-5 text-accent" />
          Collections & bookmarks
        </div>
        <p className="text-sm text-muted-foreground">
          Organise translations into collections for quick playback, sharing, or
          conversation rehearsals.
        </p>
      </div>
    </div>
  </section>
);

export default History;
