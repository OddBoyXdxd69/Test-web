import { Play, Pause } from "lucide-react";
import type { Track } from "../types";
import { usePlayer } from "../hooks/usePlayer";

interface Props {
  track: Track;
  onPlay: () => void;
}

export default function HeroBanner({ track, onPlay }: Props) {
  const { current, isPlaying } = usePlayer();
  const isCurrent = current?.id === track.id;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-card-border">
      <div className="absolute inset-0">
        <img
          src={track.artworkHigh || track.artwork}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      </div>
      <div className="relative p-6 sm:p-10 max-w-lg">
        <span className="inline-block text-xs font-bold tracking-widest text-yt-red bg-black/60 rounded-full px-3 py-1 mb-4">
          #1 TRENDING
        </span>
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl leading-tight line-clamp-2">
          {track.title}
        </h2>
        <p className="text-t-secondary text-sm mt-2">{track.author}</p>
        <button
          onClick={onPlay}
          className="mt-6 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-yt-red hover:bg-crimson font-semibold text-sm transition-colors shadow-lg shadow-yt-red/30"
        >
          {isCurrent && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          Play Now
        </button>
      </div>
    </div>
  );
}
