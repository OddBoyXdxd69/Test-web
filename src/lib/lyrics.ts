import type { SyncedLyricLine } from "../types";

interface LrcLibResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  trackName?: string;
  artistName?: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<SyncedLyricLine[] | string | null> {
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = (await res.json()) as LrcLibResult;
      return parseResult(data, title, artist);
    }
  } catch {
    /* fall through to search */
  }

  try {
    const res = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = (await res.json()) as LrcLibResult[];
      const match = data.find((d) => d && (d.syncedLyrics || d.plainLyrics));
      if (match) return parseResult(match, title, artist);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function parseResult(data: LrcLibResult, title: string, artist: string): SyncedLyricLine[] | string | null {
  if (data.syncedLyrics) {
    const lines = data.syncedLyrics
      .split("\n")
      .map((line) => {
        const m = line.match(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)/);
        if (!m) return null;
        const minutes = parseInt(m[1], 10);
        const seconds = parseInt(m[2], 10);
        const frac = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) / 1000 : 0;
        const text = (m[4] || "").trim();
        if (!text) return null;
        return { time: minutes * 60 + seconds + frac, text };
      })
      .filter((l): l is SyncedLyricLine => l !== null);
    if (lines.length) return lines;
  }
  if (data.plainLyrics) return data.plainLyrics;
  void title;
  void artist;
  return null;
}
