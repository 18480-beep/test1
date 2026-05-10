/*
 * AudioToggle.tsx
 * Design: "Surgical Theater" — Minimal audio toggle button
 */

import { motion } from "framer-motion";

interface AudioToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function AudioToggle({ enabled, onToggle }: AudioToggleProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      onClick={onToggle}
      className="fixed bottom-6 right-6 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 hover:bg-white/5"
      style={{
        zIndex: 45,
        borderColor: enabled ? "rgba(0, 212, 170, 0.4)" : "rgba(150, 160, 170, 0.2)",
        backgroundColor: "rgba(10, 10, 15, 0.8)",
      }}
      title={enabled ? "Mute audio" : "Enable audio"}
    >
      {enabled ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6V10H5L9 13V3L5 6H2Z" stroke="#00D4AA" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M11.5 5.5C12.3 6.3 12.8 7.4 12.8 8.5C12.8 9.6 12.3 10.7 11.5 11.5" stroke="#00D4AA" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M13 4C14.2 5.2 15 6.8 15 8.5C15 10.2 14.2 11.8 13 13" stroke="#00D4AA" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6V10H5L9 13V3L5 6H2Z" stroke="rgba(150,160,170,0.5)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M12 6L15 9" stroke="rgba(150,160,170,0.5)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M15 6L12 9" stroke="rgba(150,160,170,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </motion.button>
  );
}
