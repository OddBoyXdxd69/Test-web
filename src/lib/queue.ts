import type { QueueItem, Track } from "../types";
import { dedupeKey } from "./format";

/**
 * Zero-duplicate queue engine.
 * Tracks are identified by their video id OR normalized title+author so that
 * live versions / lyric uploads / remasters of the same song never repeat.
 */
export class QueueEngine {
  private items: QueueItem[] = [];
  private index = 0;

  get size(): number {
    return this.items.length;
  }

  get currentIndex(): number {
    return this.index;
  }

  get list(): QueueItem[] {
    return this.items;
  }

  get current(): QueueItem | null {
    return this.items[this.index] ?? null;
  }

  get upcoming(): QueueItem[] {
    return this.items.slice(this.index + 1);
  }

  get upcomingCount(): number {
    return Math.max(0, this.items.length - this.index - 1);
  }

  private seenKeys(track: Track): Set<string> {
    const keys = new Set<string>([track.id]);
    keys.add(dedupeKey(track));
    if (track.videoId) keys.add(`vid:${track.videoId}`);
    return keys;
  }

  has(track: Track): boolean {
    const keys = this.seenKeys(track);
    return this.items.some((i) => keys.has(i.track.id) || keys.has(dedupeKey(i.track)) || (track.videoId && i.track.videoId === track.videoId));
  }

  hasEncoded(encoded: string): boolean {
    return this.items.some((i) => i.track.encoded === encoded);
  }

  /** Replace the whole queue and start at index 0. */
  replace(tracks: Track[], origin: QueueItem["origin"] = "queue"): void {
    const unique: Track[] = [];
    const seen = new Set<string>();
    for (const t of tracks) {
      const key = t.videoId ? `vid:${t.videoId}` : dedupeKey(t);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(t);
    }
    this.items = unique.map((track) => ({ track, origin }));
    this.index = 0;
  }

  /** Start a single track immediately; queue keeps existing upcoming. */
  playNow(track: Track, keepUpcoming = false): void {
    if (keepUpcoming) {
      const upcoming = this.items.slice(this.index + 1);
      const before = this.items.slice(0, this.index);
      this.items = [...before, { track, origin: "search" }, ...upcoming];
      this.index = before.length;
      return;
    }
    this.items = [{ track, origin: "search" }];
    this.index = 0;
  }

  enqueue(track: Track, origin: QueueItem["origin"] = "queue"): boolean {
    if (this.has(track)) return false;
    this.items.push({ track, origin });
    return true;
  }

  enqueueMany(tracks: Track[], origin: QueueItem["origin"] = "queue"): number {
    let added = 0;
    for (const t of tracks) {
      if (this.enqueue(t, origin)) added++;
    }
    return added;
  }

  playNext(track: Track): boolean {
    if (this.has(track)) return false;
    this.items.splice(this.index + 1, 0, { track, origin: "queue" });
    return true;
  }

  next(): QueueItem | null {
    if (this.index < this.items.length - 1) {
      this.index += 1;
      return this.items[this.index];
    }
    return null;
  }

  previous(): QueueItem | null {
    if (this.index > 0) {
      this.index -= 1;
      return this.items[this.index];
    }
    return null;
  }

  jumpTo(index: number): QueueItem | null {
    if (index >= 0 && index < this.items.length) {
      this.index = index;
      return this.items[index];
    }
    return null;
  }

  removeAt(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    this.items.splice(index, 1);
    if (index < this.index) this.index -= 1;
    else if (index === this.index && this.items.length > 0) {
      this.index = Math.min(this.index, this.items.length - 1);
    }
  }

  removeUpcoming(): void {
    this.items = this.items.slice(0, this.index + 1);
  }

  moveUp(index: number): boolean {
    if (index <= this.index + 1 || index >= this.items.length) return false;
    const [item] = this.items.splice(index, 1);
    this.items.splice(index - 1, 0, item);
    return true;
  }

  moveDown(index: number): boolean {
    if (index < this.index + 1 || index >= this.items.length - 1) return false;
    const [item] = this.items.splice(index, 1);
    this.items.splice(index + 1, 0, item);
    return true;
  }

  shuffleUpcoming(): void {
    const start = this.index + 1;
    const rest = this.items.slice(start);
    if (rest.length < 2) return;
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.items = [...this.items.slice(0, start), ...rest];
  }

  /** Add N unique tracks not already present; returns number added. */
  addUnique(tracks: Track[], origin: QueueItem["origin"] = "radio"): number {
    let added = 0;
    for (const t of tracks) {
      if (this.has(t)) continue;
      this.items.push({ track: t, origin });
      added++;
    }
    return added;
  }

  reset(): void {
    this.items = [];
    this.index = 0;
  }
}
