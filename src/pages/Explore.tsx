import { useEffect, useState } from "react";
import { Play, Flame } from "lucide-react";
import type { Track } from "../types";
import { CATEGORIES } from "../types";
import { searchTracks } from "../lib/lavalink";
import { usePlayer } from "../hooks/usePlayer";
import CategoryPills from "../components/CategoryPills";
import TrackRow from "../components/TrackRow";
import TrackCard from "../components/TrackCard";

export default function Explore() {
  const [active, setActive] = useState<string>(CATEGORIES[0].label);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [top50, setTop50] = useState<Track[]>([]);
  const { playTracks } = usePlayer();

  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.label === active);
    if (!cat) return;
    let cancelled = false;
    setLoading(true);
    searchTracks(cat.query)
      .then((r) => !cancelled && setTracks(r.tracks.slice(0, 30)))
      .catch(() => !cancelled && setTracks([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    searchTracks("top 50 songs global hits")
      .then((r) => !cancelled && setTop50(r.tracks.slice(0, 8)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-4">Explore</h1>
      <CategoryPills active={active} onSelect={setActive} />

      <div className="mt-5 mb-6">
        <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-2">
          <Flame size={18} className="text-yt-red" /> {active}
        </h2>
        {loading && <p className="text-sm text-t-muted py-8 text-center">Loading…</p>}
        {!loading && (
          <div>
            <button
              onClick={() => playTracks(tracks)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yt-red hover:bg-crimson text-sm font-bold mb-3 transition-colors"
            >
              <Play size={16} fill="currentColor" /> Play Category
            </button>
            <div>
              {tracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} onPlayFrom={(idx) => playTracks(tracks, idx)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {top50.length > 0 && (
        <div className="mb-4">
          <h2 className="font-display font-bold text-lg mb-3">Global Top 50</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {top50.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                onPlay={() => playTracks(top50, top50.findIndex((x) => x.id === t.id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
