import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface GlassCardProps extends PropsWithChildren {
  className?: string;
}

const GlassCard = ({ className, children }: GlassCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 shadow-surface backdrop-blur",
      className,
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-white/0 mix-blend-overlay" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
    <div className="relative z-10 flex flex-col gap-4">{children}</div>
  </div>
);

export default GlassCard;
