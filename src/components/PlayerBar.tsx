import { useEffect, useState } from "react";
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  MicVocal,
  SlidersHorizontal,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { useLikes } from "../hooks/useLikes";
import { formatDuration } from "../lib/format";
import Visualizer from "./Visualizer";

export default function PlayerBar() {
  const {
    current,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    analyser,
    showLyrics,
    setShowLyrics,
    setShowQueue,
    setShowEq,
    setShowSleep,
  } = usePlayer();
  const { liked, toggle: toggleLike } = useLikes();

  if (!current) {
    return (
      <div className="hidden md:flex items-center h-[84px] px-4 bg-card border-t border-white/5">
        <p className="text-sm text-t-muted">Nothing playing — search for a song to get started.</p>
      </div>
    );
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="hidden md:flex items-center gap-4 px-4 h-[84px] bg-card border-t border-white/5 relative">
      {/* Left: now playing */}
      <div className="flex items-center gap-3 w-[26%] min-w-0">
        <img
          src={current.artwork}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden">
            <p className="text-sm font-medium whitespace-nowrap truncate">
              {current.title}
            </p>
          </div>
          <p className="text-xs text-t-muted truncate">{current.author}</p>
        </div>
        <button
          onClick={() => toggleLike(current.id, current)}
          className={`shrink-0 p-2 rounded-full hover:bg-white/10 ${liked.has(current.id) ? "text-crimson" : "text-t-muted hover:text-white"}`}
          aria-label="Like"
        >
          <Heart size={18} fill={liked.has(current.id) ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Center: controls */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 transition-colors ${shuffle ? "text-yt-red" : "text-t-muted hover:text-white"}`}
            aria-label="Shuffle"
          >
            <Shuffle size={17} />
          </button>
          <button onClick={previous} className="text-t-secondary hover:text-white transition-colors" aria-label="Previous">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button
            onClick={toggle}
            className="w-11 h-11 rounded-full bg-white hover:bg-white/90 text-black flex items-center justify-center transition-transform active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button onClick={next} className="text-t-secondary hover:text-white transition-colors" aria-label="Next">
            <SkipForward size={22} fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeat}
            className={`p-1.5 transition-colors ${repeat !== "off" ? "text-yt-red" : "text-t-muted hover:text-white"}`}
            aria-label="Repeat"
          >
            {repeat === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
          </button>
        </div>

        <div className="w-full flex items-center gap-2.5">
          <span className="text-[11px] text-t-muted tabular-nums w-10 text-right">{formatDuration(currentTime * 1000)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.5}
            value={Math.min(currentTime, Math.max(duration, 1))}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1"
            style={{ "--fill": `${pct}%` } as React.CSSProperties}
            aria-label="Seek"
          />
          <span className="text-[11px] text-t-muted tabular-nums w-10">{formatDuration(duration * 1000)}</span>
        </div>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-2 w-[26%] justify-end shrink-0">
        <Visualizer analyser={analyser} active={isPlaying} />
        <IconBtn active={showLyrics} onClick={() => setShowLyrics(!showLyrics)} label="Lyrics">
          <MicVocal size={18} />
        </IconBtn>
        <IconBtn active={false} onClick={() => setShowQueue(true)} label="Queue">
          <ListMusic size={18} />
        </IconBtn>
        <IconBtn active={false} onClick={() => setShowEq(true)} label="Equalizer">
          <SlidersHorizontal size={18} />
        </IconBtn>
        <IconBtn active={false} onClick={() => setShowSleep(true)} label="Sleep timer">
          <Timer size={18} />
        </IconBtn>
        <div className="flex items-center gap-1.5 w-32">
          <button onClick={toggleMute} className="text-t-muted hover:text-white shrink-0" aria-label="Mute">
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1"
            style={{ "--fill": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full transition-colors ${active ? "text-yt-red" : "text-t-muted hover:text-white hover:bg-white/10"}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
