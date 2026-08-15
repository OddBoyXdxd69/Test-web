export interface Track {
  id: string;
  title: string;
  author: string;
  duration: number;
  durationFormatted: string;
  uri: string;
  artwork: string;
  artworkHigh?: string;
  isStream: boolean;
  videoId?: string;
  encoded?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export interface SyncedLyricLine {
  time: number;
  text: string;
}

export interface LavalinkNodeStatus {
  id: string;
  name: string;
  status: "online" | "degraded" | "offline";
  ping: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface QueueItem {
  track: Track;
  origin: "search" | "radio" | "queue" | "playlist";
}

export const EQUALIZER_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  "Bass Boost": [6, 4, 1, -1, -2],
  "Vocal Clarity": [-2, 1, 4, 3, 1],
  Electronic: [5, 3, -1, 2, 4],
  Rock: [4, 2, -1, 3, 5],
};

export const EQ_BANDS = [
  { freq: 60, type: "lowshelf", label: "60Hz" },
  { freq: 250, type: "peaking", label: "250Hz" },
  { freq: 1000, type: "peaking", label: "1kHz" },
  { freq: 4000, type: "peaking", label: "4kHz" },
  { freq: 16000, type: "highshelf", label: "16kHz" },
] as const;

export const CATEGORIES = [
  { label: "Trending", emoji: "🔥", query: "trending music 2026" },
  { label: "Global Top 50", emoji: "🏆", query: "top 50 songs global hits" },
  { label: "Pop Hits", emoji: "✨", query: "pop hits playlist" },
  { label: "Hip Hop & Rap", emoji: "🎤", query: "hip hop rap music" },
  { label: "Lo-Fi Beats", emoji: "☕", query: "lo-fi beats to relax study" },
  { label: "Gaming Synth", emoji: "🎮", query: "synthwave gaming music" },
  { label: "Rock & Metal", emoji: "🎸", query: "rock metal classics" },
  { label: "High Energy Workout", emoji: "⚡", query: "workout motivation music" },
] as const;

export const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const STORAGE_KEYS = {
  likes: "ymp:likes",
  playlists: "ymp:playlists",
  history: "ymp:history",
  volume: "ymp:volume",
  autoplay: "ymp:autoplay",
  eq: "ymp:eq",
  eqPreset: "ymp:eq-preset",
  recentSearch: "ymp:recent-search",
};
