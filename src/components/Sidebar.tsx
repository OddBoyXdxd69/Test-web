import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, Library, BarChart3, Plus, Music2 } from "lucide-react";
import { useState } from "react";
import { getPlaylists, createPlaylist } from "../lib/storage";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/library", label: "Library", icon: Library },
  { to: "/studio", label: "Studio Stats", icon: BarChart3 },
];

export default function Sidebar({ onNewPlaylist }: { onNewPlaylist: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [playlists, setPlaylists] = useState(getPlaylists());

  const sync = () => setPlaylists(getPlaylists());

  const create = () => {
    const name = window.prompt("New playlist name");
    if (name && name.trim()) {
      createPlaylist(name.trim());
      sync();
      onNewPlaylist();
      navigate("/library");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-panel/60 backdrop-blur border-r border-white/5 px-3 py-4 overflow-y-auto">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-white/[0.08] text-white" : "text-t-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={19} className={active ? "text-yt-red" : ""} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="my-4 border-t border-white/5" />

      <button
        onClick={create}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-yt-red hover:bg-crimson transition-colors"
      >
        <Plus size={18} /> New Playlist
      </button>

      <div className="mt-4 space-y-0.5">
        <p className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-t-muted">Your Playlists</p>
        {playlists.length === 0 && (
          <p className="px-3.5 py-2 text-xs text-t-muted">No playlists yet.</p>
        )}
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/library?playlist=${p.id}`)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm text-t-secondary hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <Music2 size={15} className="shrink-0" />
            <span className="flex-1 truncate text-left">{p.name}</span>
            <span className="text-xs text-t-muted tabular-nums">{p.tracks.length}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
