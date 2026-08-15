import { Routes, Route, Navigate } from "react-router-dom";
import { PlayerProvider } from "./hooks/usePlayer";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Library from "./pages/Library";
import Studio from "./pages/Studio";

export default function App() {
  return (
    <PlayerProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/library" element={<Library />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </PlayerProvider>
  );
}
