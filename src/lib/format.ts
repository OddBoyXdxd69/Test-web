export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0:00";
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TAG_PATTERN = /\[[^\]]*\]|\([^)]*\)|【[^】]*】|-? *(official|lyrics|lyric|audio|video|remaster|hd|4k|8k|60fps|music video).*$/gi;

export function normalizeTitle(title: string): string {
  return title
    .replace(TAG_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeAuthor(author: string): string {
  return author
    .replace(/- topic$/i, "")
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase();
}

export function dedupeKey(track: {
  id: string;
  title: string;
  author: string;
}): string {
  return `${normalizeTitle(track.title)}|${normalizeAuthor(track.author)}`;
}

export function videoIdFromUri(uri: string): string {
  const m = uri.match(/[?&]v=([\w-]{5,})/);
  if (m) return m[1];
  const yt = uri.match(/youtu\.be\/([\w-]{5,})/);
  if (yt) return yt[1];
  return "";
}

export function artworkHigh(artwork: string): string {
  if (!artwork) return artwork;
  return artwork.replace("/mqdefault", "/maxresdefault");
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
