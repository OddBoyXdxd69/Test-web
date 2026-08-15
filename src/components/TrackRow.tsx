import { lazy, Suspense, useState } from "react";
import { Play, Pause, Heart, ListPlus, ListEnd } from "lucide-react";
import type { Track } from "../types";
import { usePlayer } from "../hooks/usePlayer";
import { useLikes } from "../hooks/useLikes";
import TrackActionsMenu from "./TrackActionsMenu";

const LazyPicker = lazy(() => import("./PlaylistPickerModal"));

interface Props {
  track: Track;
  index: number;
  onPlayFrom: (index: number) => void;
  showIndex?: boolean;
}

export default function TrackRow({ track, index, onPlayFrom, showIndex = true }: Props) {
  const { current, isPlaying, playNext, addToQueue } = usePlayer();
  const { liked, toggle } = useLikes();
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);
  const isCurrent = current?.id === track.id;

  return (
    <div
      onDoubleClick={() => onPlayFrom(index)}
      className="group flex items-center gap-3 px-2 sm:px-3 py-2 rounded-xl hover:bg-card-hover transition-colors cursor-pointer"
    >
      <div className="w-8 flex items-center justify-center shrink-0">
        {isCurrent && isPlaying ? (
          <div className="playing-eq flex items-end gap-[2px] h-4">
            <span className="h-4" />
            <span className="h-3" />
            <span className="h-4" />
            <span className="h-3" />
          </div>
        ) : (
          <>
            <span className="text-sm text-t-muted tabular-nums group-hover:hidden">
              {showIndex ? index + 1 : ""}
            </span>
            <button onClick={() => onPlayFrom(index)} className="hidden group-hover:flex text-white" aria-label="Play">
              <Play size={18} fill="currentColor" />
            </button>
          </>
        )}
      </div>

      <div className="relative shrink-0">
        <img
          src={track.artwork}
          alt=""
          loading="lazy"
          className="w-12 h-12 rounded-lg object-cover bg-card-hover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <button
          onClick={() => onPlayFrom(index)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
          aria-label="Play track"
        >
          {isCurrent && isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? "text-cyan" : "text-white"}`}>{track.title}</p>
        <p className="text-xs text-t-muted truncate">{track.author}</p>
      </div>

      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => playNext(track)} className="p-2 rounded-full hover:bg-white/10 text-t-secondary hover:text-white" title="Play Next">
          <ListPlus size={17} />
        </button>
        <button onClick={() => addToQueue(track)} className="p-2 rounded-full hover:bg-white/10 text-t-secondary hover:text-white" title="Add to Queue">
          <ListEnd size={17} />
        </button>
        <button
          onClick={() => toggle(track.id, track)}
          className={`p-2 rounded-full hover:bg-white/10 ${liked.has(track.id) ? "text-crimson" : "text-t-secondary hover:text-white"}`}
          title={liked.has(track.id) ? "Unlike" : "Like"}
        >
          <Heart size={17} fill={liked.has(track.id) ? "currentColor" : "none"} />
        </button>
      </div>

      <span className="text-xs text-t-muted tabular-nums shrink-0 hidden sm:block w-10 text-right">
        {track.durationFormatted}
      </span>

      <TrackActionsMenu track={track} onOpenPlaylistPicker={setPickerTrack} />
      {pickerTrack && (
        <Suspense fallback={null}>
          <LazyPicker track={pickerTrack} onClose={() => setPickerTrack(null)} />
        </Suspense>
      )}
    </div>
  );
}
