import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import PlayerBar from "../components/PlayerBar";
import MobileNav from "../components/MobileNav";
import MiniPlayer from "../components/MiniPlayer";
import NowPlaying from "../components/NowPlaying";
import QueueDrawer from "../components/QueueDrawer";
import EqualizerModal from "../components/EqualizerModal";
import SleepTimerModal from "../components/SleepTimerModal";
import LyricsPanel from "../components/LyricsPanel";
import SearchBar from "../components/SearchBar";
import { usePlayer } from "../hooks/usePlayer";

export default function AppLayout() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const navigate = useNavigate();
  const { showQueue, setShowQueue, showEq, setShowEq, showSleep, setShowSleep, showLyrics, setShowLyrics } = usePlayer();

  const onNewPlaylist = () => navigate("/library");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Header onOpenMobileSearch={() => setMobileSearchOpen(true)} />

      <div className="flex flex-1 min-h-0">
        <Sidebar onNewPlaylist={onNewPlaylist} />
        <main className="flex-1 min-w-0 overflow-y-auto pb-44 md:pb-6">
          <Outlet />
        </main>
      </div>

      <PlayerBar />

      {/* Mobile layer */}
      <MiniPlayer onOpen={() => setNowPlayingOpen(true)} />
      <MobileNav />
      <NowPlaying open={nowPlayingOpen} onClose={() => setNowPlayingOpen(false)} />

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-[90] bg-bg flex flex-col safe-bottom">
          <div className="flex items-center gap-2 px-3 pt-3">
            <SearchBar
              variant="mobile"
              autoFocus
              onNavigateToSearch={(q) => {
                setMobileSearchOpen(false);
                if (q) navigate(`/?q=${encodeURIComponent(q)}`);
              }}
            />
          </div>
          <p className="px-5 pt-6 text-sm text-t-muted">Search songs, artists, albums…</p>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="mt-auto mb-6 mx-auto px-6 py-2.5 rounded-full bg-white/[0.06] text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Desktop drawers & modals */}
      <QueueDrawer open={showQueue} onClose={() => setShowQueue(false)} />
      <LyricsPanel open={showLyrics} onClose={() => setShowLyrics(false)} />
      <EqualizerModal open={showEq} onClose={() => setShowEq(false)} />
      <SleepTimerModal open={showSleep} onClose={() => setShowSleep(false)} />
    </div>
  );
}
