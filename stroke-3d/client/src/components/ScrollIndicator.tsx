/*
 * ScrollIndicator.tsx
 * Design: "Surgical Theater" — Scroll down prompt at bottom
 */

import { motion } from "framer-motion";

interface ScrollIndicatorProps {
  visible: boolean;
}

export default function ScrollIndicator({ visible }: ScrollIndicatorProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ zIndex: 35 }}
    >
      <span
        className="text-[10px] tracking-[0.3em] uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          color: "rgba(0, 212, 170, 0.5)",
        }}
      >
        Scroll to explore
      </span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4L10 16M10 16L5 11M10 16L15 11"
            stroke="#00D4AA"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
