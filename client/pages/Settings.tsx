import PagePlaceholder from "@/components/layout/PagePlaceholder";
import { Button } from "@/components/ui/button";
import { Cog, ShieldCheck, Smartphone, Wifi } from "lucide-react";

const Settings = () => (
  <section className="space-y-10">
    <PagePlaceholder
      icon={Cog}
      title="Settings & Configuration"
      description="Configure translation defaults, privacy controls, and synchronisation. This surface will centralise feature flags for enterprise deployments."
      ctaLabel="Back to Translator"
      ctaTo="/"
      secondaryAction={
        <Button variant="outline" className="rounded-full" disabled>
          Sync profile
        </Button>
      }
    />
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Privacy presets
        </div>
        <p className="text-sm text-muted-foreground">
          Toggle on-device-only processing, anonymised analytics, and encryption
          keys for enterprise workspaces.
        </p>
      </div>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <Wifi className="h-5 w-5 text-secondary" />
          Network profiles
        </div>
        <p className="text-sm text-muted-foreground">
          Define bandwidth profiles, latency budgets, and adaptive streaming for
          fluctuating network conditions.
        </p>
      </div>
      <div className="rounded-3xl border border-border/50 bg-card/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center gap-3 font-medium text-foreground">
          <Smartphone className="h-5 w-5 text-accent" />
          Device handoff
        </div>
        <p className="text-sm text-muted-foreground">
          Seamlessly hand off active translations between mobile, desktop, and
          wearable devices with secure pairing.
        </p>
      </div>
    </div>
  </section>
);

export default Settings;
