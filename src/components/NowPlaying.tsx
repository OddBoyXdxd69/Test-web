import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  ListMusic,
  MicVocal as LyricsIcon,
  Sparkles,
  Timer,
  Gauge,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { usePlayer, type SleepOption } from "../hooks/usePlayer";
import { formatDuration } from "../lib/format";
import { searchTracks } from "../lib/lavalink";
import { SPEED_OPTIONS } from "../types";
import type { Track, SyncedLyricLine } from "../types";

export default function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    seek,
    toggle,
    next,
    previous,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    playbackRate,
    cyclePlaybackRate,
    queue,
    queueIndex,
    removeAt,
    moveUp,
    moveDown,
    shuffleUpcoming,
    removeUpcoming,
    playTrack,
    lyrics,
    isBuffering,
    showEq,
    setShowEq,
  } = usePlayer();
  const [tab, setTab] = useState<"queue" | "lyrics" | "related" | "timer" | "speed">("queue");
  const [related, setRelated] = useState<Track[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (open && current && related.length === 0 && !relatedLoading) {
      setRelatedLoading(true);
      searchTracks(`${current.author} music`)
        .then((r) => setRelated(r.tracks.filter((t) => t.id !== current.id).slice(0, 10)))
        .catch(() => undefined)
        .finally(() => setRelatedLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current]);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="md:hidden fixed inset-0 z-[95] bg-bg flex flex-col safe-bottom"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* Ambient backdrop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={current.artworkHigh || current.artwork}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-125 opacity-40"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            <div className="absolute inset-0 bg-bg/70" />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between px-4 pt-3 pb-1">
            <button onClick={onClose} className="p-2 -ml-2" aria-label="Close">
              <ChevronDown size={26} />
            </button>
            <div className="text-center min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-widest text-t-muted font-semibold">Now Playing</p>
              <p className="text-xs text-t-secondary truncate">{current.author}</p>
            </div>
            <button
              onClick={() => setShowEq(!showEq)}
              className="p-2 rounded-full hover:bg-white/10"
              aria-label="Equalizer"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {/* Album art */}
          <div className="relative flex-1 flex items-center justify-center px-8 py-2">
            <motion.img
              key={current.id}
              src={current.artworkHigh || current.artwork}
              alt=""
              className="aspect-square w-full max-w-[340px] rounded-2xl object-cover shadow-2xl shadow-black/70"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onError={(e) => ((e.target as HTMLImageElement).src = current.artwork)}
            />
            <div className="absolute top-2 left-8 sm:hidden">
              {isPlaying && (
                <span className="playing-eq flex items-end gap-[2px] h-4">
                  <span className="h-4" /><span className="h-3" /><span className="h-4" /><span className="h-3" />
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="relative px-6">
            <p className="font-display font-bold text-lg truncate">{current.title}</p>
          </div>

          {/* Progress */}
          <div className="relative px-6 mt-2">
            <div className="flex items-center justify-between text-[11px] text-t-muted tabular-nums mb-1">
              <span>{formatDuration(currentTime * 1000)}</span>
              <span>{formatDuration(duration * 1000)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.5}
              value={Math.min(currentTime, Math.max(duration, 1))}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-6"
              style={{ "--fill": `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } as CSSProperties}
              aria-label="Seek"
            />
          </div>

          {/* Controls */}
          <div className="relative flex items-center justify-center gap-8 py-3">
            <button onClick={toggleShuffle} className={shuffle ? "text-yt-red" : "text-t-secondary"}>
              <Shuffle size={22} />
            </button>
            <button onClick={previous} className="text-white">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={toggle}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isBuffering ? (
                <span className="w-7 h-7 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={30} fill="currentColor" />
              ) : (
                <Play size={30} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button onClick={next} className="text-white">
              <SkipForward size={32} fill="currentColor" />
            </button>
            <button onClick={cycleRepeat} className={repeat !== "off" ? "text-yt-red" : "text-t-secondary"}>
              {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
            </button>
          </div>

          {/* Action pills */}
          <div className="relative flex gap-2 overflow-x-auto no-scrollbar px-4 py-1">
            {(
              [
                ["queue", ListMusic, "UP NEXT"],
                ["lyrics", LyricsIcon, "LYRICS"],
                ["related", Sparkles, "RELATED"],
                ["timer", Timer, "TIMER"],
                ["speed", Gauge, "SPEED"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-wide shrink-0 transition-colors ${
                  tab === id ? "bg-white text-black" : "bg-white/[0.08] text-t-secondary hover:text-white"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="relative flex-1 min-h-[180px] overflow-hidden mt-2">
            {tab === "queue" && <QueueTab />}
            {tab === "lyrics" && <LyricsTab lyrics={lyrics} currentTime={currentTime} onSeek={seek} duration={duration} />}
            {tab === "related" && (
              <div className="h-full overflow-y-auto px-4 pb-4">
                {relatedLoading && <p className="text-sm text-t-muted text-center py-8">Loading related…</p>}
                {!relatedLoading && related.length === 0 && (
                  <p className="text-sm text-t-muted text-center py-8">No related tracks found.</p>
                )}
                {related.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => playTrack(t, { origin: "radio" })}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                  >
                    <span className="text-xs text-t-muted tabular-nums w-4">{i + 1}</span>
                    <img src={t.artwork} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="min-w-0">
                      <span className="block text-sm truncate">{t.title}</span>
                      <span className="block text-xs text-t-muted truncate">{t.author}</span>
                    </span>
                    <span className="ml-auto text-xs text-t-muted">{t.durationFormatted}</span>
                  </button>
                ))}
              </div>
            )}
            {tab === "timer" && <TimerTab />}
            {tab === "speed" && <SpeedTab />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QueueTab() {
  const {
    queue,
    queueIndex,
    current,
    isPlaying,
    shuffleUpcoming,
    removeUpcoming,
    removeAt,
    moveUp,
    moveDown,
    jumpTo,
  } = useQueueOps();

  void isPlaying;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pb-1">
        <p className="text-xs text-t-muted">{queue.length} tracks</p>
        <div className="flex gap-2">
          <button onClick={shuffleUpcoming} className="text-[11px] font-bold text-cyan px-3 py-1.5 rounded-full bg-white/[0.06]">
            Shuffle Upcoming
          </button>
          <button onClick={removeUpcoming} className="text-[11px] font-bold text-crimson px-3 py-1.5 rounded-full bg-white/[0.06]">
            Clear Queue
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {queue.map((item, i) => {
          const isCurrentRow = i === queueIndex;
          return (
            <motion.div
              key={`${item.track.id}-${i}`}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${isCurrentRow ? "bg-white/[0.06]" : ""}`}
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                {isCurrentRow ? (
                  <span className="playing-eq flex items-end gap-[2px] h-3.5">
                    <span className="h-3" /><span className="h-2" /><span className="h-3" />
                  </span>
                ) : (
                  <span className="text-xs text-t-muted tabular-nums">{i + 1}</span>
                )}
              </div>
              <img src={item.track.artwork} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isCurrentRow ? "text-cyan" : "text-white"}`}>{item.track.title}</p>
                <p className="text-xs text-t-muted truncate">{item.track.author}</p>
              </div>
              <span className="text-[10px] text-t-muted tabular-nums shrink-0">{item.track.durationFormatted}</span>
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i <= queueIndex + 1 || i >= queue.length}
                  className="p-1 text-t-muted hover:text-white disabled:opacity-20"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i < queueIndex + 1 || i >= queue.length - 1}
                  className="p-1 text-t-muted hover:text-white disabled:opacity-20"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <button onClick={() => removeAt(i)} className="p-1.5 text-t-muted hover:text-crimson shrink-0" aria-label="Remove">
                <Trash2 size={15} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function useQueueOps() {
  const ctx = usePlayer();
  const jumpTo = (index: number) => {
    // jumpTo is derived from queue index
    const item = ctx.queue[index];
    if (item) ctx.playTrack(item.track);
  };
  return { ...ctx, jumpTo };
}

function LyricsTab({
  lyrics,
  currentTime,
  onSeek,
  duration,
}: {
  lyrics: SyncedLyricLine[] | string | null;
  currentTime: number;
  onSeek: (t: number) => void;
  duration: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => (Array.isArray(lyrics) ? lyrics : []), [lyrics]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time - 0.35) idx = i;
      else break;
    }
    setActiveIndex(idx);
    if (idx >= 0 && scrollRef.current) {
      const el = scrollRef.current.children[idx] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, lines]);

  if (!lyrics) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
        <LyricsIcon size={28} className="text-t-muted" />
        <p className="text-sm text-t-muted">No synced lyrics found for this track.</p>
        <p className="text-xs text-t-muted/70">Try searching LRCLIB for a match.</p>
      </div>
    );
  }
  if (typeof lyrics === "string") {
    return (
      <div className="h-full overflow-y-auto px-6 pb-6">
        <p className="text-sm text-t-secondary whitespace-pre-wrap">{lyrics}</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-6 pb-6 scroll-smooth">
      {lines.map((line, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onSeek(Math.max(0, line.time - 2))}
            className={`lyric-line block w-full text-left py-1.5 text-base leading-snug font-medium ${
              active ? "text-white scale-100" : "text-t-muted/50"
            }`}
            style={active ? { fontSize: "1.35rem", lineHeight: "1.35" } : undefined}
          >
            {line.text}
          </button>
        );
      })}
      <p className="text-[10px] text-t-muted pt-4">Tap a line to jump to that moment.</p>
    </div>
  );
}

function TimerTab() {
  const { startSleep, cancelSleep, sleepRemaining, sleepEndOfTrack } = usePlayer();
  const options: { label: string; value: SleepOption }[] = [
    { label: "15 min", value: "15m" },
    { label: "30 min", value: "30m" },
    { label: "45 min", value: "45m" },
    { label: "1 hour", value: "1h" },
    { label: "End of Track", value: "end" },
  ];
  const active = sleepRemaining != null || sleepEndOfTrack;

  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <p className="text-xs text-t-muted mb-3">
        {active
          ? sleepEndOfTrack
            ? "Pausing at the end of the current track."
            : `Sleeping in ${Math.floor((sleepRemaining || 0) / 60)}:${String((sleepRemaining || 0) % 60).padStart(2, "0")}`
          : "Playback will stop automatically when the timer ends."}
      </p>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => startSleep(o.value)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-sm font-medium"
          >
            <span>{o.label}</span>
            <Timer size={16} className="text-t-muted" />
          </button>
        ))}
        {active && (
          <button onClick={cancelSleep} className="w-full py-3 rounded-xl bg-white/[0.08] text-crimson text-sm font-bold">
            Cancel timer
          </button>
        )}
      </div>
    </div>
  );
}

function SpeedTab() {
  const { playbackRate, setPlaybackRate } = usePlayer();
  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <p className="text-xs text-t-muted mb-3">Playback speed</p>
      <div className="space-y-2">
        {SPEED_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setPlaybackRate(r)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              playbackRate === r ? "bg-white text-black" : "bg-white/[0.05] hover:bg-white/[0.1]"
            }`}
          >
            <span>{r}×</span>
            {playbackRate === r && <span className="text-[10px] font-bold">ACTIVE</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
