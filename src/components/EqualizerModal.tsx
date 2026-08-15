import { X } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { EQ_BANDS, EQUALIZER_PRESETS } from "../types";

export default function EqualizerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { eqValues, eqPreset, setEqValue, setEqPreset, resetEq } = usePlayer();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-lg">Equalizer</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-t-muted mb-4">5-band EQ — changes apply live and persist across sessions.</p>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(EQUALIZER_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => setEqPreset(name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                eqPreset === name ? "bg-white text-black" : "bg-white/[0.06] text-t-secondary hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
          <button onClick={resetEq} className="px-3 py-1.5 rounded-full text-xs font-semibold text-crimson hover:bg-white/[0.06]">
            Reset
          </button>
        </div>

        {/* Sliders */}
        <div className="flex items-end justify-between gap-3 h-64">
          {EQ_BANDS.map((band, i) => (
            <div key={band.label} className="flex flex-col items-center flex-1 h-full">
              <span className={`text-xs font-bold tabular-nums ${eqValues[i] > 0 ? "text-cyan" : eqValues[i] < 0 ? "text-crimson" : "text-t-muted"}`}>
                {eqValues[i] > 0 ? `+${eqValues[i]}` : eqValues[i]}dB
              </span>
              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={eqValues[i]}
                onChange={(e) => setEqValue(i, Number(e.target.value))}
                className="flex-1 w-8 rotate-180"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
                aria-label={band.label}
              />
              <span className="text-[11px] text-t-muted mt-2">{band.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-t-muted mt-4 text-center">
          Preset: <span className="text-white font-semibold">{eqPreset}</span>
        </p>
      </div>
    </div>
  );
}
