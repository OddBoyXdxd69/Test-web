import { lazy, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { Track } from "../types";
import { usePlayer } from "../hooks/usePlayer";
import TrackActionsMenu from "./TrackActionsMenu";

const LazyPicker = lazy(() => import("./PlaylistPickerModal"));

interface Props {
  track: Track;
  onPlay: (track: Track) => void;
}

export default function TrackCard({ track, onPlay }: Props) {
  const { current, isPlaying } = usePlayer();
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);
  const isCurrent = current?.id === track.id;

  return (
    <div
      onDoubleClick={() => onPlay(track)}
      className="group relative rounded-xl p-3 bg-card border border-card-border hover:bg-card-hover transition-colors cursor-pointer"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
        <img
          src={track.artworkHigh || track.artwork}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).src = track.artwork)}
        />
        <button
          onClick={() => onPlay(track)}
          className="absolute right-2 bottom-2 w-11 h-11 rounded-full bg-yt-red hover:bg-crimson flex items-center justify-center shadow-lg shadow-black/50 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
          aria-label="Play"
        >
          {isCurrent && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
        {isCurrent && (
          <div className="absolute top-2 left-2 playing-eq flex items-end gap-[2px] bg-black/70 rounded-md px-1.5 py-1 h-5">
            <span className="h-3" />
            <span className="h-2" />
            <span className="h-3" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{track.title}</p>
      <p className="text-xs text-t-muted truncate mt-0.5">{track.author}</p>

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrackActionsMenu track={track} onOpenPlaylistPicker={setPickerTrack} />
      </div>
      {pickerTrack && <LazyPicker track={pickerTrack} onClose={() => setPickerTrack(null)} />}
    </div>
  );
}
