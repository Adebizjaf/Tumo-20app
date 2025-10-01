import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PagePlaceholderProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
  secondaryAction?: ReactNode;
  className?: string;
}

const PagePlaceholder = ({
  icon: Icon = Sparkles,
  title,
  description,
  ctaLabel,
  ctaTo,
  secondaryAction,
  className,
}: PagePlaceholderProps) => (
  <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-10 shadow-surface backdrop-blur", className)}>
    <div
      className="pointer-events-none absolute inset-0 bg-hero-surface opacity-80"
      aria-hidden="true"
    />
    <div className="pointer-events-none absolute -top-32 right-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </span>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {ctaLabel && ctaTo ? (
          <Button asChild className="rounded-full px-6">
            <NavLink to={ctaTo}>{ctaLabel}</NavLink>
          </Button>
        ) : null}
        {secondaryAction}
      </div>
    </div>
  </div>
);

export default PagePlaceholder;
