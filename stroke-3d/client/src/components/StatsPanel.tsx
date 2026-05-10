/*
 * StatsPanel.tsx — v5 (Readable Edition)
 * ✅ ตัวหนังสือใหญ่ขึ้น อ่านออกชัดเจน
 * ✅ ปรับขนาดได้ผ่าน --text-scale (Settings → Text Size)
 * ✅ padding / spacing넉넉ขึ้น
 */

import { motion, AnimatePresence } from "framer-motion";

interface StatsPanelProps {
  activeScene: number;
}

const sceneStats: Record<number, { label: string; value: string; unit: string }[]> = {
  2: [
    { label: "Neurons", value: "86B", unit: "cells" },
    { label: "Weight", value: "1.4", unit: "kg" },
    { label: "Blood Supply", value: "20", unit: "%" },
  ],
  3: [
    { label: "Vessel Length", value: "400", unit: "miles" },
    { label: "Blood Flow", value: "750", unit: "mL/min" },
    { label: "O₂ Usage", value: "20", unit: "%" },
  ],
  4: [
    { label: "Prevalence", value: "87", unit: "%" },
    { label: "Neurons Lost", value: "1.9M", unit: "/min" },
    { label: "Treatment Window", value: "4.5", unit: "hrs" },
  ],
  5: [
    { label: "Prevalence", value: "13", unit: "%" },
    { label: "Mortality", value: "40", unit: "%" },
    { label: "Cause #1", value: "HBP", unit: "" },
  ],
};

export default function StatsPanel({ activeScene }: StatsPanelProps) {
  const stats = sceneStats[activeScene];
  if (!stats) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeScene}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="fixed right-4 md:right-10 top-20 md:top-24 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div
          className="stats-panel-bg rounded-xl border"
          style={{
            backgroundColor: "rgba(10, 10, 15, 0.75)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            padding: "calc(14px * var(--text-scale, 1)) calc(18px * var(--text-scale, 1))",
            minWidth: "calc(160px * var(--text-scale, 1))",
          }}
        >
          {/* Header label */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "rgba(0, 212, 170, 0.7)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "calc(10px * var(--text-scale, 1))",
              fontSize: "calc(11px * var(--text-scale, 1))",
              fontWeight: 600,
            }}
          >
            Key Statistics
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "calc(20px * var(--text-scale, 1))",
            }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                style={{ textAlign: "center", minWidth: "calc(52px * var(--text-scale, 1))" }}
              >
                {/* Value + unit */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: "calc(3px * var(--text-scale, 1))",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "#E8F2FF",
                      fontWeight: 700,
                      lineHeight: 1,
                      fontSize: "calc(26px * var(--text-scale, 1))",
                    }}
                  >
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "rgba(160, 180, 200, 0.7)",
                        fontSize: "calc(12px * var(--text-scale, 1))",
                      }}
                    >
                      {stat.unit}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "rgba(160, 180, 200, 0.6)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "calc(5px * var(--text-scale, 1))",
                    fontSize: "calc(11px * var(--text-scale, 1))",
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
