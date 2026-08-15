import { useEffect, useMemo, useState } from "react";
import { Play, Clock, Heart, ListMusic, Server, Activity, Radio } from "lucide-react";
import type { Track } from "../types";
import { getHistory, getLikedTracks, getPlaylists, getVolume } from "../lib/storage";
import { usePlayer } from "../hooks/usePlayer";
import { useCluster } from "../hooks/useCluster";
import { useLikes } from "../hooks/useLikes";

export default function Studio() {
  const { queue, upcomingCount } = usePlayer();
  const { liked } = useLikes();
  const { nodes } = useCluster();
  const [history, setHistory] = useState<Track[]>(getHistory());
  const [likedTracks, setLikedTracks] = useState<Track[]>(getLikedTracks());
  const [playlists, setPlaylists] = useState(getPlaylists());

  useEffect(() => {
    const sync = () => {
      setHistory(getHistory());
      setLikedTracks(getLikedTracks());
      setPlaylists(getPlaylists());
    };
    window.addEventListener("ymp:likes", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ymp:likes", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const stats = useMemo(() => {
    const playCounts = new Map<string, number>();
    history.forEach((t) => playCounts.set(t.id, (playCounts.get(t.id) || 0) + 1));
    const top = [...playCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const tracks = top
      .map(([id, count]) => ({ track: history.find((t) => t.id === id), count }))
      .filter((x): x is { track: Track; count: number } => !!x.track);
    return tracks;
  }, [history]);

  const totalPlays = history.length;
  const uniqueTracks = new Set(history.map((t) => t.id)).size;
  const totalMinutes = Math.round(history.reduce((acc, t) => acc + (t.duration || 0), 0) / 60000);
  const online = nodes.filter((n) => n.status !== "offline").length;
  const best = nodes.filter((n) => n.status !== "offline").sort((a, b) => a.ping - b.ping)[0];

  return (
    <div className="px-4 sm:px-6 py-5 max-w-6xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-5">Studio</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Play size={16} />} label="Total plays" value={String(totalPlays)} />
        <StatCard icon={<Clock size={16} />} label="Minutes played" value={String(totalMinutes)} />
        <StatCard icon={<Heart size={16} />} label="Liked songs" value={String(liked.size)} />
        <StatCard icon={<ListMusic size={16} />} label="Playlists" value={String(playlists.length)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-card border border-card-border p-5">
          <h2 className="font-display font-bold text-lg mb-1">Most Played</h2>
          <p className="text-xs text-t-muted mb-4">{uniqueTracks} unique tracks this session</p>
          {stats.length === 0 && <p className="text-sm text-t-muted">Play some music to see your top tracks.</p>}
          <div className="space-y-2.5">
            {stats.map(({ track, count }, i) => (
              <div key={track.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-xs text-t-muted tabular-nums">{i + 1}</span>
                <img src={track.artwork} alt="" className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{track.title}</p>
                  <p className="text-xs text-t-muted truncate">{track.author}</p>
                </div>
                <span className="text-xs text-t-muted tabular-nums">{count}×</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-card-border p-5">
          <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <Server size={18} className="text-yt-red" /> Lavalink Cluster
          </h2>
          <p className="text-xs text-t-muted mb-4">
            {online} of {nodes.length} nodes online{best ? ` · fastest ${best.name} at ${best.ping}ms` : ""}
          </p>
          <div className="space-y-2">
            {nodes.map((n) => (
              <div key={n.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      n.status === "online" ? "bg-active health-dot" : n.status === "degraded" ? "bg-amber-400" : "bg-t-muted"
                    }`}
                  />
                  <span className="text-sm truncate">{n.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-t-muted">
                  {n.status === "offline" ? "offline" : `${n.ping}ms`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-card-border p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
          <Activity size={20} className="text-cyan" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Now in queue</p>
          <p className="text-xs text-t-muted">
            {queue.length} tracks queued · {upcomingCount} upcoming{likedTracks.length > 0 ? ` · ${likedTracks.length} liked` : ""} · volume {Math.round((getVolume() ?? 1) * 100)}%
          </p>
        </div>
        <Radio size={18} className="text-active shrink-0" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-card-border p-4">
      <div className="flex items-center gap-1.5 text-t-muted mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-display font-extrabold text-2xl">{value}</p>
    </div>
  );
}
