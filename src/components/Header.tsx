import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Gauge, User } from "lucide-react";
import SearchBar from "./SearchBar";
import ClusterModal, { AutoplayToggle } from "./ClusterModal";
import { useCluster } from "../hooks/useCluster";

export default function Header({ onOpenMobileSearch }: { onOpenMobileSearch: () => void }) {
  const [clusterOpen, setClusterOpen] = useState(false);
  const { active, onlineCount } = useCluster();
  const navigate = useNavigate();
  const location = useLocation();
  const inSearch = location.pathname === "/" && new URLSearchParams(location.search).get("q");

  return (
    <header className="sticky top-0 z-40 bg-panel/80 backdrop-blur-[16px] border-b border-white/5">
      <div className="h-16 flex items-center gap-3 px-3 sm:px-5">
        {/* Brand */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0 mr-1 sm:mr-3" aria-label="Home">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#FF0000">
            <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z" />
          </svg>
          <span className="hidden md:flex items-baseline gap-1 font-display">
            <span className="font-bold text-lg">YouTube</span>
            <span className="text-lg bg-gradient-to-r from-yt-red to-crimson bg-clip-text text-transparent font-extrabold">
              Music Pro
            </span>
          </span>
        </button>

        {/* Desktop search */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <SearchBar onNavigateToSearch={() => undefined} />
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Cluster status pill */}
        <button
          onClick={() => setClusterOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] transition-colors shrink-0"
          title="Lavalink cluster health"
        >
          <Gauge size={15} className="text-t-muted" />
          <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? "bg-active health-dot" : "bg-t-muted"}`} />
          <span className="text-xs font-medium">
            {active ? `${active.name} · ${active.ping}ms` : onlineCount > 0 ? "Connecting…" : "Cluster offline"}
          </span>
        </button>

        {/* Mobile search */}
        <button
          onClick={onOpenMobileSearch}
          className="sm:hidden p-2 rounded-full hover:bg-white/10"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* Mobile status dot */}
        <button
          onClick={() => setClusterOpen(true)}
          className={`sm:hidden w-2.5 h-2.5 rounded-full ${onlineCount > 0 ? "bg-active health-dot" : "bg-t-muted"}`}
          aria-label="Cluster status"
        />

        <AutoplayToggle />

        {/* Avatar */}
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-yt-red to-crimson flex items-center justify-center shrink-0 hover:scale-105 transition-transform" aria-label="Profile">
          <User size={18} />
        </button>
      </div>

      {inSearch && (
        <div className="sm:hidden px-3 pb-3">
          <SearchBar onNavigateToSearch={() => undefined} autoFocus />
        </div>
      )}

      <ClusterModal open={clusterOpen} onClose={() => setClusterOpen(false)} />
    </header>
  );
}
