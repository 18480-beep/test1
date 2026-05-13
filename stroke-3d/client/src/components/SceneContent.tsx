/*
 * SceneContent.tsx
 * ถ้า scene มี textBoxes → render กล่องตาม data ใน sceneData.ts
 * ถ้าไม่มี → layout เดิม
 */

import { motion, AnimatePresence } from "framer-motion";
import { SCENES, type SceneData } from "@/lib/sceneData";
import { useTheme } from "@/contexts/ThemeContext";
import SelectableText from "@/components/SelectableText";

// Scene text size controls for apps/browsers that render 100% zoom too large.
// Set these below 1 (for example 0.82) to shrink only these text groups.
const SCENE_DEFAULT_META_SCALE = 0.8;
const SCENE_DEFAULT_SUBTITLE_SCALE = 1;
const SCENE_DEFAULT_TITLE_SCALE = 1;
const SCENE_DEFAULT_DESCRIPTION_SCALE = 1;
const SCENE_DEFAULT_FACT_SCALE = 1;
const SCENE_TEXTBOX_TITLE_SCALE = 1;
const SCENE_TEXTBOX_BODY_SCALE = 1;

interface SceneContentProps {
  activeScene: number;
  scrollProgress: number;
}

// ─── TextBoxes layout ─────────────────────────────────────────────
function TextBoxesLayout({ scene }: { scene: SceneData }) {
  if (!scene.textBoxes?.length) return null;
  const isSpeechScene = scene.id === 2;

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
            left: box.x,
            top: box.y,
            width: box.w ?? 320,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {isSpeechScene && i > 0 && (
            <div
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                width: 48,
                height: 48,
                transform: "translateY(-50%)",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(0,229,192,0.48)",
                background: "linear-gradient(145deg,rgba(2,16,30,0.88),rgba(24,7,34,0.78))",
                color: scene.accentColor,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 18,
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
              ? (i === 0 ? "16px 22px" : "16px 20px 17px 86px")
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
                fontSize: (isSpeechScene && i === 0 ? (box.fontSize ?? 13) : (box.fontSize ?? 13) + 2) * SCENE_TEXTBOX_TITLE_SCALE,
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
              fontSize: (isSpeechScene && i === 0 ? 20 : box.fontSize ?? 13) * SCENE_TEXTBOX_BODY_SCALE,
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

// ─── Default layout (unchanged) ──────────────────────────────────
function DefaultLayout({ scene }: { scene: SceneData }) {
  const { theme } = useTheme();
  return (
    <div className="fixed left-0 top-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      <motion.div
        key={scene.id}
        initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: 40, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-1/2 -translate-y-1/2 max-w-sm md:max-w-md lg:max-w-xl"
        style={{ left: "250px" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: scene.accentColor }} />
          <span className="tracking-[0.3em] uppercase" style={{ fontFamily: "var(--font-mono)", color: scene.accentColor, fontSize: `${30 * SCENE_DEFAULT_META_SCALE}px` }}>
            <SelectableText>Scene {scene.id + 1} / {SCENES.length}</SelectableText>
          </span>
        </div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontFamily: "var(--font-mono)", color: scene.accentColor, opacity: 0.8, fontSize: `${30 * SCENE_DEFAULT_SUBTITLE_SCALE}px`, marginBottom: "0.5rem" }}>
          <SelectableText>{scene.subtitle}</SelectableText>
        </motion.p>

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="scene-title font-bold mb-4 leading-tight"
          style={{ fontFamily: "var(--font-display)", color: theme === "light" ? "#1A202C" : "#F0F0F0", textShadow: `0 0 30px ${scene.accentColor}33`, fontSize: `clamp(${2 * SCENE_DEFAULT_TITLE_SCALE}rem, ${4.5 * SCENE_DEFAULT_TITLE_SCALE}vw, ${3.5 * SCENE_DEFAULT_TITLE_SCALE}rem)` }}>
          <SelectableText>{scene.title}</SelectableText>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="scene-description leading-relaxed mb-6"
          style={{ fontFamily: "var(--font-body)", color: theme === "light" ? "#4A5568" : "rgba(200, 210, 220, 0.8)", fontSize: `${40 * SCENE_DEFAULT_DESCRIPTION_SCALE}px` }}>
          <SelectableText>{scene.description}</SelectableText>
        </motion.p>

        {scene.facts && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-2">
            {scene.facts.map((fact, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: scene.accentColor, opacity: 0.6 }} />
                <span className="scene-fact" style={{ fontFamily: "var(--font-mono)", color: theme === "light" ? "#718096" : "rgba(180, 190, 200, 0.7)", fontSize: `${20 * SCENE_DEFAULT_FACT_SCALE}px` }}>
                  <SelectableText>{fact}</SelectableText>
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }}
          className="mt-6 h-px origin-left"
          style={{ background: `linear-gradient(to right, ${scene.accentColor}60, transparent)`, maxWidth: "200px" }} />
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
