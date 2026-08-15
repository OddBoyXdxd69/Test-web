import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music4 } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import type { SyncedLyricLine } from "../types";

export default function LyricsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lyrics, currentTime, seek, current } = usePlayer();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed right-0 top-0 bottom-0 z-[71] w-[420px] max-w-[92vw] bg-card border-l border-white/10 flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Music4 size={18} className="text-yt-red" />
            <div>
              <h3 className="font-display font-bold">Lyrics</h3>
              {current && <p className="text-xs text-t-muted max-w-[240px] truncate">{current.title} — {current.author}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <LyricsBody lyrics={lyrics} currentTime={currentTime} onSeek={seek} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function LyricsBody({
  lyrics,
  currentTime,
  onSeek,
}: {
  lyrics: SyncedLyricLine[] | string | null;
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => (Array.isArray(lyrics) ? lyrics : []), [lyrics]);

  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time - 0.35) idx = i;
      else break;
    }
    if (idx >= 0 && scrollRef.current) {
      const el = scrollRef.current.children[idx] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, lines]);

  if (!lyrics) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-8 text-center py-16">
        <Music4 size={28} className="text-t-muted" />
        <p className="text-sm text-t-muted">No synced lyrics found for this track.</p>
      </div>
    );
  }
  if (typeof lyrics === "string") {
    return (
      <div className="px-6 py-5">
        <p className="text-sm text-t-secondary whitespace-pre-wrap">{lyrics}</p>
      </div>
    );
  }

  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time - 0.35) active = i;
    else break;
  }

  return (
    <div ref={scrollRef} className="px-6 py-5 scroll-smooth">
      {lines.map((line, i) => (
        <button
          key={i}
          onClick={() => onSeek(Math.max(0, line.time - 2))}
          className={`lyric-line block w-full text-left py-1.5 text-base leading-snug font-medium ${
            i === active ? "text-white" : "text-t-muted/50"
          }`}
          style={i === active ? { fontSize: "1.3rem", lineHeight: "1.35" } : undefined}
        >
          {line.text}
        </button>
      ))}
      <p className="text-[11px] text-t-muted pt-4">Click a line to jump to that moment.</p>
    </div>
  );
}
