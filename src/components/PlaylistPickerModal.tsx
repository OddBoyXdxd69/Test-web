import { useState } from "react";
import { X, Plus, Folder } from "lucide-react";
import type { Track } from "../types";
import { getPlaylists, createPlaylist, addTrackToPlaylist } from "../lib/storage";
import { usePlayer } from "../hooks/usePlayer";

interface Props {
  track: Track | null;
  onClose: () => void;
}

export default function PlaylistPickerModal({ track, onClose }: Props) {
  const [playlists, setPlaylists] = useState(getPlaylists());
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  const { setShowQueue } = usePlayer();

  if (!track) return null;

  const createAndAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const p = createPlaylist(trimmed);
    addTrackToPlaylist(p.id, track);
    setPlaylists(getPlaylists());
    setName("");
    setSaved(`Added to "${p.name}"`);
    setTimeout(() => setSaved(""), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-card-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[80vh] overflow-y-auto safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Add to Playlist</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-t-muted mb-4 line-clamp-1">{track.title} — {track.author}</p>

        {saved && <p className="text-sm text-active mb-3">{saved}</p>}

        <div className="flex gap-2 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
            placeholder="New playlist name..."
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30"
          />
          <button
            onClick={createAndAdd}
            className="px-4 py-2.5 rounded-lg bg-yt-red hover:bg-crimson text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus size={15} /> Create
          </button>
        </div>

        <div className="space-y-1">
          {playlists.length === 0 && (
            <p className="text-sm text-t-muted text-center py-6">No playlists yet. Create one above.</p>
          )}
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                addTrackToPlaylist(p.id, track);
                setSaved(`Added to "${p.name}"`);
                setTimeout(() => setSaved(""), 2000);
                setPlaylists(getPlaylists());
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card-hover text-sm text-left"
            >
              <Folder size={16} className="text-t-muted" />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-t-muted">{p.tracks.length}</span>
            </button>
          ))}
        </div>

        {playlists.length > 0 && (
          <button
            onClick={() => { setShowQueue(false); onClose(); }}
            className="mt-4 w-full text-sm text-cyan hover:underline"
          >
            View playlists in Library
          </button>
        )}
      </div>
    </div>
  );
}
