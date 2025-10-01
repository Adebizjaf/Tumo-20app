import { PropsWithChildren } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Languages,
  MessageCircle,
  Clock3,
  Settings,
  Sparkles,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NetworkStatusPill from "@/components/status/NetworkStatusPill";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Translate",
    description: "Realtime text & speech",
    icon: Languages,
  },
  {
    to: "/conversations",
    label: "Conversations",
    description: "Live dialogue mode",
    icon: MessageCircle,
  },
  {
    to: "/history",
    label: "History",
    description: "Saved & offline",
    icon: Clock3,
  },
  {
    to: "/settings",
    label: "Settings",
    description: "Preferences",
    icon: Settings,
  },
] as const;

const PROMO_TAGS = ["Realtime", "Offline ready", "Camera OCR"];

const AppBrand = () => (
  <NavLink to="/" className="group flex items-center gap-3">
    <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-brand transition-transform duration-300 group-hover:-translate-y-1">
      <Sparkles className="h-5 w-5" />
      <span className="absolute inset-0 rounded-2xl bg-accent/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
    </span>
    <div className="flex flex-col">
      <span className="font-display text-lg font-semibold tracking-tight">LinguaSphere</span>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Live translator</span>
    </div>
  </NavLink>
);

const DesktopNavigation = () => (
  <nav className="hidden items-center gap-2 rounded-full bg-card/80 p-1 shadow-surface backdrop-blur md:flex">
    {NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
            isActive
              ? "bg-primary text-primary-foreground shadow-brand"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          )
        }
        end={item.to === "/"}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

const PromoPills = () => (
  <div className="hidden items-center gap-2 md:flex">
    {PROMO_TAGS.map((tag) => (
      <Badge
        key={tag}
        variant="secondary"
        className="bg-secondary/20 text-secondary-foreground/80"
      >
        {tag}
      </Badge>
    ))}
  </div>
);

const MobileDock = () => (
  <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[92%] max-w-2xl items-center justify-between rounded-3xl border border-border/50 bg-background/80 p-1.5 shadow-surface backdrop-blur-md md:hidden">
    {NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        className={({ isActive }) =>
          cn(
            "flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )
        }
      >
        <item.icon className="h-5 w-5" />
        {item.label}
      </NavLink>
    ))}
  </nav>
);

const ActionBar = () => (
  <div className="flex items-center gap-2">
    <NetworkStatusPill />
    <ThemeToggle />
    <Button
      variant="default"
      size="sm"
      className="hidden gap-2 rounded-full bg-gradient-to-r from-primary to-secondary font-semibold tracking-tight shadow-brand hover:from-primary/90 hover:to-secondary/90 md:inline-flex"
    >
      <Waves className="h-4 w-4" />
      Launch Instant Mode
    </Button>
  </div>
);

const AppLayout = ({ children }: PropsWithChildren) => (
  <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
    <div className="pointer-events-none fixed inset-0 bg-hero-surface" aria-hidden="true" />
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-20 items-center justify-between gap-4">
          <AppBrand />
          <DesktopNavigation />
          <ActionBar />
        </div>
      </header>
      <main className="container relative flex-1 pb-24 pt-10 md:pb-12">
        <div className="mx-auto max-w-6xl space-y-10">
          {children ?? <Outlet />}
        </div>
      </main>
      <footer className="border-t border-border/60 bg-background/90 py-6">
        <div className="container flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LinguaSphere Labs. All rights reserved.</p>
          <PromoPills />
        </div>
      </footer>
    </div>
    <MobileDock />
  </div>
);

export const LayoutOutlet = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

export default AppLayout;
