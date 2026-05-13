/*
 * SceneContent.tsx — RESPONSIVE FIX
 *
 * สิ่งที่แก้:
 * 1. left:"250px" hardcode → responsive clamp / padding
 * 2. fontSize fixed px ทุกจุด → clamp() ทั้งหมด
 * 3. DefaultLayout ใช้ CSS class + responsive padding แทน absolute left
 * 4. TextBoxesLayout scale บน mobile ไม่ให้ตัวหนังสือใหญ่/เล็กเกิน
 * 5. max-width + overflow-hidden ป้องกัน content ล้นจอแคบ
 */

import { motion, AnimatePresence } from "framer-motion";
import { SCENES, type SceneData } from "@/lib/sceneData";
import { useTheme } from "@/contexts/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import SelectableText from "@/components/SelectableText";
import { getSceneTextBoxTune, layoutTuning } from "@/lib/layoutTuning";
import { clampNumber, getViewportStage } from "@/lib/viewportStage";

// ─── Scale constants (ปรับได้ทีเดียว ใช้ทั่วไฟล์) ────────────────
const SCENE_DEFAULT_META_SCALE        = 0.8;
const SCENE_DEFAULT_SUBTITLE_SCALE    = 1;
const SCENE_DEFAULT_TITLE_SCALE       = 1;
const SCENE_DEFAULT_DESCRIPTION_SCALE = 1;
const SCENE_DEFAULT_FACT_SCALE        = 1;
const SCENE_TEXTBOX_TITLE_SCALE       = 1;
const SCENE_TEXTBOX_BODY_SCALE        = 1;

// Base canvas ที่ใช้ออกแบบ sceneData.ts (1920×1080)
interface SceneContentProps {
  activeScene: number;
  scrollProgress: number;
}

// ─── TextBoxes layout ─────────────────────────────────────────────
function TextBoxesLayout({ scene }: { scene: SceneData }) {
  const { width, height } = useBreakpoint();
  const { textScale } = useTheme();

  if (!scene.textBoxes?.length) return null;
  const isSpeechScene = scene.id === 2;
  const isMobile = width < 640;
  const tune = getSceneTextBoxTune(scene.id, isMobile);
  const fontScale = tune.textScale * textScale;

  const stage = getViewportStage(width, height);
  // บน mobile/tablet จำกัด scale ไม่ให้เล็กจนอ่านไม่ออก
  const s = clampNumber(stage.scale * fontScale, 0.32, 1.55);
  const boxS = clampNumber(stage.scale * tune.boxScale, 0.32, 1.2);

  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "80px 16px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {isSpeechScene && (
          <style>{`
            @keyframes speechCardBreathe {
              0%, 100% { box-shadow: 0 14px 34px rgba(0,0,0,0.44), 0 0 20px rgba(0,229,192,0.16), inset 0 0 18px rgba(0,229,192,0.05); }
              50% { box-shadow: 0 18px 44px rgba(0,0,0,0.5), 0 0 28px rgba(255,62,214,0.2), inset 0 0 24px rgba(0,229,192,0.08); }
            }
            @keyframes speechIconPulse {
              0%, 100% { transform: scale(1); opacity: 0.72; }
              50% { transform: scale(1.08); opacity: 1; }
            }
          `}</style>
        )}
        {scene.textBoxes.map((box, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <div style={{
              background: isSpeechScene
                ? "linear-gradient(135deg, rgba(4,14,30,0.92), rgba(11,10,34,0.88) 52%, rgba(28,8,40,0.84))"
                : "rgba(4,12,24,0.82)",
              border: isSpeechScene
                ? "1px solid rgba(0,229,192,0.42)"
                : `1px solid ${scene.accentColor}40`,
              borderRadius: 8,
              backdropFilter: "blur(10px)",
              padding: "12px 14px",
              animation: isSpeechScene ? `speechCardBreathe ${3.8 + i * 0.25}s ease-in-out infinite` : undefined,
            }}>
              {box.title && (
                <div style={{
                  color: scene.accentColor,
                  fontSize: `clamp(${11 * fontScale}px, ${3.2 * fontScale}vw, ${14 * fontScale}px)`,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  marginBottom: 6,
                  letterSpacing: "0.02em",
                }}>
                  <SelectableText>{box.title}</SelectableText>
                </div>
              )}
              <div style={{
                color: "rgba(195,215,235,0.88)",
                fontSize: `clamp(${13 * fontScale}px, ${3.8 * fontScale}vw, ${16 * fontScale}px)`,
                lineHeight: 1.6,
                whiteSpace: "pre-line",
                fontFamily: "var(--font-body, system-ui, sans-serif)",
              }}>
                <SelectableText>{box.body}</SelectableText>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // ─── Desktop / Tablet: absolute positioned (เหมือนเดิม แต่ scale ดีขึ้น) ─
  return (
    <>
      {isSpeechScene && (
        <style>{`
          @keyframes speechCardBreathe {
            0%, 100% { box-shadow: 0 14px 34px rgba(0,0,0,0.44), 0 0 20px rgba(0,229,192,0.16), inset 0 0 18px rgba(0,229,192,0.05); }
            50% { box-shadow: 0 18px 44px rgba(0,0,0,0.5), 0 0 28px rgba(255,62,214,0.2), inset 0 0 24px rgba(0,229,192,0.08); }
          }
          @keyframes speechCardSweep {
            0% { transform: translateX(-120%); opacity: 0; }
            30%, 60% { opacity: 0.55; }
            100% { transform: translateX(140%); opacity: 0; }
          }
          @keyframes speechIconPulse {
            0%, 100% { transform: scale(1); opacity: 0.72; }
            50% { transform: scale(1.08); opacity: 1; }
          }
        `}</style>
      )}
      {scene.textBoxes.map((box, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: i * 0.07 }}
          style={{
            position: "fixed",
            left: Math.round(stage.x(box.x) + tune.shiftX),
            top: Math.round(stage.y(box.y) + tune.shiftY),
            width: Math.round((box.w ?? 320) * boxS),
            maxWidth: "calc(100vw - 32px)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {isSpeechScene && i > 0 && (
            <div
              style={{
                position: "absolute",
                left: Math.round(18 * s),
                top: "20%",
                width: Math.round(48 * s),
                height: Math.round(48 * s),
                transform: "translateY(-50%)",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(0,229,192,0.48)",
                background: "linear-gradient(145deg,rgba(2,16,30,0.88),rgba(24,7,34,0.78))",
                color: scene.accentColor,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: Math.round(18 * s),
                fontWeight: 800,
                boxShadow: "0 0 18px rgba(0,229,192,0.22), 0 0 18px rgba(255,62,214,0.14), inset 0 0 14px rgba(0,229,192,0.06)",
                animation: "speechIconPulse 2.8s ease-in-out infinite",
                zIndex: 2,
              }}
            >
              {i === 4 ? "★" : i}
            </div>
          )}
          <div style={{
            position: "relative",
            overflow: "hidden",
            background: isSpeechScene
              ? "linear-gradient(135deg, rgba(4,14,30,0.9), rgba(11,10,34,0.86) 52%, rgba(28,8,40,0.82))"
              : "rgba(4,12,24,0.78)",
            border: isSpeechScene ? "1px solid rgba(0,229,192,0.42)" : `1px solid ${scene.accentColor}40`,
            borderRadius: isSpeechScene ? 8 : 10,
            backdropFilter: "blur(10px)",
            padding: isSpeechScene
              ? (i === 0 ? "16px 22px" : `${Math.round(16 * s)}px ${Math.round(20 * s)}px ${Math.round(17 * s)}px ${Math.round(86 * s)}px`)
              : "10px 14px 12px",
            boxShadow: isSpeechScene
              ? "0 14px 34px rgba(0,0,0,0.46), 0 0 0 1px rgba(255,62,214,0.16), 0 0 24px rgba(0,229,192,0.12)"
              : `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${scene.accentColor}15`,
            animation: isSpeechScene ? `speechCardBreathe ${3.8 + i * 0.25}s ease-in-out infinite` : undefined,
          }}>
            {isSpeechScene && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  padding: 1,
                  background: "linear-gradient(135deg,rgba(0,229,192,0.72),rgba(104,246,255,0.22) 42%,rgba(255,62,214,0.56))",
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                  opacity: 0.9,
                }}
              />
            )}
            {isSpeechScene && (
              <span
                style={{
                  position: "absolute",
                  inset: "0 auto 0 0",
                  width: "38%",
                  background: "linear-gradient(90deg, transparent, rgba(0,229,192,0.16), rgba(255,62,214,0.12), transparent)",
                  animation: `speechCardSweep ${4.4 + i * 0.35}s ease-in-out infinite`,
                }}
              />
            )}
            {box.title && (
              <div style={{
                color: scene.accentColor,
                fontSize: `clamp(11px, ${(isSpeechScene && i === 0 ? (box.fontSize ?? 13) : (box.fontSize ?? 13) + 2) * s * SCENE_TEXTBOX_TITLE_SCALE * 0.8}px, ${(isSpeechScene && i === 0 ? (box.fontSize ?? 13) : (box.fontSize ?? 13) + 2) * SCENE_TEXTBOX_TITLE_SCALE}px)`,
                fontWeight: isSpeechScene ? 800 : 700,
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: isSpeechScene ? 10 : 6,
                letterSpacing: "0.02em",
                position: "relative",
                zIndex: 1,
              }}>
                <SelectableText>{box.title}</SelectableText>
              </div>
            )}
            <div style={{
              color: "rgba(195,215,235,0.85)",
              fontSize: `clamp(11px, ${(isSpeechScene && i === 0 ? 20 : box.fontSize ?? 13) * s * SCENE_TEXTBOX_BODY_SCALE}px, ${(isSpeechScene && i === 0 ? 20 : box.fontSize ?? 13) * SCENE_TEXTBOX_BODY_SCALE}px)`,
              lineHeight: isSpeechScene ? 1.58 : 1.7,
              whiteSpace: "pre-line",
              fontFamily: "var(--font-body, system-ui, sans-serif)",
              position: "relative",
              zIndex: 1,
            }}>
              <SelectableText>{box.body}</SelectableText>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// ─── Default layout ──────────────────────────────────────────────
function DefaultLayout({ scene }: { scene: SceneData }) {
  const { theme, textScale } = useTheme();
  const tune = layoutTuning.defaultSceneText;
  const fontScale = tune.textScale * textScale;

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      <motion.div
        key={scene.id}
        initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: 40, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          top: "30%",
          transform: `translate(${tune.shiftX}px, calc(-50% + ${tune.shiftY}px))`,
          // ✅ FIX: ไม่ใช้ left:"250px" แบบ hardcode
          // mobile: padding ซ้าย 16px, tablet: 5vw, desktop: 200px หรือตาม nav width
          left: "clamp(100px, 15vw, 300px)",
          // ✅ FIX: จำกัดความกว้างตามขนาดจอ
          width: "min(480px, calc(100vw - clamp(1rem, 5vw, 300px) - 1rem))",
          maxWidth: "90vw",
        }}
      >
        {/* Meta line */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: scene.accentColor }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: scene.accentColor,
              // ✅ FIX: clamp แทน fixed 30px
              fontSize: `clamp(10px, ${1.2 * SCENE_DEFAULT_META_SCALE * fontScale}vw, ${24 * SCENE_DEFAULT_META_SCALE * fontScale}px)`,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            <SelectableText>Scene {scene.id + 1} / {SCENES.length}</SelectableText>
          </span>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "var(--font-mono)",
            color: scene.accentColor,
            opacity: 0.8,
            // ✅ FIX: clamp แทน fixed 30px
            fontSize: `clamp(11px, ${1.4 * SCENE_DEFAULT_SUBTITLE_SCALE * fontScale}vw, ${22 * SCENE_DEFAULT_SUBTITLE_SCALE * fontScale}px)`,
            marginBottom: "0.5rem",
          }}
        >
          <SelectableText>{scene.subtitle}</SelectableText>
        </motion.p>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-bold mb-4 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: theme === "light" ? "#1A202C" : "#F0F0F0",
            textShadow: `0 0 30px ${scene.accentColor}33`,
            // ✅ เดิมใช้ clamp อยู่แล้ว — เพิ่ม scale factor เข้าไปตามปกติ
            fontSize: `clamp(${1.5 * SCENE_DEFAULT_TITLE_SCALE * fontScale}rem, ${3.5 * SCENE_DEFAULT_TITLE_SCALE * fontScale}vw, ${3 * SCENE_DEFAULT_TITLE_SCALE * fontScale}rem)`,
          }}
        >
          <SelectableText>{scene.title}</SelectableText>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="leading-relaxed mb-6"
          style={{
            fontFamily: "var(--font-body)",
            color: theme === "light" ? "#4A5568" : "rgba(200, 210, 220, 0.8)",
            // ✅ FIX: 40px → clamp ไม่ใหญ่จนเกินไปบน mobile
            fontSize: `clamp(14px, ${1.6 * SCENE_DEFAULT_DESCRIPTION_SCALE * fontScale}vw, ${20 * SCENE_DEFAULT_DESCRIPTION_SCALE * fontScale}px)`,
          }}
        >
          <SelectableText>{scene.description}</SelectableText>
        </motion.p>

        {/* Facts */}
        {scene.facts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-2"
          >
            {scene.facts.map((fact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-start gap-2"
              >
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: scene.accentColor, opacity: 0.6 }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: theme === "light" ? "#718096" : "rgba(180, 190, 200, 0.7)",
                    // ✅ FIX: 20px → clamp
                    fontSize: `clamp(11px, ${0.95 * SCENE_DEFAULT_FACT_SCALE * fontScale}vw, ${15 * SCENE_DEFAULT_FACT_SCALE * fontScale}px)`,
                  }}
                >
                  <SelectableText>{fact}</SelectableText>
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-6 h-px origin-left"
          style={{
            background: `linear-gradient(to right, ${scene.accentColor}60, transparent)`,
            maxWidth: "200px",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────
export default function SceneContent({ activeScene }: SceneContentProps) {
  const scene = SCENES[activeScene];
  if (!scene) return null;

  return (
    <AnimatePresence mode="wait">
      {scene.textBoxes?.length ? (
        <motion.div
          key={`textboxes-${scene.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}
        >
          <TextBoxesLayout scene={scene} />
        </motion.div>
      ) : (
        <DefaultLayout key={`default-${scene.id}`} scene={scene} />
      )}
    </AnimatePresence>
  );
}
