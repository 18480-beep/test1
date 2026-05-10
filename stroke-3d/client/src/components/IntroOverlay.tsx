import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface IntroOverlayProps {
  visible: boolean;
  onStart: () => void;
}

function Counter({ from, to, delay }: { from: number; to: number; delay: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const unsubscribe = rounded.on("change", setDisplay);
    const controls = animate(count, to, {
      duration: 1.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => { controls.stop(); unsubscribe(); };
  }, []);

  return <span>{display}</span>;
}

const introStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,200;0,300;1,200;1,300&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  .intro-title-1 {
    font-family: 'Sarabun', sans-serif;
    font-weight: 300;
    font-size: clamp(38px, 5.5vw, 72px);
    line-height: 1.3;
    letter-spacing: 0.04em;
    margin: 0 0 4px 0;
    background: linear-gradient(180deg, #ff0000 0%, rgba(255,255,255,0.82) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .intro-title-2 {
    font-family: 'Sarabun', sans-serif;
    font-weight: 200;
    font-size: clamp(38px, 5.5vw, 72px);
    line-height: 1.3;
    letter-spacing: 0.04em;
    margin-bottom: 44px;
    background: linear-gradient(180deg, rgba(241,240,240,0.51) 0%, rgba(255,255,255,0.18) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  .intro-title-1-shimmer {
    background: linear-gradient(90deg,
      rgb(255,255,255) 0%,
      rgba(35,142,250,0.95) 25%,
      rgb(226,28,28) 50%,
      rgb(255,91,154) 75%,
      rgba(255,255,255,0.6) 100%
    );
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
    animation-delay: 1.4s;
  }
  .intro-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 36px;
    background: transparent;
    border: 1px solid rgba(253,239,239,0.5);
    border-radius: 2px;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.4s ease;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,176,5,0.9);
  }
  .intro-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgb(255,0,0);
    transform: translateX(-101%);
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .intro-btn:hover::before { transform: translateX(0); }
  .intro-btn:hover { border-color: rgb(204,1,1); color: #000; }
  .intro-btn:hover .btn-arrow { transform: translateX(4px); color: #000; }
  .intro-btn span, .intro-btn .btn-arrow {
    position: relative;
    z-index: 1;
    transition: color 0.5s ease, transform 0.3s ease;
  }
  .intro-divider {
    width: 1px;
    height: 52px;
    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent);
  }
  .stat-line { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .stat-num {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    color: rgba(255,255,255,0.85);
    line-height: 1;
  }
  .stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }
  .intro-scan {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(55,50,50,0.43), transparent);
    animation: introScan 5s ease-in-out infinite;
  }
  @keyframes introScan {
    0%   { top: 0%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .rehab-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    background: transparent;
    border: 1px solid rgba(20,220,180,0.35);
    border-radius: 2px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(20,220,180,0.75);
  }
  .rehab-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(20,220,180,0.08);
    transform: translateX(-101%);
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .rehab-btn:hover::before { transform: translateX(0); }
  .rehab-btn:hover { border-color: rgba(20,220,180,0.7); color: #14dcb4; }
  .rehab-btn span { position: relative; z-index: 1; }
`;

export default function IntroOverlay({ visible, onStart }: IntroOverlayProps) {
  const [, navigate] = useLocation();
  if (!visible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: introStyles }} />

      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 1.0, ease: "easeInOut" } }}
        style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "#000000eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div className="intro-scan" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}
          style={{ position: "absolute", top: 32, left: 40, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" }}>
          Neural Atlas — v2.1
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}
          style={{ position: "absolute", top: 32, right: 40, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" }}>
          3D / Interactive
        </motion.div>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", top: 56, left: 40, right: 40, height: 1, background: "rgba(255,255,255,0.07)", transformOrigin: "left" }} />
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", bottom: 56, left: 40, right: 40, height: 1, background: "rgba(255,255,255,0.07)", transformOrigin: "right" }} />

        <div style={{ textAlign: "center", maxWidth: 680, padding: "0 40px" }}>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(233,223,223,0.96)", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <span style={{ display: "inline-block", width: 24, height: 1, background: "rgb(250,248,248)" }} />
            ยินดีต้อนรับสู่
            <span style={{ display: "inline-block", width: 24, height: 1, background: "rgb(255,255,255)" }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.55, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="intro-title-1 intro-title-1-shimmer"
          >
            การเดินทางเชิงโต้ตอบ
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.75, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="intro-title-2"
          >
            สู่สมอง
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
            style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: 14.5, lineHeight: 1.75, color: "rgba(255,255,255,0.35)", maxWidth: 400, margin: "0 auto 48px", letterSpacing: "0.01em" }}>
            An interactive 3D journey into cerebrovascular disease —
            explore anatomy through cinematic visualization.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}
          >
            <button className="intro-btn" onClick={onStart}>
              <span>Begin Exploration</span>
              <svg className="btn-arrow" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button className="rehab-btn" onClick={() => navigate("/rehab")}>
              <span>Rehab Tracker</span>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, marginTop: 52 }}>
            <div className="stat-line">
              <div className="stat-num"><Counter from={0} to={7} delay={1.5} /></div>
              <div className="stat-label">เกม</div>
            </div>
            <div className="intro-divider" />
            <div className="stat-line">
              <div className="stat-num">3D</div>
              <div className="stat-label">Visualization</div>
            </div>
            <div className="intro-divider" />
            <div className="stat-line">
              <div className="stat-num"><Counter from={0} to={15} delay={1.6} /><span style={{ fontSize: 15 }}>min</span></div>
              <div className="stat-label">Journey</div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }}
          style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.13)", whiteSpace: "nowrap" }}>
          Scroll or use keyboard to navigate
        </motion.div>
      </motion.div>
    </>
  );
}