import { useEffect, useState } from "react";
import { Play, Pause, X } from "lucide-react";
import type { LavalinkNodeStatus } from "../types";
import { usePlayer } from "../hooks/usePlayer";
import { useCluster } from "../hooks/useCluster";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ClusterModal({ open, onClose }: Props) {
  const { nodes, refresh } = useCluster();

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  if (!open) return null;

  const online = nodes.filter((n) => n.status !== "offline").length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-card-border rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-lg">Lavalink Cluster</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-t-muted mb-4">
          {online} of {nodes.length} nodes online — requests route to the lowest-latency node.
        </p>

        <div className="space-y-2">
          {nodes.map((n) => (
            <NodeCard key={n.id} node={n} />
          ))}
        </div>

        <button
          onClick={refresh}
          className="mt-4 w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-sm font-medium transition-colors"
        >
          Re-check latency
        </button>
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: LavalinkNodeStatus }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            node.status === "online"
              ? "bg-active health-dot"
              : node.status === "degraded"
              ? "bg-amber-400"
              : "bg-t-muted"
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{node.name}</p>
          <p className="text-xs text-t-muted">{node.id}</p>
        </div>
      </div>
      <span
        className={`text-xs font-semibold tabular-nums ${
          node.status === "online" ? "text-active" : node.status === "degraded" ? "text-amber-400" : "text-t-muted"
        }`}
      >
        {node.status === "offline" ? "offline" : `${node.ping}ms`}
      </span>
    </div>
  );
}

export function AutoplayToggle({ compact = false }: { compact?: boolean }) {
  const { autoplay, toggleAutoplay } = usePlayer();
  return (
    <button
      onClick={toggleAutoplay}
      className={`flex items-center gap-2 rounded-full border transition-colors ${
        autoplay ? "border-active/50 bg-active/10 text-active" : "border-white/10 bg-white/[0.04] text-t-muted"
      } ${compact ? "px-3 py-1.5 text-xs font-medium" : "px-4 py-2 text-sm font-medium"}`}
      title="Continuous radio autoplay"
    >
      {autoplay ? <Pause size={14} /> : <Play size={14} />}
      {autoplay ? "Autoplay: ON" : "Autoplay: OFF"}
    </button>
  );
}

export function NodeStatusPill() {
  const { active, onlineCount } = useCluster();
  void active;
  void onlineCount;
  return null;
}
