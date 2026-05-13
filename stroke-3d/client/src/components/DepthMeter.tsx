/*
 * DepthMeter.tsx
 * Design: "Surgical Theater" — Vertical depth meter showing anatomical layers
 */

import { motion } from "framer-motion";
import { SCENES } from "@/lib/sceneData";

interface DepthMeterProps {
  activeScene: number;
}

const layers = [
  { label: "ส่วนแขน", depth: 0 },
  { label: "การออกเสียง", depth: 1 },
  { label: "BRAIN", depth: 2 },
  { label: "VESSELS", depth: 3 },
  { label: "PATHOLOGY", depth: 4 },
];

export default function DepthMeter({ activeScene }: DepthMeterProps) {
  const currentDepth = Math.min(activeScene, layers.length - 1);
  const accentColor = SCENES[activeScene]?.accentColor || "#00D4AA";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 1 }}
      className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block"
      style={{ zIndex: 35 }}
    >
      <div className="flex flex-col items-start gap-0">
        {/* Depth label */}
        <div
          className="text-[11px] tracking-[0.3em] uppercase mb-3"
          style={{
            fontFamily: "var(--font-mono)",
            color: "rgba(255, 255, 255, 0.98)",
          }}
        >
          
        </div>

        {/* Depth scale */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[3px] top-0 bottom-0 w-px"
            style={{ backgroundColor: "rgb(245, 247, 247)" }}
          />

          {/* Progress fill */}
          <motion.div
            className="absolute left-[3px] top-0 w-px origin-top"
            animate={{
              height: `${(currentDepth / (layers.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: accentColor, opacity: 0.6 }}
          />

          {/* Layer markers */}
          <div className="flex flex-col gap-6">
            {layers.map((layer, i) => (
              <div key={layer.label} className="flex items-center gap-3 relative">
                {/* Dot */}
                <motion.div
                  animate={{
                    scale: i <= currentDepth ? 1 : 0.5,
                    opacity: i <= currentDepth ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{
                    backgroundColor: i === currentDepth ? accentColor : i < currentDepth ? accentColor + "80" : "rgba(150,160,170,0.2)",
                    boxShadow: i === currentDepth ? `0 0 8px ${accentColor}60` : "none",
                  }}
                />

                {/* Label */}
                <motion.span
                  animate={{
                    opacity: i === currentDepth ? 0.8 : i < currentDepth ? 0.3 : 0.15,
                  }}
                  transition={{ duration: 0.4 }}
                  className="tracking-[0.2em] uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "calc(15px * var(--text-scale-tight, 1))",
                    color: i === currentDepth ? accentColor : "rgb(254, 255, 255)",
                  }}
                >
                  {layer.label}
                </motion.span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
