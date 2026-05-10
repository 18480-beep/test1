/*
 * ECGPulse.tsx
 * Design: "Surgical Theater" — Animated ECG line at bottom of screen
 * Syncs with active scene for different heartbeat patterns
 */

import { useEffect, useRef } from "react";

interface ECGPulseProps {
  activeScene: number;
}

export default function ECGPulse({ activeScene }: ECGPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 60;
    };
    resize();
    window.addEventListener("resize", resize);

    const getColor = () => {
      if (activeScene <= 2) return "#00D4AA";
      if (activeScene === 3) return "#FF2020";
      if (activeScene === 4) return "#FF6B00";
      if (activeScene === 5) return "#FF0040";
      return "#00D4AA";
    };

    const getSpeed = () => {
      if (activeScene === 4) return 3;
      if (activeScene === 5) return 4;
      return 2;
    };

    const drawECG = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = getColor();
      const speed = getSpeed();
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      offsetRef.current += speed;

      // Draw ECG waveform
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      for (let x = 0; x < w; x++) {
        const t = (x + offsetRef.current) % 200;
        let y = mid;

        // ECG waveform pattern
        if (t > 60 && t < 65) {
          y = mid - 3; // P wave
        } else if (t > 80 && t < 83) {
          y = mid + 8; // Q wave
        } else if (t > 83 && t < 88) {
          y = mid - 25; // R wave (main spike)
        } else if (t > 88 && t < 92) {
          y = mid + 10; // S wave
        } else if (t > 110 && t < 120) {
          y = mid - 5; // T wave
        }

        // Add subtle noise for realism
        y += (Math.random() - 0.5) * 0.5;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Glow line at baseline
      ctx.beginPath();
      ctx.strokeStyle = color + "20";
      ctx.lineWidth = 0.5;
      ctx.shadowBlur = 0;
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      animRef.current = requestAnimationFrame(drawECG);
    };

    animRef.current = requestAnimationFrame(drawECG);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [activeScene]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed bottom-0 pointer-events-none"
      style={{ zIndex: 30, opacity: 0.6, left: 0, right: 0, width: "100vw" }}
    />
  );
}