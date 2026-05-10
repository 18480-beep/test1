/*
 * ScrollTransitionFX.tsx
 * All 7 scroll-transition visual layers — fires on every scene change
 *
 * Layer stack (z-index 9990–9998, pointer-events: none throughout):
 *  1. Radial flash       — gradient screen-blend burst from center, 850ms
 *  2. Chromatic aberr.   — RGB triple-layer translate split, 850ms
 *  3. Scanline sweep     — bright line traveling in scroll direction, 950ms cubic-bezier
 *  4. Vignette pulse     — edge darkening "pull-deep" pulse, 850ms
 *  5. Backdrop blur      — outgoing scene blur + saturate, 850ms
 *  6. Light streaks      — horizontal light lines stretch then fade, 850ms
 *  7. Particles canvas   — 28 GPU-friendly dots drift in scroll direction, 950ms
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollTransitionFXProps {
  isTransitioning: boolean;
  scrollDirection: "down" | "up";
  activeScene: number;
}

/* ─── Particle canvas ─────────────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

function ParticleCanvas({
  active,
  direction,
}: {
  active: boolean;
  direction: "down" | "up";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const spawnParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const sign = direction === "down" ? 1 : -1;

    particlesRef.current = Array.from({ length: 28 }, () => {
      const x = Math.random() * w;
      const y = direction === "down" ? Math.random() * h * 0.3 : h - Math.random() * h * 0.3;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: sign * (1.5 + Math.random() * 2.5),
        alpha: 0.6 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      };
    });
  }, [direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    if (!active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animRef.current);
      particlesRef.current = [];
      return;
    }

    spawnParticles();

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const fade = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        ctx.save();
        ctx.globalAlpha = p.alpha * fade;
        ctx.fillStyle = `rgba(180, 220, 255, 1)`;
        ctx.shadowColor = "rgba(120, 200, 255, 0.8)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9991,
      }}
    />
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function ScrollTransitionFX({
  isTransitioning,
  scrollDirection,
  activeScene,
}: ScrollTransitionFXProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isTransitioning) {
      setShow(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShow(false), 950);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTransitioning, activeScene]);

  const sweepFrom = scrollDirection === "down" ? "-100%" : "100%";
  const sweepTo = scrollDirection === "down" ? "100%" : "-100%";

  return (
    <>
      {/* ── inline keyframes ───────────────────────────────────────────── */}
      <style>{`
        @keyframes sfx-radial {
          0%   { opacity: 0; transform: scale(0.3); }
          15%  { opacity: 0.55; }
          60%  { opacity: 0.2; transform: scale(1.8); }
          100% { opacity: 0; transform: scale(2.4); }
        }
        @keyframes sfx-vignette {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes sfx-blur-in {
          0%   { opacity: 0; backdrop-filter: blur(0px) saturate(1); }
          30%  { opacity: 1; backdrop-filter: blur(6px) saturate(1.4); }
          100% { opacity: 0; backdrop-filter: blur(0px) saturate(1); }
        }
        @keyframes sfx-streak-l {
          0%   { transform: scaleX(0) translateX(-50%); opacity: 0; }
          20%  { opacity: 0.7; }
          60%  { transform: scaleX(1) translateX(0%); opacity: 0.5; }
          100% { transform: scaleX(1.8) translateX(30%); opacity: 0; }
        }
        @keyframes sfx-streak-r {
          0%   { transform: scaleX(0) translateX(50%); opacity: 0; }
          20%  { opacity: 0.6; }
          60%  { transform: scaleX(1) translateX(0%); opacity: 0.4; }
          100% { transform: scaleX(1.8) translateX(-30%); opacity: 0; }
        }
        @keyframes sfx-chrom-r {
          0%   { transform: translate(0, 0); opacity: 0; }
          20%  { opacity: 0.5; }
          60%  { transform: translate(-4px, 1px); opacity: 0.35; }
          100% { transform: translate(0, 0); opacity: 0; }
        }
        @keyframes sfx-chrom-b {
          0%   { transform: translate(0, 0); opacity: 0; }
          20%  { opacity: 0.5; }
          60%  { transform: translate(4px, -1px); opacity: 0.35; }
          100% { transform: translate(0, 0); opacity: 0; }
        }

        .sfx-radial {
          animation: sfx-radial 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .sfx-vignette {
          animation: sfx-vignette 0.85s ease-out forwards;
        }
        .sfx-blur {
          animation: sfx-blur-in 0.85s ease-out forwards;
        }
        .sfx-streak-l {
          animation: sfx-streak-l 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .sfx-streak-r {
          animation: sfx-streak-r 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .sfx-chrom-r {
          animation: sfx-chrom-r 0.85s ease-out forwards;
        }
        .sfx-chrom-b {
          animation: sfx-chrom-b 0.85s ease-out forwards;
        }

        @keyframes sfx-sweep {
          0%   { transform: translateY(${sweepFrom}); opacity: 0; }
          10%  { opacity: 0.55; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(${sweepTo}); opacity: 0; }
        }
        .sfx-sweep {
          animation: sfx-sweep 0.95s cubic-bezier(0.37, 0, 0.63, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .sfx-radial, .sfx-vignette, .sfx-blur,
          .sfx-streak-l, .sfx-streak-r,
          .sfx-chrom-r, .sfx-chrom-b, .sfx-sweep {
            animation-duration: 0.001ms !important;
          }
        }
      `}</style>

      {/* ── 7. Particles canvas (always mounted, activates on show) ──── */}
      <ParticleCanvas active={show} direction={scrollDirection} />

      {show && (
        <>
          {/* ── 1. Radial flash ──────────────────────────────────────── */}
          <div
            className="sfx-radial"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9998,
              background:
                "radial-gradient(ellipse at center, rgba(180,220,255,0.22) 0%, rgba(100,160,255,0.12) 40%, transparent 70%)",
              mixBlendMode: "screen",
            }}
          />

          {/* ── 2. Chromatic aberration — red channel ─────────────── */}
          <div
            className="sfx-chrom-r"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9997,
              background: "rgba(255, 30, 30, 0.06)",
              mixBlendMode: "screen",
            }}
          />
          {/* ── 2. Chromatic aberration — blue channel ────────────── */}
          <div
            className="sfx-chrom-b"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9996,
              background: "rgba(30, 80, 255, 0.06)",
              mixBlendMode: "screen",
            }}
          />

          {/* ── 3. Scanline sweep ─────────────────────────────────── */}
          <div
            className="sfx-sweep"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              height: "2px",
              pointerEvents: "none",
              zIndex: 9995,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(160,220,255,0.7) 30%, rgba(200,240,255,0.95) 50%, rgba(160,220,255,0.7) 70%, transparent 100%)",
              boxShadow: "0 0 12px 4px rgba(160,220,255,0.35)",
              top: scrollDirection === "down" ? "0" : "auto",
              bottom: scrollDirection === "up" ? "0" : "auto",
            }}
          />

          {/* ── 4. Vignette pulse ─────────────────────────────────── */}
          <div
            className="sfx-vignette"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9994,
              background:
                "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,10,0.55) 100%)",
            }}
          />

          {/* ── 5. Backdrop blur ──────────────────────────────────── */}
          <div
            className="sfx-blur"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9993,
            }}
          />

          {/* ── 6. Light streaks ──────────────────────────────────── */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9992,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "18px",
              padding: "0",
            }}
          >
            {[
              { top: "38%", delay: "0ms",   width: "45%" },
              { top: "45%", delay: "40ms",  width: "60%" },
              { top: "50%", delay: "0ms",   width: "55%" },
              { top: "55%", delay: "60ms",  width: "40%" },
              { top: "62%", delay: "20ms",  width: "35%" },
            ].map((s, i) =>
              i % 2 === 0 ? (
                <div
                  key={i}
                  className="sfx-streak-l"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: s.top,
                    width: s.width,
                    height: "1px",
                    animationDelay: s.delay,
                    background:
                      "linear-gradient(90deg, transparent, rgba(150,210,255,0.55), rgba(200,240,255,0.8), transparent)",
                    transformOrigin: "left center",
                  }}
                />
              ) : (
                <div
                  key={i}
                  className="sfx-streak-r"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: s.top,
                    width: s.width,
                    height: "1px",
                    animationDelay: s.delay,
                    background:
                      "linear-gradient(270deg, transparent, rgba(150,210,255,0.45), rgba(200,240,255,0.7), transparent)",
                    transformOrigin: "right center",
                  }}
                />
              )
            )}
          </div>
        </>
      )}
    </>
  );
}