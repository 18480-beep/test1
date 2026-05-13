import { AudioWaveform, BarChart3, Brain, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeechSceneOverlayProps {
  activeScene: number;
}

const features = [
  {
    title: "โฟกัสการออกเสียง",
    body: "เพิ่มความชัดเจนในการเปล่งเสียง",
    Icon: Target,
  },
  {
    title: "จังหวะและน้ำเสียง",
    body: "ควบคุมจังหวะให้เป็นธรรมชาติ",
    Icon: AudioWaveform,
  },
  {
    title: "กระตุ้นสมอง",
    body: "เชื่อมโยงการฟัง พูด และอ่าน",
    Icon: Brain,
  },
  {
    title: "พัฒนาอย่างต่อเนื่อง",
    body: "วัดผลและเห็นความก้าวหน้า",
    Icon: BarChart3,
  },
];

export default function SpeechSceneOverlay({ activeScene }: SpeechSceneOverlayProps) {
  if (activeScene !== 2) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="speech-scene-overlay"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed hidden xl:flex flex-col gap-6 pointer-events-none"
        style={{ left: "40%", top: "30%", zIndex: 18, width: 370 }}
      >
        <style>{`
          @keyframes speechFeaturePulse {
            0%, 100% { transform: translateY(0); opacity: 0.86; }
            50% { transform: translateY(-5px); opacity: 2; }
          }
          @keyframes speechFeatureRing {
            0%, 100% { box-shadow: 0 0 18px rgba(0,229,192,0.18), inset 0 0 18px rgba(0,229,192,0.06); }
            50% { box-shadow: 0 0 28px rgba(255,62,214,0.2), inset 0 0 20px rgba(255,62,214,0.05); }
          }
        `}</style>

        {features.map(({ title, body, Icon }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.08, duration: 0.45 }}
            style={{
              display: "grid",
              gridTemplateColumns: "62px 1fr",
              gap: 16,
              alignItems: "center",
              animation: `speechFeaturePulse ${3.4 + index * 0.35}s ease-in-out infinite`,
            }}
          >
            <div
              style={{
                width: 60,
                height: 58,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgb(255, 0, 247)",
                background: "linear-gradient(135deg, rgba(38, 21, 44, 0.78), rgba(22,9,36,0.64))",
                animation: "speechFeatureRing 3.8s ease-in-out infinite",
              }}
            >
              <Icon size={30} strokeWidth={1.8} color={index % 2 ? "#29adff" : "#00e5c0"} />
            </div>
            <div>
              <div
                style={{
                  color: "#04fac4",
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  textShadow: "0 0 16px rgba(153, 0, 229, 0.2)",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.96)",
                  fontFamily: "var(--font-body)",
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  marginTop: 4,
                  textShadow: "0 2px 10px rgba(0,0,0,0.75)",
                }}
              >
                {body}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
