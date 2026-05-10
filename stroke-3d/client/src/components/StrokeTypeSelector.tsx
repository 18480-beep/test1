/*
 * StrokeTypeSelector.tsx
 * Design: "Surgical Theater" — Toggle between ischemic and hemorrhagic stroke
 */

import { motion } from "framer-motion";

interface StrokeTypeSelectorProps {
  activeScene: number;
  onSelectType: (scene: number) => void;
}

export default function StrokeTypeSelector({ activeScene, onSelectType }: StrokeTypeSelectorProps) {
  if (activeScene !== 4 && activeScene !== 5) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto"
      style={{ zIndex: 35 }}
    >
      <button
        onClick={() => onSelectType(4)}
        className="group relative px-5 py-2.5 rounded-lg border transition-all duration-500"
        style={{
          borderColor: activeScene === 4 ? "#FF6B00" : "rgba(255,107,0,0.2)",
          backgroundColor: activeScene === 4 ? "rgba(255,107,0,0.1)" : "rgba(10,10,15,0.8)",
          boxShadow: activeScene === 4 ? "0 0 20px rgba(255,107,0,0.2)" : "none",
        }}
      >
        <span
          className="text-xs tracking-wider uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: activeScene === 4 ? "#FF6B00" : "rgba(255,107,0,0.5)",
          }}
        >
          Ischemic Stroke
        </span>
      </button>

      <div className="w-px h-6 bg-white/10" />

      <button
        onClick={() => onSelectType(5)}
        className="group relative px-5 py-2.5 rounded-lg border transition-all duration-500"
        style={{
          borderColor: activeScene === 5 ? "#FF0040" : "rgba(255,0,64,0.2)",
          backgroundColor: activeScene === 5 ? "rgba(255,0,64,0.1)" : "rgba(10,10,15,0.8)",
          boxShadow: activeScene === 5 ? "0 0 20px rgba(255,0,64,0.2)" : "none",
        }}
      >
        <span
          className="text-xs tracking-wider uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: activeScene === 5 ? "#FF0040" : "rgba(255,0,64,0.5)",
          }}
        >
          Hemorrhagic Stroke
        </span>
      </button>
    </motion.div>
  );
}
