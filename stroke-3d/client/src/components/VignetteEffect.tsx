/*
 * VignetteEffect.tsx
 * Design: "Surgical Theater" — Screen effects for stroke scenes
 *
 * Two modes:
 *  1. Persistent tinted vignette — scene 4 (ischemic) and 5 (hemorrhagic) only
 *  2. Transition vignette pulse  — fires on EVERY scene change via isTransitioning prop
 */

import { motion, AnimatePresence } from "framer-motion";

interface VignetteEffectProps {
  activeScene: number;
  isTransitioning?: boolean;
}

export default function VignetteEffect({
  activeScene,
  isTransitioning = false,
}: VignetteEffectProps) {
  const isStrokeScene = activeScene === 4 || activeScene === 5;
  const isHemorrhagic = activeScene === 5;

  return (
    <>
      {/* ── Persistent tinted vignette for stroke scenes ── */}
      <AnimatePresence>
        {isStrokeScene && (
          <motion.div
            key="stroke-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: isHemorrhagic
                  ? "radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.18) 100%)"
                  : "radial-gradient(ellipse at center, transparent 40%, rgba(255, 107, 0, 0.10) 100%)",
              }}
            />
            <motion.div
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: isHemorrhagic ? 0.8 : 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0"
              style={{
                boxShadow: isHemorrhagic
                  ? "inset 0 0 100px rgba(255, 0, 64, 0.18)"
                  : "inset 0 0 80px rgba(255, 107, 0, 0.12)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}