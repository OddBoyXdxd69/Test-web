import { Play, Pause, SkipForward } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";

export default function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { current, isPlaying, toggle, next, currentTime, duration } = usePlayer();

  if (!current) return null;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onOpen}
      className="md:hidden fixed left-3 right-3 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-2xl bg-card/85 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 cursor-pointer"
    >
      <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-yt-red to-cyan" style={{ width: `${pct}%` }} />
      <div className="flex items-center gap-3 p-2.5">
        <img
          src={current.artwork}
          alt=""
          className="w-[52px] h-[52px] rounded-xl object-cover shrink-0"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{current.title}</p>
          <p className="text-xs text-t-muted truncate">{current.author}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="text-white/90 p-2 shrink-0"
          aria-label="Next"
        >
          <SkipForward size={22} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
