import type { LavalinkNodeStatus, Track } from "../types";
import { artworkHigh, formatDuration, videoIdFromUri } from "./format";

export interface LavalinkNode {
  id: string;
  name: string;
  host: string;
  port: number;
  auth: string;
  ssl: boolean;
}

export const NODES: LavalinkNode[] = [
  {
    id: "millohost-ssl",
    name: "Millohost SSL",
    host: "https://lava-v4.millohost.my.id",
    port: 443,
    auth: "https://discord.gg/mjS5J2K3ep",
    ssl: true,
  },
  {
    id: "kasawa-nonssl",
    name: "Kasawa",
    host: "http://lava2.kasawa.pro",
    port: 2334,
    auth: "youshallnotpass",
    ssl: false,
  },
  {
    id: "jirayu-direct",
    name: "Jirayu Direct",
    host: "http://lavalink.jirayu.net",
    port: 13592,
    auth: "youshallnotpass",
    ssl: false,
  },
  {
    id: "jirayu-ssl",
    name: "Jirayu SSL",
    host: "https://lavalink.jirayu.net",
    port: 443,
    auth: "youshallnotpass",
    ssl: true,
  },
];

export interface ApiSearchResult {
  node: string;
  tracks: Track[];
}

function mapLavalinkData(data: any): Track[] {
  if (!data || data.loadType !== "search") return [];
  return (data.data || [])
    .map((item: any) => {
      const info = item.info || {};
      const artwork = info.artworkUrl || "";
      return {
        id: info.identifier || item.encoded?.slice(0, 12) || Math.random().toString(36),
        title: info.title || "Unknown title",
        author: info.author || "Unknown artist",
        duration: info.length || 0,
        durationFormatted: formatDuration(info.length || 0),
        uri: info.uri || "",
        artwork,
        artworkHigh: artworkHigh(artwork),
        isStream: !!info.isStream,
        videoId: videoIdFromUri(info.uri || ""),
        encoded: item.encoded,
      };
    })
    .filter((t: Track) => t.videoId || t.uri);
}

async function httpJson<T>(url: string, timeoutMs = 20000): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchTracks(query: string, nodeId?: string): Promise<ApiSearchResult> {
  const q = `ytsearch:${query}`;
  const url = `/api/search?q=${encodeURIComponent(q)}${nodeId ? `&node=${encodeURIComponent(nodeId)}` : ""}`;
  const data = await httpJson<{ node: string; result: any }>(url, 30000);
  return { node: data.node, tracks: mapLavalinkData(data.result) };
}

export async function pingNode(nodeId: string): Promise<LavalinkNodeStatus> {
  try {
    const res = await httpJson<{ id: string; ping: number; status: string }>(`/api/ping?node=${nodeId}`, 8000);
    return {
      id: res.id,
      name: NODES.find((n) => n.id === res.id)?.name || res.id,
      status: res.status === "online" ? "online" : "offline",
      ping: res.ping,
    };
  } catch {
    return {
      id: nodeId,
      name: NODES.find((n) => n.id === nodeId)?.name || nodeId,
      status: "offline",
      ping: -1,
    };
  }
}

export async function pingAllNodes(): Promise<LavalinkNodeStatus[]> {
  const results = await Promise.all(NODES.map((n) => pingNode(n.id)));
  const online = results.filter((r) => r.status === "online");
  const best = online.sort((a, b) => a.ping - b.ping)[0];
  return results.map((r) => {
    const threshold = best ? best.ping * 3 : 400;
    const status = r.status === "online" && best && r.ping > Math.max(threshold, 250) ? "degraded" : r.status;
    return { ...r, status };
  });
}

export function streamUrl(videoId: string): string {
  return `/api/stream?videoId=${encodeURIComponent(videoId)}`;
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) return data[1] as string[];
    return [];
  } catch {
    return [];
  }
}
