/*
 * SceneImage.tsx
 *
 * Scene 0  → วิดีโอบน + รูปล่าง
 * Scene 3  → วิดีโอฝั่งซ้าย (เฉพาะโซนดำ) + รูปเส้นเลือดฝั่งขวาอยู่ที่เดิม
 * Scene 1,2,4,5 → รูป Surgical Theater เดิม
 *
 * 🎛️ Scene 3 ปรับได้:
 *   S3_VIDEO_END_PCT = วิดีโอสิ้นสุดที่ % ไหน (จากซ้าย) เช่น 45 = 45%
 *   S3_FADE_PCT      = โซนเฟดกว้างแค่ไหน (%) เช่น 15 = 15% ของหน้าจอ
 */

// ============================================================
const DEFAULT_TOP_PERCENT = 50;
const DEFAULT_VIDEO_X     = 50;

// 🎛️ Scene 3
const S3_VIDEO_END_PCT = 25;   // วิดีโอสิ้นสุดที่ % นี้ (จากซ้าย)
const S3_FADE_PCT      = 35;   // โซนเฟดกว้าง % นี้
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SCENES } from "@/lib/sceneData";

interface SceneImageProps {
  activeScene: number;
}

export default function SceneImage({ activeScene }: SceneImageProps) {
  const scene = SCENES[activeScene];
  const [topPercent, setTopPercent] = useState(DEFAULT_TOP_PERCENT);
  const [videoX, setVideoX]         = useState(DEFAULT_VIDEO_X);
  const [showControls, setShowControls] = useState(false);

  if (!scene) return null;

  const bottomPercent = 100 - topPercent;

  // ── Scene 0 ──────────────────────────────────────────────
  if (activeScene === 0) {
    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key="scene-0-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div style={{ position: "relative", height: `${topPercent}%`, overflow: "hidden", flexShrink: 0 }}>
              <video autoPlay loop muted playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", objectPosition: `${videoX}% center` }}>
                <source src="/videos/bg-top.mp4" type="video/mp4" />
              </video>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(10,10,15,0.15) 0%, rgba(10,10,15,0.80) 100%)" }} />
            </div>
            <div style={{ position: "relative", height: `${bottomPercent}%`, overflow: "hidden", flexShrink: 0 }}>
              <img src="/videos/bg-bottom.jpg" alt="background"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block", opacity: 0.7 }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(10,10,15,0.80) 0%, rgba(10,10,15,0.2) 60%, rgba(10,10,15,0.4) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse at 60% 40%, rgba(0,229,192,0.05) 0%, transparent 65%)" }} />
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={() => setShowControls(v => !v)} style={{
          position: "fixed", bottom: 80, right: 16, zIndex: 50, pointerEvents: "auto",
          background: showControls ? "rgba(0,229,192,0.25)" : "rgba(0,229,192,0.1)",
          border: "1px solid rgba(0,229,192,0.4)", borderRadius: 8, padding: "6px 14px",
          color: "#00e5c0", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em",
          cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.2s",
        }}>🎛️ ปรับวิดีโอ</button>

        {showControls && (
          <div style={{
            position: "fixed", bottom: 120, right: 16, zIndex: 50, pointerEvents: "auto",
            background: "rgba(8,11,20,0.92)", border: "1px solid rgba(0,229,192,0.3)",
            borderRadius: 12, padding: "16px 20px", backdropFilter: "blur(16px)",
            display: "flex", flexDirection: "column", gap: 14, minWidth: 240,
          }}>
            <div style={{ color: "#00e5c0", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em" }}>🎛️ VIDEO CONTROLS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(180,200,230,0.8)", fontSize: 12 }}>ความสูงวิดีโอ</span>
                <span style={{ color: "#00e5c0", fontSize: 12, fontFamily: "monospace" }}>{topPercent}%</span>
              </div>
              <input type="range" min={5} max={100} value={topPercent}
                onChange={e => setTopPercent(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00e5c0" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(180,200,230,0.8)", fontSize: 12 }}>ตำแหน่งซ้าย-ขวา</span>
                <span style={{ color: "#00e5c0", fontSize: 12, fontFamily: "monospace" }}>{videoX}%</span>
              </div>
              <input type="range" min={0} max={100} value={videoX}
                onChange={e => setVideoX(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00e5c0" }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Scene 3: วิดีโอซ้าย + เส้นเลือดขวาอยู่ที่เดิม ────────
  if (activeScene === 3) {
    // วิดีโอเริ่มจาก 0% → S3_VIDEO_END_PCT%
    // เฟดจาก S3_VIDEO_END_PCT% → (S3_VIDEO_END_PCT + S3_FADE_PCT)%
    // เส้นเลือดเริ่มชัดหลัง fade zone
    const fadeStart = S3_VIDEO_END_PCT;
    const fadeEnd   = S3_VIDEO_END_PCT + S3_FADE_PCT;

    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key="scene-3-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* ── Layer 1: รูปเส้นเลือด — ขวา อยู่ที่เดิมเป๊ะ ── */}
            <div className="absolute right-0 top-0 w-full md:w-3/5 h-full">
              <img
                src={scene.image}
                alt={scene.title}
                className="w-full h-full object-cover object-center"
                style={{
                  // mask เดิมของ surgical theater + เพิ่ม fade ซ้ายให้วิดีโอโผล่
                  maskImage: `linear-gradient(to right,
                    transparent 0%,
                    transparent ${fadeStart}%,
                    black       ${fadeEnd}%,
                    black       100%
                  )`,
                  WebkitMaskImage: `linear-gradient(to right,
                    transparent 0%,
                    transparent ${fadeStart}%,
                    black       ${fadeEnd}%,
                    black       100%
                  )`,
                  opacity: 0.75,
                }}
              />
              <div className="absolute inset-0"
                style={{ background: `radial-gradient(ellipse at center, ${scene.accentColor}08 0%, transparent 70%)` }} />
            </div>

            {/* ── Layer 2: วิดีโอ — เฉพาะโซนซ้าย clip ด้วย mask ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                // clip วิดีโอให้อยู่แค่ฝั่งซ้าย + fade ออกทางขวา
                maskImage: `linear-gradient(to right,
                  black       0%,
                  black       ${fadeStart}%,
                  transparent ${fadeEnd}%,
                  transparent 100%
                )`,
                WebkitMaskImage: `linear-gradient(to right,
                  black       0%,
                  black       ${fadeStart}%,
                  transparent ${fadeEnd}%,
                  transparent 100%
                )`,
                overflow: "hidden",
              }}
            >
              <video
                autoPlay loop muted playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center" }}
              >
                <source src="/videos/bg.3.mp4" type="video/mp4" />
              </video>
            </div>

            {/* ── Layer 3: vignette บนล่าง ── */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, transparent 15%, transparent 85%, rgba(10,10,15,0.45) 100%)",
            }} />

            {/* ── Layer 4: accent glow ── */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `radial-gradient(ellipse at center, ${scene.accentColor}06 0%, transparent 70%)`,
            }} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Scene 1, 2, 4, 5: Surgical Theater เดิม ──────────────
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div className="absolute right-0 top-0 w-full md:w-3/5 h-full">
            <img
              src={scene.image}
              alt={scene.title}
              className="w-full h-full object-cover object-center"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
                opacity: 0.7,
              }}
            />
            <div className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at center, ${scene.accentColor}08 0%, transparent 70%)` }} />
          </div>
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse at 30% 50%, transparent 20%, rgba(10,10,15,0.6) 80%),
              linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, transparent 20%, transparent 80%, rgba(10,10,15,0.5) 100%)
            `,
          }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}