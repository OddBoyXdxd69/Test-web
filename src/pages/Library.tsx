import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart, History, ListMusic, Play, Trash2, Music2 } from "lucide-react";
import type { Playlist, Track } from "../types";
import {
  getLikedTracks,
  getHistory,
  getPlaylists,
  renamePlaylist,
} from "../lib/storage";
import { usePlayer } from "../hooks/usePlayer";
import TrackRow from "../components/TrackRow";

type Tab = "liked" | "history" | "playlists";

export default function Library() {
  const [params] = useSearchParams();
  const playlistParam = params.get("playlist") || "";
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(playlistParam ? "playlists" : "liked");
  const [likedTracks, setLikedTracks] = useState<Track[]>(getLikedTracks());
  const [history, setHistory] = useState<Track[]>(getHistory());
  const [playlists, setPlaylists] = useState<Playlist[]>(getPlaylists());
  const [editingId, setEditingId] = useState<string | null>(null);
  const { playTracks } = usePlayer();

  const refresh = () => {
    setLikedTracks(getLikedTracks());
    setHistory(getHistory());
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    const sync = () => refresh();
    window.addEventListener("ymp:likes", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ymp:likes", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const activePlaylist = playlists.find((p) => p.id === playlistParam) || null;

  const TABS: { id: Tab; label: string; icon: typeof Heart }[] = [
    { id: "liked", label: "Liked Songs", icon: Heart },
    { id: "history", label: "History", icon: History },
    { id: "playlists", label: "Playlists", icon: ListMusic },
  ];

  return (
    <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-4">Library</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                navigate("/library");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                tab === t.id ? "bg-white text-black border-white" : "bg-card border-card-border text-t-secondary hover:text-white"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {activePlaylist && (
        <div className="mb-5 p-4 rounded-2xl bg-card border border-card-border">
          <div className="flex items-center gap-3">
            <Music2 size={22} className="text-yt-red shrink-0" />
            <div className="flex-1 min-w-0">
              {editingId === activePlaylist.id ? (
                <input
                  autoFocus
                  defaultValue={activePlaylist.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name) {
                      renamePlaylist(activePlaylist.id, name);
                      refresh();
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="bg-white/[0.06] rounded-lg px-2 py-1 text-sm outline-none border border-white/20 w-full max-w-xs"
                />
              ) : (
                <button onClick={() => setEditingId(activePlaylist.id)} className="font-display font-bold text-lg block hover:underline text-left">
                  {activePlaylist.name}
                </button>
              )}
              <p className="text-xs text-t-muted">{activePlaylist.tracks.length} tracks</p>
            </div>
            <button
              onClick={() => playTracks(activePlaylist.tracks)}
              disabled={activePlaylist.tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yt-red hover:bg-crimson text-sm font-bold disabled:opacity-40 transition-colors shrink-0"
            >
              <Play size={16} fill="currentColor" /> Play All
            </button>
          </div>
          <div className="mt-4">
            {activePlaylist.tracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                onPlayFrom={(idx) => playTracks(activePlaylist.tracks, idx)}
              />
            ))}
            {activePlaylist.tracks.length === 0 && (
              <p className="text-sm text-t-muted py-6 text-center">This playlist is empty — add tracks from search results.</p>
            )}
          </div>
        </div>
      )}

      {tab === "liked" && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Heart size={18} className="text-crimson" fill="currentColor" /> Liked Songs
            </h2>
            {likedTracks.length > 0 && (
              <button
                onClick={() => playTracks(likedTracks)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-yt-red hover:bg-crimson text-xs font-bold transition-colors"
              >
                <Play size={14} fill="currentColor" /> Play All
              </button>
            )}
          </div>
          <div>
            {likedTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} onPlayFrom={(idx) => playTracks(likedTracks, idx)} />
            ))}
          </div>
          {likedTracks.length === 0 && <EmptyState text="Tracks you like will show up here." />}
        </section>
      )}

      {tab === "history" && (
        <section>
          <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
            <History size={18} className="text-cyan" /> Listening History
          </h2>
          <div>
            {history.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} onPlayFrom={(idx) => playTracks(history, idx)} />
            ))}
          </div>
          {history.length === 0 && <EmptyState text="Nothing listened to yet." />}
        </section>
      )}

      {tab === "playlists" && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <ListMusic size={18} className="text-active" /> Your Playlists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/library?playlist=${p.id}`)}
                className="group text-left p-4 rounded-2xl bg-card border border-card-border hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yt-red to-crimson flex items-center justify-center">
                    <Music2 size={22} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Remove "${p.name}"?`)) {
                        removePlaylist(p.id);
                      }
                    }}
                    className="p-2 rounded-full text-t-muted hover:text-crimson opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-t-muted">{p.tracks.length} tracks</p>
              </button>
            ))}
          </div>
          {playlists.length === 0 && <EmptyState text="Create a playlist from the sidebar to get started." />}
        </section>
      )}
    </div>
  );

  function removePlaylist(id: string) {
    const remaining = playlists.filter((p) => p.id !== id);
    setPlaylists(remaining);
    localStorage.setItem("ymp:playlists", JSON.stringify(remaining));
  }
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-t-muted py-10 text-center">{text}</p>;
}
