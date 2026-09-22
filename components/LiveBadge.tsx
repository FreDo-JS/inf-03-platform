import type { LiveStatus } from "@/lib/hooks/useRealtimeProgress";

const LABEL: Record<LiveStatus, string> = {
  connecting: "łączenie…",
  live: "na żywo",
  offline: "offline",
};

export function LiveBadge({ status }: { status: LiveStatus }) {
  const color = status === "live" ? "bg-accent" : status === "offline" ? "bg-danger" : "bg-warn";
  return (
    <span className="chip" aria-live="polite">
      <span className="relative flex h-2 w-2">
        {status === "live" && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {LABEL[status]}
    </span>
  );
}
