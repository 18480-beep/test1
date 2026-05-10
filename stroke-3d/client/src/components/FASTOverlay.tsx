/*
 * FASTOverlay.tsx
 * Design: "Surgical Theater" — F.A.S.T. recognition overlay for impact scene
 */

import { motion } from "framer-motion";

interface FASTOverlayProps {
  visible: boolean;
}

const fastItems = [
  {
    letter: "F",
    label: "Face Drooping",
    description: "One side of the face droops or is numb",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="1" fill="currentColor" />
        <circle cx="18" cy="10" r="1" fill="currentColor" />
        <path d="M9 16C9 16 11 14 14 16C17 18 19 16 19 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    letter: "A",
    label: "Arm Weakness",
    description: "One arm drifts downward when raised",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 8L14 4L20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 22L14 18L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    letter: "S",
    label: "Speech Difficulty",
    description: "Speech is slurred or hard to understand",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 14C4 8.48 8.48 4 14 4C19.52 4 24 8.48 24 14C24 19.52 19.52 24 14 24C12.4 24 10.88 23.6 9.56 22.88L4 24L5.12 18.44C4.4 17.12 4 15.6 4 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 13H18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <path d="M10 16H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    letter: "T",
    label: "Time to Call",
    description: "Call emergency services immediately",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 8V14L18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function FASTOverlay({ visible }: FASTOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed left-6 md:left-28 bottom-32 md:bottom-1/4 pointer-events-none"
      style={{ zIndex: 20 }}
    >
      <div className="flex flex-col gap-4">
        {fastItems.map((item, i) => (
          <motion.div
            key={item.letter}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
            className="flex items-center gap-4 px-4 py-3 rounded-lg border border-white/5"
            style={{
              backgroundColor: "rgba(10, 10, 15, 0.7)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Letter */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                fontFamily: "var(--font-display)",
                backgroundColor: "rgba(0, 212, 170, 0.1)",
                color: "#00D4AA",
                border: "1px solid rgba(0, 212, 170, 0.2)",
              }}
            >
              {item.letter}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#00D4AA]/60">{item.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#E0E8F0",
                  }}
                >
                  {item.label}
                </span>
              </div>
              <p
                className="text-xs mt-0.5"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "rgba(180, 190, 200, 0.6)",
                }}
              >
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
