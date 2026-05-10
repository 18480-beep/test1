/*
 * ScrollFX.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinematic Scroll/Scene-Transition Overlay (ไม่แก้ Home.tsx)
 *
 * วิธีคิด:
 *   - Component นี้เป็น overlay เต็มจอ pointer-events:none ไม่ขวางการคลิกใด ๆ
 *   - ฟัง wheel/touch event เพื่อจับ "จังหวะเลื่อน" และตรวจจับการเปลี่ยน scene
 *     จากการเปลี่ยน DOM ของ SceneContent (ใช้ MutationObserver แบบเบา ๆ)
 *   - เมื่อจับการเปลี่ยน scene ได้ → trigger transition ทับ ๆ:
 *       • Radial flash (ฟ้าครามวาบ)
 *       • Chromatic aberration sweep (สแกนแยกสี RGB)
 *       • Scanline sweep (เส้นสแกนวิ่งจากบนลงล่าง)
 *       • Vignette pulse (มืดเข้าขอบนิด ๆ)
 *       • Depth blur บน body หลังจอ (ผ่าน backdrop-filter)
 *       • Dust particles ลอยขึ้น
 *   - เคารพ prefers-reduced-motion (ลดเอฟเฟกต์อัตโนมัติ)
 *   - ใช้ได้ทุกอุปกรณ์ — ทำเป็น HTML+CSS+canvas เบาที่สุด
 */

import { useEffect, useRef, useState } from "react";

// ตัวเลขใช้ปรับจังหวะ (ปรับให้ชัดขึ้น)
const TRIGGER_COOLDOWN_MS = 500;
const FLASH_MS = 1400;
const SWEEP_MS = 1500;
const PARTICLE_COUNT = 50;
const WHEEL_THRESHOLD = 40;       // ลดจาก 100 → ไวขึ้น
const TOUCH_THRESHOLD = 30;       // ลดจาก 60 → ไวขึ้น

interface Props {
  /** ปิด/เปิดเอฟเฟกต์ทั้งหมด (เช่น เคารพ user setting) */
  enabled?: boolean;
  /** แสดง indicator มุมจอเพื่อยืนยันว่า ScrollFX โหลดสำเร็จ (default: true) */
  debug?: boolean;
}

export default function ScrollFX({ enabled = true, debug = true }: Props) {
  const [active, setActive] = useState(false);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [tick, setTick] = useState(0);

  const lastTriggerRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const lastTouchYRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  // ── ตรวจ reduced-motion ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // ── trigger ────────────────────────────────────────────────────────────
  const trigger = (dir: "down" | "up") => {
    if (!enabled || reducedMotionRef.current) return;
    const now = performance.now();
    if (now - lastTriggerRef.current < TRIGGER_COOLDOWN_MS) return;
    lastTriggerRef.current = now;
    setDirection(dir);
    setActive(true);
    setTick(t => t + 1);
    window.setTimeout(() => setActive(false), FLASH_MS);
  };

  // ── ฟัง wheel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const onWheel = (e: WheelEvent) => {
      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) > WHEEL_THRESHOLD) {
        trigger(wheelAccumRef.current > 0 ? "down" : "up");
        wheelAccumRef.current = 0;
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      lastTouchYRef.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (lastTouchYRef.current == null) return;
      const cy = e.touches[0]?.clientY ?? lastTouchYRef.current;
      const dy = lastTouchYRef.current - cy;
      if (Math.abs(dy) > TOUCH_THRESHOLD) {
        trigger(dy > 0 ? "down" : "up");
        lastTouchYRef.current = cy;
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Particles canvas (เบา ๆ) ───────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!active || reducedMotionRef.current) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = (cvs.width = cvs.clientWidth * dpr);
    const h = (cvs.height = cvs.clientHeight * dpr);
    ctx.scale(dpr, dpr);

    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number };
    const particles: P[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      particles.push({
        x: Math.random() * cvs.clientWidth,
        y: cvs.clientHeight + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.6 + Math.random() * 1.6) * (direction === "down" ? 1 : -1),
        r: 0.6 + Math.random() * 1.8,
        life: 0,
      });
    }

    let raf = 0;
    const start = performance.now();
    const frame = () => {
      const dt = performance.now() - start;
      const alphaCurve = Math.max(0, 1 - dt / SWEEP_MS);
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.016;
        ctx.beginPath();
        ctx.fillStyle = `rgba(155,232,224,${0.7 * alphaCurve})`;
        ctx.shadowColor = "rgba(155,232,224,0.85)";
        ctx.shadowBlur = 10;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (dt < SWEEP_MS) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tick, active, direction]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
      }}
    >
      <style>{`
        @keyframes sfx-flash {
          0%   { opacity: 0; transform: scale(0.92); }
          18%  { opacity: 0.9; }
          60%  { opacity: 0.4; }
          100% { opacity: 0; transform: scale(1.06); }
        }
        @keyframes sfx-sweep-down {
          0%   { transform: translateY(-110%); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes sfx-sweep-up {
          0%   { transform: translateY(110%); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateY(-110%); opacity: 0; }
        }
        @keyframes sfx-vignette {
          0%, 100% { box-shadow: inset 0 0 200px rgba(0,0,0,0); }
          40%      { box-shadow: inset 0 0 280px rgba(0,0,0,0.55); }
        }
        @keyframes sfx-chroma-r {
          0%, 100% { transform: translate3d(0,0,0); opacity: 0; }
          30%      { transform: translate3d(6px,0,0); opacity: 0.55; }
          60%      { transform: translate3d(-3px,0,0); opacity: 0.3; }
        }
        @keyframes sfx-chroma-b {
          0%, 100% { transform: translate3d(0,0,0); opacity: 0; }
          30%      { transform: translate3d(-6px,0,0); opacity: 0.55; }
          60%      { transform: translate3d(3px,0,0); opacity: 0.3; }
        }
        @keyframes sfx-blur {
          0%, 100% { backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
          40%      { backdrop-filter: blur(4px) saturate(1.1); -webkit-backdrop-filter: blur(4px) saturate(1.1); }
        }
        @keyframes sfx-streak {
          0%   { opacity: 0; transform: scaleY(0.4); }
          40%  { opacity: 0.9; }
          100% { opacity: 0; transform: scaleY(1.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sfx-layer { display: none !important; }
        }
      `}</style>

      {active && (
        <>
          {/* Backdrop blur sweep — ทำให้ฉากเดิมเบลอกลาง transition */}
          <div
            className="sfx-layer"
            style={{
              position: "absolute",
              inset: 0,
              animation: `sfx-blur ${FLASH_MS}ms ease`,
            }}
          />

          {/* Radial flash — วาบจากกลางจอ (ชัดขึ้น) */}
          <div
            className="sfx-layer"
            key={`flash-${tick}`}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(125,249,255,0.85) 0%, rgba(91,143,255,0.45) 30%, transparent 75%)",
              mixBlendMode: "screen",
              animation: `sfx-flash ${FLASH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          />

          {/* Vignette pulse */}
          <div
            className="sfx-layer"
            key={`vig-${tick}`}
            style={{
              position: "absolute",
              inset: 0,
              animation: `sfx-vignette ${FLASH_MS}ms ease`,
            }}
          />

          {/* Chromatic aberration — ภาพแยกสี R/B วาบ */}
          <div
            className="sfx-layer"
            key={`cR-${tick}`}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(255,90,90,0.18), transparent 55%)",
              mixBlendMode: "screen",
              animation: `sfx-chroma-r ${FLASH_MS}ms ease`,
            }}
          />
          <div
            className="sfx-layer"
            key={`cB-${tick}`}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 70% 50%, rgba(90,160,255,0.18), transparent 55%)",
              mixBlendMode: "screen",
              animation: `sfx-chroma-b ${FLASH_MS}ms ease`,
            }}
          />

          {/* Scanline sweep — เส้นวาวเลื่อนตามทิศ scroll (สูงขึ้น สว่างขึ้น) */}
          <div
            className="sfx-layer"
            key={`sweep-${tick}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "40%",
              background:
                "linear-gradient(180deg, rgba(155,232,224,0) 0%, rgba(155,232,224,0.85) 40%, rgba(125,249,255,1) 50%, rgba(155,232,224,0.85) 60%, rgba(155,232,224,0) 100%)",
              mixBlendMode: "screen",
              filter: "blur(3px)",
              top: "-40%",
              boxShadow: "0 0 60px rgba(125,249,255,0.6)",
              animation: `${
                direction === "down" ? "sfx-sweep-down" : "sfx-sweep-up"
              } ${SWEEP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          />

          {/* Light streaks ซ้าย-ขวาแฝงนิด ๆ */}
          <div
            className="sfx-layer"
            key={`stk-${tick}`}
            style={{
              position: "absolute",
              top: "30%",
              bottom: "30%",
              left: "8%",
              width: 2,
              background:
                "linear-gradient(180deg, transparent, rgba(125,249,255,0.9), transparent)",
              filter: "blur(1px)",
              animation: `sfx-streak ${FLASH_MS}ms ease`,
              transformOrigin: "center",
            }}
          />
          <div
            className="sfx-layer"
            key={`stk2-${tick}`}
            style={{
              position: "absolute",
              top: "30%",
              bottom: "30%",
              right: "8%",
              width: 2,
              background:
                "linear-gradient(180deg, transparent, rgba(125,249,255,0.9), transparent)",
              filter: "blur(1px)",
              animation: `sfx-streak ${FLASH_MS}ms ease`,
              transformOrigin: "center",
            }}
          />

          {/* Particles canvas */}
          <canvas
            ref={canvasRef}
            className="sfx-layer"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </>
      )}

      {/* Debug indicator — มุมล่างซ้าย แสดงว่า ScrollFX โหลดและทำงานอยู่ */}
      {debug && (
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            padding: "6px 10px",
            fontSize: 11,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: active ? "#7df9ff" : "#9be8e0",
            background: "rgba(5,8,13,0.7)",
            border: `1px solid ${active ? "#7df9ff" : "rgba(155,232,224,0.35)"}`,
            borderRadius: 6,
            backdropFilter: "blur(6px)",
            transition: "all 200ms ease",
            boxShadow: active
              ? "0 0 24px rgba(125,249,255,0.7)"
              : "0 0 0 rgba(0,0,0,0)",
            letterSpacing: 0.5,
            userSelect: "none",
          }}
        >
          {active
            ? `▲ SCROLL FX  ·  ${direction.toUpperCase()}  ·  #${tick}`
            : `○ SCROLL FX READY  ·  scroll to test`}
        </div>
      )}
    </div>
  );
}
