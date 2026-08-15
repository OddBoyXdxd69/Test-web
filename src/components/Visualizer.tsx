import { useEffect, useRef } from "react";

interface VisualizerProps {
  analyser: AnalyserNode | null;
  active: boolean;
  bars?: number;
  className?: string;
}

export default function Visualizer({ analyser, active, bars = 8, className = "" }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const count = bars;
      if (!analyser || !active) {
        for (let i = 0; i < count; i++) {
          const x = (width / count) * i + width / count / 2;
          ctx.fillStyle = "#444";
          ctx.fillRect(x - 1, height * 0.6, 2, height * 0.4);
        }
        return;
      }
      if (!dataRef.current) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataRef.current);
      const data = dataRef.current;

      const bandSize = Math.floor(data.length / count);
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "#00F2FE");
      gradient.addColorStop(1, "#FF0000");

      for (let i = 0; i < count; i++) {
        let sum = 0;
        for (let j = 0; j < bandSize; j++) sum += data[i * bandSize + j];
        const avg = sum / bandSize;
        const h = Math.max(4, (avg / 255) * height);
        const x = (width / count) * i + width / count / 2;
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 2, height - h, 4, h);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, active, bars]);

  return <canvas ref={canvasRef} className={className} width={80} height={24} />;
}
