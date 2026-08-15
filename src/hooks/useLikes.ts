import { useEffect, useState } from "react";
import { toggleLike, getLikes } from "../lib/storage";
import type { Track } from "../types";

export function useLikes() {
  const [liked, setLiked] = useState<Set<string>>(() => new Set(getLikes()));

  useEffect(() => {
    const sync = () => setLiked(new Set(getLikes()));
    window.addEventListener("ymp:likes", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ymp:likes", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = (id: string, track?: Track): boolean => {
    const nowLiked = toggleLike(id, track);
    setLiked(new Set(getLikes()));
    window.dispatchEvent(new Event("ymp:likes"));
    return nowLiked;
  };

  return { liked, toggle };
}
