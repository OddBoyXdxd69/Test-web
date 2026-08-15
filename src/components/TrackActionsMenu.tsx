import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Play, ListPlus, ListEnd, Heart, FolderPlus } from "lucide-react";
import type { Track } from "../types";
import { usePlayer } from "../hooks/usePlayer";
import { useLikes } from "../hooks/useLikes";

interface Props {
  track: Track;
  onOpenPlaylistPicker?: (track: Track) => void;
}

export default function TrackActionsMenu({ track, onOpenPlaylistPicker }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { playTrack, playNext, addToQueue } = usePlayer();
  const { liked, toggle } = useLikes();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-2 rounded-full hover:bg-white/10 text-t-secondary hover:text-white transition-colors"
        aria-label="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-card border border-card-border shadow-2xl shadow-black/60 py-1.5 z-50">
          <button
            onClick={() => { playTrack(track); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-card-hover text-left"
          >
            <Play size={15} /> Play Now
          </button>
          <button
            onClick={() => { playNext(track); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-card-hover text-left"
          >
            <ListPlus size={15} /> Play Next
          </button>
          <button
            onClick={() => { addToQueue(track); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-card-hover text-left"
          >
            <ListEnd size={15} /> Add to End of Queue
          </button>
          <div className="h-px bg-white/10 my-1" />
          <button
            onClick={() => { toggle(track.id, track); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-card-hover text-left ${liked.has(track.id) ? "text-crimson" : ""}`}
          >
            <Heart size={15} fill={liked.has(track.id) ? "currentColor" : "none"} />
            {liked.has(track.id) ? "Remove from Liked" : "Like / Save"}
          </button>
          <button
            onClick={() => { setOpen(false); onOpenPlaylistPicker?.(track); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-card-hover text-left"
          >
            <FolderPlus size={15} /> Add to Playlist
          </button>
        </div>
      )}
    </div>
  );
}
