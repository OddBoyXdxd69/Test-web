import { useCallback, useEffect, useRef, useState } from "react";
import type { LavalinkNodeStatus } from "../types";
import { NODES, pingAllNodes } from "../lib/lavalink";

export function useCluster() {
  const [nodes, setNodes] = useState<LavalinkNodeStatus[]>(
    NODES.map((n) => ({ id: n.id, name: n.name, status: "offline" as const, ping: -1 }))
  );
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setLoading(true);
    try {
      const results = await pingAllNodes();
      setNodes(results);
      const online = results.filter((r) => r.status !== "offline").sort((a, b) => a.ping - b.ping);
      setActiveNodeId(online[0]?.id || "");
    } finally {
      running.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const active = nodes.find((n) => n.id === activeNodeId) || null;
  const onlineCount = nodes.filter((n) => n.status !== "offline").length;

  return { nodes, active, activeNodeId, loading, onlineCount, refresh };
}
