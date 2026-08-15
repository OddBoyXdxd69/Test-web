import type { Playlist, Track } from "../types";
import { STORAGE_KEYS } from "../types";
import { uid } from "./format";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export function getLikes(): string[] {
  return read<string[]>(STORAGE_KEYS.likes, []);
}

export function isLiked(trackId: string): boolean {
  return getLikes().includes(trackId);
}

export function toggleLike(trackId: string, track?: Track): boolean {
  const likes = getLikes();
  const idx = likes.indexOf(trackId);
  if (idx >= 0) {
    likes.splice(idx, 1);
    write(STORAGE_KEYS.likes, likes);
    const cache = getLikedTracks();
    write("ymp:liked-tracks", cache.filter((t) => t.id !== trackId));
    return false;
  }
  likes.unshift(trackId);
  write(STORAGE_KEYS.likes, likes);
  if (track) {
    const cache = getLikedTracks().filter((t) => t.id !== trackId);
    cache.unshift(track);
    write("ymp:liked-tracks", cache);
  }
  return true;
}

export function getLikedTracks(): Track[] {
  return read<Track[]>("ymp:liked-tracks", []);
}

export function getPlaylists(): Playlist[] {
  return read<Playlist[]>(STORAGE_KEYS.playlists, []);
}

export function savePlaylists(playlists: Playlist[]): void {
  write(STORAGE_KEYS.playlists, playlists);
}

export function createPlaylist(name: string): Playlist {
  const p: Playlist = { id: uid(), name, tracks: [], createdAt: Date.now() };
  savePlaylists([p, ...getPlaylists()]);
  return p;
}

export function renamePlaylist(id: string, name: string): void {
  savePlaylists(getPlaylists().map((p) => (p.id === id ? { ...p, name } : p)));
}

export function addTrackToPlaylist(playlistId: string, track: Track): void {
  const playlists = getPlaylists().map((p) => {
    if (p.id !== playlistId) return p;
    if (p.tracks.some((t) => t.id === track.id)) return p;
    return { ...p, tracks: [...p.tracks, track] };
  });
  savePlaylists(playlists);
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string): void {
  savePlaylists(
    getPlaylists().map((p) =>
      p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p
    )
  );
}

export function getHistory(): Track[] {
  return read<Track[]>(STORAGE_KEYS.history, []);
}

export function recordHistory(track: Track): void {
  const history = getHistory().filter((t) => t.id !== track.id);
  history.unshift(track);
  write(STORAGE_KEYS.history, history.slice(0, 100));
}

export function getVolume(): number {
  const v = Number(localStorage.getItem(STORAGE_KEYS.volume));
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
}

export function setVolume(v: number): void {
  localStorage.setItem(STORAGE_KEYS.volume, String(v));
}

export function getAutoplay(): boolean {
  return localStorage.getItem(STORAGE_KEYS.autoplay) !== "0";
}

export function setAutoplay(v: boolean): void {
  localStorage.setItem(STORAGE_KEYS.autoplay, v ? "1" : "0");
}

export function getEq(): number[] {
  return read<number[]>(STORAGE_KEYS.eq, [0, 0, 0, 0, 0]);
}

export function setEq(bands: number[]): void {
  write(STORAGE_KEYS.eq, bands);
}

export function getEqPreset(): string {
  return localStorage.getItem(STORAGE_KEYS.eqPreset) || "Flat";
}

export function setEqPreset(name: string): void {
  localStorage.setItem(STORAGE_KEYS.eqPreset, name);
}

export function getRecentSearches(): string[] {
  return read<string[]>(STORAGE_KEYS.recentSearch, []);
}

export function addRecentSearch(q: string): void {
  const list = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
  list.unshift(q);
  write(STORAGE_KEYS.recentSearch, list.slice(0, 8));
}

export function clearRecentSearches(): void {
  localStorage.removeItem(STORAGE_KEYS.recentSearch);
}
