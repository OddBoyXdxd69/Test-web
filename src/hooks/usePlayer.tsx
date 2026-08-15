import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RepeatMode, SyncedLyricLine, Track } from "../types";
import { EQ_BANDS, SPEED_OPTIONS } from "../types";
import { QueueEngine } from "../lib/queue";
import { streamUrl, searchTracks } from "../lib/lavalink";
import { fetchLyrics } from "../lib/lyrics";
import {
  getAutoplay,
  getEq,
  getEqPreset,
  getVolume,
  recordHistory,
  setAutoplay as persistAutoplay,
  setEq as persistEq,
  setVolume as persistVolume,
} from "../lib/storage";
import { EQUALIZER_PRESETS } from "../types";

export type SleepOption = "15m" | "30m" | "45m" | "1h" | "end";

interface PlayerContextValue {
  audio: HTMLAudioElement | null;
  current: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playbackRate: number;
  queue: QueueItemView[];
  queueIndex: number;
  upcomingCount: number;
  lyrics: SyncedLyricLine[] | string | null;
  showLyrics: boolean;
  showQueue: boolean;
  showEq: boolean;
  showSleep: boolean;
  eqValues: number[];
  eqPreset: string;
  autoplay: boolean;
  sleepRemaining: number | null;
  sleepEndOfTrack: boolean;
  analyser: AnalyserNode | null;
  radioLoading: boolean;
  toggle: () => void;
  playTrack: (track: Track, opts?: { origin?: "search" | "radio" | "queue" | "playlist" }) => void;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => boolean;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPlaybackRate: (r: number) => void;
  cyclePlaybackRate: () => void;
  removeAt: (index: number) => void;
  removeUpcoming: () => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  shuffleUpcoming: () => void;
  setEqValue: (band: number, value: number) => void;
  setEqPreset: (name: string) => void;
  resetEq: () => void;
  toggleAutoplay: () => void;
  startSleep: (opt: SleepOption) => void;
  cancelSleep: () => void;
  setShowLyrics: (v: boolean) => void;
  setShowQueue: (v: boolean) => void;
  setShowEq: (v: boolean) => void;
  setShowSleep: (v: boolean) => void;
}

export interface QueueItemView {
  track: Track;
  origin: string;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef(new QueueEngine());
  const [, forceTick] = useState(0);

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getVolume());
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [lyrics, setLyrics] = useState<SyncedLyricLine[] | string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [eqValues, setEqValues] = useState<number[]>(getEq());
  const [eqPreset, setEqPresetState] = useState<string>(getEqPreset());
  const [autoplay, setAutoplayState] = useState(getAutoplay());
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const [sleepEndOfTrack, setSleepEndOfTrack] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTrackForRadioRef = useRef<string>("");
  const stoppedByTimerRef = useRef(false);

  const queue = useMemo(() => queueRef.current.list.map((i) => ({ track: i.track, origin: i.origin })), [queueRef, forceTick]);
  const queueIndex = queueRef.current.currentIndex;
  const upcomingCount = queueRef.current.upcomingCount;

  const sync = useCallback(() => forceTick((n) => n + 1), []);

  // ---------------------------------------------------------------
  // Audio graph setup (lazy on first user gesture)
  // ---------------------------------------------------------------
  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.volume = getVolume();
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
      audio.addEventListener("durationchange", () => {
        if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      });
      audio.addEventListener("loadeddata", () => setIsBuffering(false));
      audio.addEventListener("waiting", () => setIsBuffering(true));
      audio.addEventListener("playing", () => {
        setIsBuffering(false);
        setIsPlaying(true);
      });
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => handleEnded());
      audio.addEventListener("error", () => {
        setIsBuffering(false);
        setIsPlaying(false);
      });
    }
    return audioRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureGraph = useCallback(() => {
    ensureAudio();
    const audio = audioRef.current!;
    if (ctxRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const source = ctx.createMediaElementSource(audio);
    const filters = EQ_BANDS.map((band) => {
      const f = ctx.createBiquadFilter();
      f.type = band.type as BiquadFilterType;
      f.frequency.value = band.freq;
      f.gain.value = 0;
      return f;
    });
    filtersRef.current = filters;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    source.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
    filters[filters.length - 1].connect(analyser);
    analyser.connect(ctx.destination);

    // Apply persisted EQ
    const saved = getEq();
    filters.forEach((f, i) => {
      f.gain.value = saved[i] ?? 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockAudio = useCallback(() => {
    ensureGraph();
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => undefined);
    }
  }, [ensureGraph]);

  // ---------------------------------------------------------------
  // MediaSession
  // ---------------------------------------------------------------
  const updateMediaSession = useCallback((track: Track) => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.author,
      album: "YouTube Music Pro",
      artwork: [
        { src: track.artworkHigh || track.artwork, sizes: "512x512", type: "image/jpeg" },
        { src: track.artwork, sizes: "192x192", type: "image/jpeg" },
      ],
    });
  }, []);

  // ---------------------------------------------------------------
  // Playback core
  // ---------------------------------------------------------------
  const playCurrent = useCallback(
    (track: Track) => {
      ensureAudio();
      unlockAudio();
      const audio = audioRef.current!;
      if (audio.src && audio.src.includes(track.id)) {
        audio.play().catch(() => undefined);
        return;
      }
      setIsBuffering(true);
      audio.src = track.videoId ? streamUrl(track.videoId) : track.uri;
      audio.playbackRate = playbackRate;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn("playback error:", e);
          setIsBuffering(false);
        });
      setCurrent(track);
      setCurrentTime(0);
      updateMediaSession(track);
      recordHistory(track);
      // Lyrics fetch
      setLyrics(null);
      fetchLyrics(track.title, track.author)
        .then((l) => setLyrics(l))
        .catch(() => setLyrics(null));
    },
    [ensureAudio, unlockAudio, playbackRate, updateMediaSession]
  );

  const playTrack = useCallback(
    (track: Track, opts?: { origin?: "search" | "radio" | "queue" | "playlist" }) => {
      unlockAudio();
      queueRef.current.playNow(track, true);
      lastTrackForRadioRef.current = track.id;
      playCurrent(track);
      sync();
    },
    [playCurrent, sync, unlockAudio]
  );

  const playTracks = useCallback(
    (tracks: Track[], startIndex = 0) => {
      unlockAudio();
      queueRef.current.replace(tracks, "queue");
      const target = queueRef.current.jumpTo(startIndex);
      sync();
      if (target) {
        lastTrackForRadioRef.current = target.track.id;
        playCurrent(target.track);
      }
    },
    [playCurrent, sync, unlockAudio]
  );

  const playNext = useCallback(
    (track: Track) => {
      const ok = queueRef.current.playNext(track);
      sync();
      return ok;
    },
    [sync]
  );

  const addToQueue = useCallback(
    (track: Track): boolean => {
      const ok = queueRef.current.enqueue(track, "queue");
      sync();
      return ok;
    },
    [sync]
  );

  const next = useCallback(() => {
    const item = queueRef.current.next();
    sync();
    if (item) {
      lastTrackForRadioRef.current = item.track.id;
      playCurrent(item.track);
    } else if (repeat === "all" && queueRef.current.size > 0) {
      const first = queueRef.current.jumpTo(0);
      sync();
      if (first) {
        lastTrackForRadioRef.current = first.track.id;
        playCurrent(first.track);
      }
    }
  }, [playCurrent, repeat, sync]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const item = queueRef.current.previous();
    sync();
    if (item) {
      lastTrackForRadioRef.current = item.track.id;
      playCurrent(item.track);
    }
  }, [playCurrent, sync]);

  const toggle = useCallback(() => {
    const audio = ensureAudio();
    unlockAudio();
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [ensureAudio, unlockAudio]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(time)) return;
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || time));
      setCurrentTime(audio.currentTime);
    },
    []
  );

  const handleEnded = useCallback(() => {
    if (stoppedByTimerRef.current) {
      stoppedByTimerRef.current = false;
      return;
    }
    if (repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
      }
      return;
    }
    if (sleepEndOfTrack) {
      setSleepEndOfTrack(false);
      setSleepRemaining(null);
      audioRef.current?.pause();
      return;
    }
    const item = queueRef.current.next();
    sync();
    if (item) {
      lastTrackForRadioRef.current = item.track.id;
      playCurrent(item.track);
    } else if (repeat === "all" && queueRef.current.size > 0) {
      const first = queueRef.current.jumpTo(0);
      sync();
      if (first) {
        lastTrackForRadioRef.current = first.track.id;
        playCurrent(first.track);
      }
    } else {
      setIsPlaying(false);
    }
  }, [playCurrent, repeat, sleepEndOfTrack, sync]);

  // ---------------------------------------------------------------
  // Autoplay radio
  // ---------------------------------------------------------------
  const loadRadio = useCallback(async () => {
    const item = queueRef.current.current;
    if (!item || !autoplay) return;
    if (queueRef.current.upcomingCount > 2) return;
    if (radioLoading) return;
    if (lastTrackForRadioRef.current !== item.track.id) {
      lastTrackForRadioRef.current = item.track.id;
    }
    setRadioLoading(true);
    try {
      const base = item.track.title;
      const relatedQuery = `${base.replace(/[\[\(【].*?[\]\)】]/g, "")} music`;
      const { tracks } = await searchTracks(relatedQuery);
      // Exclude the currently playing track itself
      const candidates = tracks.filter((t) => t.id !== item.track.id);
      const added = queueRef.current.addUnique(candidates, "radio");
      if (added > 0) sync();
    } catch {
      /* ignore radio failure */
    }
    setRadioLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, sync]);

  useEffect(() => {
    if (current && autoplay && isPlaying) {
      const timer = setTimeout(loadRadio, 800);
      return () => clearTimeout(timer);
    }
  }, [current, isPlaying, autoplay, loadRadio, upcomingCount]);

  // MediaSession action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => toggle());
      navigator.mediaSession.setActionHandler("pause", () => toggle());
      navigator.mediaSession.setActionHandler("previoustrack", () => previous());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler(
        "seekto",
        (d) => d.seekTime != null && seek(d.seekTime)
      );
    } catch {
      /* not supported */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {
        /* ignore */
      }
    };
  }, [next, previous, seek, toggle]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
    persistVolume(volume);
  }, [volume, muted]);

  // Playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sleep timer
  const startSleep = useCallback((opt: SleepOption) => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (opt === "end") {
      setSleepEndOfTrack(true);
      setSleepRemaining(null);
      return;
    }
    const minutes = opt === "15m" ? 15 : opt === "30m" ? 30 : opt === "45m" ? 45 : 60;
    const end = Date.now() + minutes * 60 * 1000;
    setSleepRemaining(minutes * 60);
    sleepTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
        stoppedByTimerRef.current = true;
        audioRef.current?.pause();
        setSleepRemaining(null);
      }
    }, 1000);
  }, []);

  const cancelSleep = useCallback(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepRemaining(null);
    setSleepEndOfTrack(false);
  }, []);

  // ---------------------------------------------------------------
  // EQ
  // ---------------------------------------------------------------
  const applyEq = useCallback((values: number[]) => {
    filtersRef.current.forEach((f, i) => {
      f.gain.value = values[i] ?? 0;
    });
  }, []);

  const setEqValue = useCallback(
    (band: number, value: number) => {
      const next = [...eqValues];
      next[band] = value;
      setEqValues(next);
      persistEq(next);
      applyEq(next);
      setEqPresetState("Custom");
      localStorage.setItem("ymp:eq-preset", "Custom");
    },
    [applyEq, eqValues]
  );

  const setEqPreset = useCallback(
    (name: string) => {
      const values = EQUALIZER_PRESETS[name];
      if (!values) return;
      setEqValues(values);
      persistEq(values);
      applyEq(values);
      setEqPresetState(name);
    },
    [applyEq]
  );

  const resetEq = useCallback(() => setEqPreset("Flat"), [setEqPreset]);

  // ---------------------------------------------------------------
  // Toggles
  // ---------------------------------------------------------------
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);
  const setPlaybackRate = useCallback((r: number) => setPlaybackRateState(r), []);
  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRateState((r) => {
      const i = SPEED_OPTIONS.indexOf(r);
      return SPEED_OPTIONS[(i + 1) % SPEED_OPTIONS.length];
    });
  }, []);
  const toggleAutoplay = useCallback(() => {
    setAutoplayState((a) => {
      persistAutoplay(!a);
      return !a;
    });
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const setVolumeFn = useCallback((v: number) => setVolumeState(v), []);

  // Shuffle upcoming / queue ops
  const removeAt = useCallback(
    (index: number) => {
      queueRef.current.removeAt(index);
      sync();
    },
    [sync]
  );
  const removeUpcoming = useCallback(() => {
    queueRef.current.removeUpcoming();
    sync();
  }, [sync]);
  const moveUp = useCallback(
    (index: number) => {
      queueRef.current.moveUp(index);
      sync();
    },
    [sync]
  );
  const moveDown = useCallback(
    (index: number) => {
      queueRef.current.moveDown(index);
      sync();
    },
    [sync]
  );
  const shuffleUpcoming = useCallback(() => {
    queueRef.current.shuffleUpcoming();
    sync();
  }, [sync]);

  // Global unlock on first interaction
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [unlockAudio]);

  const value: PlayerContextValue = {
    audio: audioRef.current,
    current,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    playbackRate,
    queue,
    queueIndex,
    upcomingCount,
    lyrics,
    showLyrics,
    showQueue,
    showEq,
    showSleep,
    eqValues,
    eqPreset,
    autoplay,
    sleepRemaining,
    sleepEndOfTrack,
    analyser: analyserRef.current,
    radioLoading,
    toggle,
    playTrack,
    playTracks,
    playNext,
    addToQueue,
    next,
    previous,
    seek,
    setVolume: setVolumeFn,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setPlaybackRate,
    cyclePlaybackRate,
    removeAt,
    removeUpcoming,
    moveUp,
    moveDown,
    shuffleUpcoming,
    setEqValue,
    setEqPreset,
    resetEq,
    toggleAutoplay,
    startSleep,
    cancelSleep,
    setShowLyrics,
    setShowQueue,
    setShowEq,
    setShowSleep,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
