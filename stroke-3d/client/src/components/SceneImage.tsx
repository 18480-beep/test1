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
const SCENE0_BACKGROUND_IMAGE = "/images/command-center-bg.jpg";
const SCENE0_BACKGROUND_POSITION = "center center";
const SCENE0_BACKGROUND_SCALE = 1;
const SCENE0_BACKGROUND_BRIGHTNESS = 1;
const SCENE0_BACKGROUND_CONTRAST = 1;
const SCENE0_BACKGROUND_SATURATION = 1;
const SCENE0_BACKGROUND_VEIL = 0;
const DEFAULT_TOP_PERCENT = 0;
const DEFAULT_VIDEO_X = 50;
const DEFAULT_VIDEO_Y = 50;
const SCENE0_VIDEO_OFFSET_X = "0px";
const SCENE0_VIDEO_OFFSET_Y = "0px";
const SCENE0_VIDEO_SCALE = 1;
const SCENE0_VIDEO_BRIGHTNESS = 1;
const SCENE0_VIDEO_CONTRAST = 1;
const SCENE0_VIDEO_SATURATION = 1;
const SCENE0_TOP_VEIL_START = 0;
const SCENE0_TOP_VEIL_END = 0;

// 🎛️ Scene 3
const S3_VIDEO_END_PCT = 25;   // วิดีโอสิ้นสุดที่ % นี้ (จากซ้าย)
const S3_FADE_PCT      = 35;   // โซนเฟดกว้าง % นี้
// Scene 2 speech background controls.
// X: positive = right, negative = left. Y: positive = down, negative = up.
const SPEECH_BG_VIDEO_SRC = "/videos/speech-training-bg.mp4";
const SPEECH_BG_SCALE = 1;
const SPEECH_BG_X = "0%";
const SPEECH_BG_Y = "0%";
const SPEECH_BG_BRIGHTNESS = 0.92;
const SPEECH_BG_SATURATION = 0.86;
const SPEECH_BG_CONTRAST = 0.94;
const SPEECH_BG_LEFT_VEIL = 0.42;
const SPEECH_BG_CENTER_VEIL = 0.18;
const SPEECH_BG_RIGHT_VEIL = 0.12;
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
  const [videoX, setVideoX] = useState(DEFAULT_VIDEO_X);
  const [videoY, setVideoY] = useState(DEFAULT_VIDEO_Y);
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
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  objectPosition: `${videoX}% ${videoY}%`,
                  transform: `translate(${SCENE0_VIDEO_OFFSET_X}, ${SCENE0_VIDEO_OFFSET_Y}) scale(${SCENE0_VIDEO_SCALE})`,
                  transformOrigin: "center center",
                  filter: `brightness(${SCENE0_VIDEO_BRIGHTNESS}) contrast(${SCENE0_VIDEO_CONTRAST}) saturate(${SCENE0_VIDEO_SATURATION})`,
                }}>
                <source src="/videos/bg-top.mp4" type="video/mp4" />
              </video>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: `linear-gradient(to bottom, rgba(10,10,15,${SCENE0_TOP_VEIL_START}) 0%, rgba(10,10,15,${SCENE0_TOP_VEIL_END}) 100%)` }} />
            </div>
            <div style={{ position: "relative", height: `${bottomPercent}%`, overflow: "hidden", flexShrink: 0 }}>
              <img src={SCENE0_BACKGROUND_IMAGE} alt="background"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: SCENE0_BACKGROUND_POSITION,
                  display: "block",
                  opacity: 1,
                  transform: `scale(${SCENE0_BACKGROUND_SCALE})`,
                  transformOrigin: "center center",
                  filter: `brightness(${SCENE0_BACKGROUND_BRIGHTNESS}) contrast(${SCENE0_BACKGROUND_CONTRAST}) saturate(${SCENE0_BACKGROUND_SATURATION})`,
                }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(10,10,15,0.80) 0%, rgba(10,10,15,0.2) 60%, rgba(10,10,15,0.4) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse at 60% 40%, rgba(0,229,192,0.05) 0%, transparent 65%)" }} />
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={() => setShowControls(v => !v)} style={{
          display: "none", position: "fixed", bottom: 80, right: 16, zIndex: 50, pointerEvents: "auto",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(180,200,230,0.8)", fontSize: 12 }}>VIDEO Y</span>
                <span style={{ color: "#00e5c0", fontSize: 12, fontFamily: "monospace" }}>{videoY}%</span>
              </div>
              <input type="range" min={0} max={100} value={videoY}
                onChange={e => setVideoY(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00e5c0" }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Scene 3: วิดีโอซ้าย + เส้นเลือดขวาอยู่ที่เดิม ────────
  // Scene 2: speech training page. The background video is supplied by the project owner.
  if (activeScene === 2) {
    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <style>{`
          @keyframes speechVideoDrift {
            0%, 100% { filter: saturate(${SPEECH_BG_SATURATION}) contrast(${SPEECH_BG_CONTRAST}) brightness(${SPEECH_BG_BRIGHTNESS}) hue-rotate(0deg); }
            50% { filter: saturate(${SPEECH_BG_SATURATION + 0.12}) contrast(${SPEECH_BG_CONTRAST + 0.04}) brightness(${SPEECH_BG_BRIGHTNESS + 0.04}) hue-rotate(4deg); }
          }
          @keyframes speechWaveTravel {
            0% { transform: translateX(-18%); opacity: 0.5; }
            50% { opacity: 1; }
            100% { transform: translateX(18%); opacity: 0.55; }
          }
          @keyframes speechScanPass {
            0% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
            20%, 70% { opacity: 0.65; }
            100% { transform: translateX(140%) skewX(-12deg); opacity: 1; }
          }
          @keyframes speechPulseRing {
            0%, 100% { transform: scale(0.96); opacity: 0.25; }
            50% { transform: scale(1.08); opacity: 0.62; }
          }
        `}</style>
        <AnimatePresence mode="wait">
          <motion.div
            key="scene-2-speech-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{
                overflow: "hidden",
                background: "linear-gradient(135deg, #070f14 0%, #040708 48%, #000000 100%)",
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: 1,
                  objectPosition: "center center",
                  transform: `translate(${SPEECH_BG_X}, ${SPEECH_BG_Y}) scale(${SPEECH_BG_SCALE})`,
                  transformOrigin: "center center",
                  animation: "speechVideoDrift 18s ease-in-out infinite",
                }}
              >
                <source src={SPEECH_BG_VIDEO_SRC} type="video/mp4" />
              </video>
            </div>

            <div
              className="absolute inset-0"
              style={{
                background: `
                  repeating-linear-gradient(90deg, rgba(0,229,192,0.025) 0 1px, transparent 1px 88px),
                  repeating-linear-gradient(0deg, rgba(255,62,214,0.02) 0 1px, transparent 1px 72px),
                  linear-gradient(90deg, rgba(5,8,20,${SPEECH_BG_LEFT_VEIL}) 0%, rgba(5,8,20,${SPEECH_BG_CENTER_VEIL}) 42%, rgba(5,8,20,0.04) 72%, rgba(5,8,20,${SPEECH_BG_RIGHT_VEIL}) 100%),
                  linear-gradient(180deg, rgb(0, 0, 0) 0%, transparent 42%, rgba(255,62,214,0.05) 100%)
                `,
              }}
            />

            <div
              className="absolute top-0 h-full"
              style={{ right: "1.5%", width: "53%" }}
            >
              <img
                src={scene.image}
                alt={scene.title}
                className="w-full h-full"
                style={{
                  objectFit: "contain",
                  objectPosition: "right center",
                  maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%, black 100%)",
                  opacity: 0.86,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${scene.accentColor}14 48%, transparent 100%)`,
                }}
              />
              <div
                className="absolute"
                style={{
                  left: "30%",
                  top: "23%",
                  width: "58%",
                  aspectRatio: "1",
                  border: `1px solid ${scene.accentColor}55`,
                  borderRadius: "50%",
                  boxShadow: `0 0 36px ${scene.accentColor}35, inset 0 0 42px ${scene.accentColor}18`,
                  animation: "speechPulseRing 3.4s ease-in-out infinite",
                }}
              />
            </div>

            <div
              className="absolute"
              style={{
                left: "52%",
                top: "53%",
                width: "48%",
                height: 120,
                transform: "translateY(-50%)",
                overflow: "hidden",
                opacity: 0.9,
              }}
            >
              <svg viewBox="0 0 900 120" preserveAspectRatio="none" style={{ width: "118%", height: "100%", animation: "speechWaveTravel 2.8s ease-in-out infinite alternate" }}>
                <defs>
                  <linearGradient id="speechWaveGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="rgba(0,229,192,0)" />
                    <stop offset="45%" stopColor="rgba(25, 4, 255, 0.97)" />
                    <stop offset="72%" stopColor="rgba(255,62,214,0.9)" />
                    <stop offset="100%" stopColor="rgba(255,62,214,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 60 C38 60 42 60 58 60 C67 23 75 98 85 60 C104 60 110 60 126 60 C136 34 146 88 156 60 C188 60 195 60 218 60 C228 18 238 104 248 60 C280 60 286 60 306 60 C316 39 326 81 336 60 C390 60 410 60 430 60 C440 28 450 92 460 60 C488 60 498 60 526 60 C536 16 546 108 556 60 C610 60 624 60 646 60 C656 38 666 82 676 60 C730 60 744 60 766 60 C776 24 786 98 796 60 C842 60 862 60 900 60"
                  fill="none"
                  stroke="url(#speechWaveGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path d="M0 60 H900" stroke="rgba(0,229,192,0.22)" strokeWidth="1" />
              </svg>
            </div>

            <div
              className="absolute"
              style={{
                left: "58%",
                top: "18%",
                width: "34%",
                height: "70%",
                background: "linear-gradient(90deg, transparent, rgba(0,229,192,0.12), transparent)",
                mixBlendMode: "screen",
                animation: "speechScanPass 5.5s ease-in-out infinite",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(5,8,20,0.12) 0%, transparent 18%, transparent 78%, rgba(5,8,20,0.16) 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

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
