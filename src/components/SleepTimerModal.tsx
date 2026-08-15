import { X, Timer } from "lucide-react";
import { usePlayer, type SleepOption } from "../hooks/usePlayer";

const OPTIONS: { label: string; value: SleepOption; icon: string }[] = [
  { label: "15 minutes", value: "15m", icon: "15" },
  { label: "30 minutes", value: "30m", icon: "30" },
  { label: "45 minutes", value: "45m", icon: "45" },
  { label: "1 hour", value: "1h", icon: "60" },
  { label: "End of Track", value: "end", icon: "∞" },
];

export default function SleepTimerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { startSleep, cancelSleep, sleepRemaining, sleepEndOfTrack } = usePlayer();
  if (!open) return null;

  const active = sleepRemaining != null || sleepEndOfTrack;
  const remainingLabel =
    sleepRemaining != null
      ? `${Math.floor(sleepRemaining / 60)}:${String(sleepRemaining % 60).padStart(2, "0")}`
      : "";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-lg">Sleep Timer</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-t-muted mb-4">
          {active
            ? sleepEndOfTrack
              ? "Playback will stop at the end of the current track."
              : `Playback stops in ${remainingLabel}.`
            : "Pick a duration — playback stops automatically when the timer ends."}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => startSleep(o.value)}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 transition-colors"
            >
              <span className="text-lg font-bold font-display">{o.icon}</span>
              <span className="text-xs text-t-secondary">{o.label}</span>
            </button>
          ))}
        </div>

        {active && (
          <button
            onClick={cancelSleep}
            className="mt-4 w-full py-2.5 rounded-xl bg-crimson/15 text-crimson text-sm font-bold hover:bg-crimson/25 transition-colors"
          >
            Cancel timer
          </button>
        )}
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-t-muted mt-3">
          <Timer size={12} /> Timer runs in the background even if the app closes.
        </p>
      </div>
    </div>
  );
}
