import { Wifi, WifiOff, Gauge } from "lucide-react";

import { cn } from "@/lib/utils";
import useNetworkStatus from "@/hooks/use-network-status";

const NetworkStatusPill = () => {
  const { online, effectiveType, downlink, saveData } = useNetworkStatus();

  const Icon = online ? Wifi : WifiOff;
  const statusColor = online ? "text-secondary" : "text-destructive";
  const label = online ? "Online" : "Offline";

  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur-sm md:flex",
        !online && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", statusColor)} />
      <span>{label}</span>
      {online ? (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <Gauge className="h-3 w-3" />
          {effectiveType ?? "adaptive"}
          {typeof downlink === "number" ? `${Math.round(downlink * 10) / 10}Mbps` : null}
          {saveData ? "• saver" : null}
        </span>
      ) : (
        <span className="text-[10px] uppercase tracking-[0.2em]">Offline cache enabled</span>
      )}
    </div>
  );
};

export default NetworkStatusPill;
