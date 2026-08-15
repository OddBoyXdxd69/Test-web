import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, Search, Loader2 } from "lucide-react";
import type { Track } from "../types";
import { searchTracks } from "../lib/lavalink";
import { usePlayer } from "../hooks/usePlayer";
import TrackRow from "../components/TrackRow";
import TrackCard from "../components/TrackCard";
import HeroBanner from "../components/HeroBanner";

export default function Home() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const { playTracks } = usePlayer();

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    searchTracks(q)
      .then((r) => {
        if (!cancelled) setResults(r.tracks);
      })
      .catch(() => !cancelled && setError("Search failed — check cluster health."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q]);

  useEffect(() => {
    if (q) return;
    let cancelled = false;
    searchTracks("top hits right now")
      .then((r) => !cancelled && setTrending(r.tracks.slice(0, 12)))
      .catch(() => undefined);
    searchTracks("new music playlist")
      .then((r) => !cancelled && setQuickPicks(r.tracks.slice(0, 8)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [q]);

  if (q) {
    return (
      <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-display font-bold text-xl flex items-center gap-2">
            <Search size={20} className="text-yt-red" /> Results for “{q}”
          </h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-t-muted py-10">
            <Loader2 size={16} className="animate-spin" /> Searching all nodes…
          </div>
        )}
        {error && <p className="text-sm text-crimson py-6">{error}</p>}

        {!loading && !error && results.length > 0 && (
          <>
            <button
              onClick={() => playTracks(results)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yt-red hover:bg-crimson text-sm font-bold mb-4 transition-colors"
            >
              <Play size={16} fill="currentColor" /> Play All ({results.length})
            </button>
            <div>
              {results.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} onPlayFrom={(idx) => playTracks(results, idx)} />
              ))}
            </div>
          </>
        )}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-t-muted py-6">No results found. Try a different query.</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto">
      {trending[0] ? (
        <HeroBanner track={trending[0]} onPlay={() => playTracks(trending, 0)} />
      ) : (
        <div className="h-40 rounded-2xl bg-card border border-card-border animate-pulse" />
      )}

      <SectionTitle title="Quick Picks" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {quickPicks.map((t) => (
          <TrackCard key={t.id} track={t} onPlay={() => playTracks(quickPicks, quickPicks.findIndex((x) => x.id === t.id))} />
        ))}
      </div>

      <SectionTitle title="Trending Now" />
      <div>
        {trending.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} onPlayFrom={(idx) => playTracks(trending, idx)} />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-2">
      <h2 className="font-display font-bold text-xl">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
    </div>
  );
}
