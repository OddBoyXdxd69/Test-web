import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUp, ArrowDown, Trash2, Shuffle, Eraser } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";

export default function QueueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { queue, queueIndex, removeAt, moveUp, moveDown, shuffleUpcoming, removeUpcoming, playTrack } = usePlayer();

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[71] w-[380px] max-w-[92vw] bg-card border-l border-white/10 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <h3 className="font-display font-bold text-lg">Queue</h3>
                <p className="text-xs text-t-muted">{queue.length} tracks</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-3">
              <button
                onClick={shuffleUpcoming}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-cyan"
              >
                <Shuffle size={13} /> Shuffle Upcoming
              </button>
              <button
                onClick={removeUpcoming}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-crimson"
              >
                <Eraser size={13} /> Clear Upcoming
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {queue.map((item, i) => {
                const isCurrentRow = i === queueIndex;
                return (
                  <div
                    key={`${item.track.id}-${i}`}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${
                      isCurrentRow ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {isCurrentRow ? (
                        <span className="playing-eq flex items-end gap-[2px] h-3.5">
                          <span className="h-3" /><span className="h-2" /><span className="h-3" />
                        </span>
                      ) : (
                        <span className="text-xs text-t-muted tabular-nums">{i + 1}</span>
                      )}
                    </div>
                    <button className="flex-1 min-w-0 flex items-center gap-2.5 text-left" onClick={() => !isCurrentRow && playTrack(item.track)}>
                      <img src={item.track.artwork} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <span className="min-w-0">
                        <span className={`block text-sm truncate ${isCurrentRow ? "text-cyan" : "text-white"}`}>{item.track.title}</span>
                        <span className="block text-xs text-t-muted truncate">{item.track.author}</span>
                      </span>
                    </button>
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => moveUp(i)}
                        disabled={i <= queueIndex + 1 || i >= queue.length}
                        className="p-0.5 text-t-muted hover:text-white disabled:opacity-20"
                        aria-label="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => moveDown(i)}
                        disabled={i < queueIndex + 1 || i >= queue.length - 1}
                        className="p-0.5 text-t-muted hover:text-white disabled:opacity-20"
                        aria-label="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                    <button onClick={() => removeAt(i)} className="p-1.5 text-t-muted hover:text-crimson shrink-0" aria-label="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {queue.length === 0 && <p className="text-sm text-t-muted text-center py-10">Queue is empty.</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
