import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { fetchSuggestions } from "../lib/lavalink";
import { debounce } from "../lib/format";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "../lib/storage";

interface SearchBarProps {
  onNavigateToSearch: (q: string) => void;
  variant?: "header" | "mobile";
  autoFocus?: boolean;
}

export default function SearchBar({ onNavigateToSearch, variant = "header", autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(getRecentSearches());
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setRecents(getRecentSearches());
    setOpen(false);
    onNavigateToSearch(trimmed);
    navigate(`/?q=${encodeURIComponent(trimmed)}`);
  };

  const debouncedSuggest = useRef(
    debounce(async (q: string) => {
      if (q.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const res = await fetchSuggestions(q);
      setSuggestions(res.slice(0, 8));
    }, 200)
  ).current;

  useEffect(() => {
    if (query.trim().length >= 2) {
      setOpen(true);
      debouncedSuggest(query);
    } else {
      setSuggestions([]);
      setOpen(query.trim().length > 0);
    }
  }, [query, debouncedSuggest]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const list = suggestions.length ? suggestions : query.trim() ? [] : recents;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 focus-within:border-white/30 transition-colors ${
          variant === "mobile" ? "px-3 py-2" : "px-4 py-2.5"
        }`}
      >
        <Search size={variant === "mobile" ? 16 : 18} className="text-t-secondary shrink-0" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          onFocus={() => setOpen(true)}
          placeholder="Search songs, artists, albums..."
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-t-muted"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="text-t-muted hover:text-white"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && list.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-card border border-card-border shadow-2xl shadow-black/60 overflow-hidden z-50 backdrop-blur-xl">
          {!suggestions.length && recents.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-t-muted flex items-center gap-1">
                <Clock size={12} /> Recent searches
              </span>
              <button onClick={() => { clearRecentSearches(); setRecents([]); }} className="text-xs text-t-muted hover:text-white">
                Clear
              </button>
            </div>
          )}
          {list.map((s, i) => (
            <button
              key={`${s}-${i}`}
              onClick={() => runSearch(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-card-hover text-sm transition-colors"
            >
              {suggestions.length ? <TrendingUp size={14} className="text-t-muted shrink-0" /> : <Clock size={14} className="text-t-muted shrink-0" />}
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
