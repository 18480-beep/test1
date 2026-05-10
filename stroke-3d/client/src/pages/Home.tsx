/*
 * Home.tsx
 * Design: "Surgical Theater" — Dark Cinematic Medical Realism
 * Main page orchestrating the 3D Stroke Education experience
 * Scroll-driven scene transitions with cinematic effects
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import SceneContent from "@/components/SceneContent";
import { useTheme } from "@/contexts/ThemeContext";
import SceneImage from "@/components/SceneImage";
import Navigation from "@/components/Navigation";
import ECGPulse from "@/components/ECGPulse";
import ScrollIndicator from "@/components/ScrollIndicator";
import StrokeTypeSelector from "@/components/StrokeTypeSelector";
import FASTOverlay from "@/components/FASTOverlay";
import IntroOverlay from "@/components/IntroOverlay";
import VignetteEffect from "@/components/VignetteEffect";
import DepthMeter from "@/components/DepthMeter";
import StatsPanel from "@/components/StatsPanel";
import ReplayControls from "@/components/ReplayControls";
import AudioManager from "@/components/AudioManager";
import AccessibleControlPanel from "@/components/AccessibleControlPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { useSelectableText } from "@/hooks/useSelectableText";
import { SCENE_COUNT, SCENES } from "@/lib/sceneData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import StrokeChatWidget from "@/components/StrokeChatWidget";
import HomeCommandPanel from "@/components/HomeCommandPanel";
import NearbyBrainHospitals from "@/components/NearbyBrainHospitals";

export default function Home() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showGame, setShowGame] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const lastScrollTime = useRef(Date.now());
  const scrollAccumulator = useRef(0);
  const [showChat, setShowChat] = useState(false);

  // Enable text selection to speak
  useSelectableText();

  // รับ game session result จาก iframe แล้วบันทึกลง Supabase
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'GAME_SESSION_END') return;
      const d = e.data;
      if (!user) return;
      try {
        const { error } = await supabase.from('game_sessions').insert({
          user_id: user.id,
          played_at: new Date().toISOString(),
          score: d.score ?? 0,
          reps: d.reps ?? 0,
          time_sec: d.time_sec ?? 0,
          rank: d.rank ?? 'D',
          completed: d.completed ?? false,
          mode: d.mode ?? 'standard',
          bombs_hit: d.bombs_hit ?? 0,
          walls_hit: d.walls_hit ?? 0,
          miss_count: d.miss_count ?? 0,
        });

        if (error) {
          console.error('[Home] Supabase insert error:', error.message);
        } else {
          console.log('[Home] Game session saved successfully');
        }
      } catch (err) {
        console.error('[Home] Runtime error saving game_session:', err);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  // Scroll-driven scene changes
  useEffect(() => {
    if (showIntro) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      const timeDelta = now - lastScrollTime.current;
      lastScrollTime.current = now;

      scrollAccumulator.current += e.deltaY;
      const threshold = 120;

      if (Math.abs(scrollAccumulator.current) > threshold && !isTransitioning && !showGame && !showChat) {
        if (scrollAccumulator.current > 0 && activeScene < SCENE_COUNT - 1) {
          setIsTransitioning(true);
          setActiveScene((prev) => Math.min(prev + 1, SCENE_COUNT - 1));
          scrollAccumulator.current = 0;
          setTimeout(() => {
            setIsTransitioning(false);
            scrollAccumulator.current = 0;
          }, 850);
        } else if (scrollAccumulator.current < 0 && activeScene > 0) {
          setIsTransitioning(true);
          setActiveScene((prev) => Math.max(prev - 1, 0));
          scrollAccumulator.current = 0;
          setTimeout(() => {
            setIsTransitioning(false);
            scrollAccumulator.current = 0;
          }, 850);
        }
      }

      if (timeDelta > 200) {
        scrollAccumulator.current = e.deltaY;
      }

      const progress = Math.min(1, Math.max(0, Math.abs(scrollAccumulator.current) / threshold));
      setScrollProgress(progress);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeScene, showIntro, isTransitioning, showGame, showChat]);

  // Keyboard navigation
  useEffect(() => {
    if (showIntro || showGame || showChat) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (activeScene < SCENE_COUNT - 1) {
          setIsTransitioning(true);
          setActiveScene((prev) => prev + 1);
          setTimeout(() => setIsTransitioning(false), 800);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeScene > 0) {
          setIsTransitioning(true);
          setActiveScene((prev) => prev - 1);
          setTimeout(() => setIsTransitioning(false), 800);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScene, showIntro, isTransitioning, showGame, showChat]);

  // Touch support
  useEffect(() => {
    if (showIntro || showGame || showChat) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return;
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY - touchEndY;

      if (Math.abs(delta) > 50) {
        if (delta > 0 && activeScene < SCENE_COUNT - 1) {
          setIsTransitioning(true);
          setActiveScene((prev) => prev + 1);
          setTimeout(() => setIsTransitioning(false), 800);
        } else if (delta < 0 && activeScene > 0) {
          setIsTransitioning(true);
          setActiveScene((prev) => prev - 1);
          setTimeout(() => setIsTransitioning(false), 800);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeScene, showIntro, isTransitioning, showGame, showChat]);

  const handleSceneChange = useCallback((scene: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveScene(scene);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const handleStart = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplay = useCallback(() => {
    setIsTransitioning(true);
    setActiveScene(0);
    setTimeout(() => setIsTransitioning(false), 800);
  }, []);

  const handleGameBtnClick = useCallback(() => {
    setBtnPressed(true);
    setTimeout(() => {
      setBtnPressed(false);
      setShowGame(true);
    }, 300);
  }, []);

  // URL ของเกมในแต่ละ scene (อ่านจาก gameButton.gameUrl ถ้ามี)
  const currentGameUrl = SCENES[activeScene]?.gameButton?.gameUrl ?? "/game/index.html";

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: theme === "light" ? "#F5F7FA" : "#0A0A0F", transition: "background-color 0.5s ease" }}
    >
      {/* CSS animations for game button */}
      <style>{`
        @keyframes hud-scanline {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes hud-corner-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes hud-flicker {
          0%, 92%, 100% { opacity: 1; }
          94% { opacity: 0.4; }
          97% { opacity: 0.8; }
        }
        @keyframes hud-glow-breathe {
          0%, 100% { box-shadow: 0 0 22px var(--hud-c-glow1), inset 0 0 18px var(--hud-c-glow2); }
          50%       { box-shadow: 0 0 42px var(--hud-c-glow3), inset 0 0 28px var(--hud-c-glow2); }
        }
        @keyframes hud-press-flash {
          0%   { background: var(--hud-c-bg); }
          40%  { background: var(--hud-c-bgHover); }
          100% { background: var(--hud-c-bg); }
        }
        @keyframes sub-drift {
          0%, 100% { opacity: 0.35; letter-spacing: 0.18em; }
          50%       { opacity: 0.65; letter-spacing: 0.24em; }
        }
        @keyframes hud-badge-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }

        /* ── wrapper ── */
        .hud-btn-wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 0; }

        /* ── main button ── */
        .hud-btn {
          --hud-c:        #ff5500;
          --hud-c-bg:     rgba(255,85,0,0.07);
          --hud-c-bgHover:rgba(255,85,0,0.18);
          --hud-c-border: rgba(255,85,0,0.45);
          --hud-c-glow1:  rgba(255,85,0,0.18);
          --hud-c-glow2:  rgba(255,85,0,0.06);
          --hud-c-glow3:  rgba(255,85,0,0.35);

          background: var(--hud-c-bg);
          border: none;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          clip-path: polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%);
          transition: background 0.2s, transform 0.15s;
          animation: hud-glow-breathe 3s ease-in-out infinite;
          outline: none;
          overflow: hidden;
        }

        /* border overlay */
        .hud-btn::before {
          content: '';
          position: absolute; inset: 0;
          border: 1.5px solid var(--hud-c-border);
          clip-path: polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%);
          transition: border-color 0.2s;
          pointer-events: none;
        }
        /* scanline shimmer */
        .hud-btn::after {
          content: '';
          position: absolute; top: 0; bottom: 0; width: 35%;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--hud-c) 22%, transparent), transparent);
          animation: hud-scanline 2.6s ease-in-out infinite;
          pointer-events: none;
        }

        .hud-btn:hover {
          background: var(--hud-c-bgHover);
          transform: translateY(-2px);
          animation: none;
          box-shadow: 0 0 48px var(--hud-c-glow3), 0 4px 20px rgba(0,0,0,0.4), inset 0 0 28px var(--hud-c-glow2);
        }
        .hud-btn:hover::before { border-color: var(--hud-c); }
        .hud-btn.pressed {
          transform: scale(0.96) translateY(1px);
          animation: hud-press-flash 0.28s ease forwards;
        }
        .hud-btn.pressed::before { border-color: #fff8; }

        /* label */
        .hud-label {
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--hud-c);
          transition: color 0.2s, letter-spacing 0.2s;
          position: relative; z-index: 1;
          animation: hud-flicker 7s infinite;
          white-space: nowrap;
          font-weight: 600;
        }
        .hud-btn:hover .hud-label  { color: #fff; letter-spacing: 0.34em; animation: none; }
        .hud-btn.pressed .hud-label { color: #fffde0; animation: none; }

        /* corner brackets */
        .hud-corner {
          position: absolute; width: 8px; height: 8px;
          border-color: var(--hud-c);
          border-style: solid;
          animation: hud-corner-pulse 2s ease-in-out infinite;
          pointer-events: none;
          opacity: 0.8;
        }
        .hud-corner-tl { top: -1px; left: 14px;  border-width: 1.5px 0 0 1.5px; }
        .hud-corner-tr { top: -1px; right: -1px;  border-width: 1.5px 1.5px 0 0; }
        .hud-corner-bl { bottom: -1px; left: 14px; border-width: 0 0 1.5px 1.5px; }
        .hud-corner-br { bottom: -1px; right: -1px; border-width: 0 1.5px 1.5px 0; }

        /* top / bottom labels */
        .hud-top-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px; letter-spacing: 0.22em;
          color: var(--hud-c); opacity: 0.55;
          text-transform: uppercase; white-space: nowrap;
          margin-bottom: 6px;
          animation: hud-badge-pulse 3s ease-in-out infinite;
        }
        .hud-sub-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px; letter-spacing: 0.18em;
          color: var(--hud-c); opacity: 0.4;
          text-transform: uppercase; white-space: nowrap;
          margin-top: 7px;
          animation: sub-drift 4s ease-in-out infinite;
        }
      `}</style>

      {/* Audio Manager (procedural sound) */}
      <AudioManager activeScene={activeScene} enabled={true} />

      {/* Background medical images */}
      <SceneImage activeScene={activeScene} />

      {/* Gradient overlays for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: `
            linear-gradient(135deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.3) 40%, transparent 60%),
            linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, transparent 10%, transparent 90%, rgba(10,10,15,0.5) 100%)
          `,
        }}
      />

      {/* Scanline effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          opacity: 0.3,
        }}
      />

      {/* Vignette effect for stroke scenes */}
      {!showIntro && <VignetteEffect activeScene={activeScene} />}

      {/* Scene text content — hidden on scene 0 (replaced by HomeCommandPanel) */}
      {!showIntro && activeScene !== 0 && <SceneContent activeScene={activeScene} scrollProgress={scrollProgress} />}

      {/* Command Dashboard — scene 0 only */}
      {!showIntro && activeScene === 0 && <HomeCommandPanel />}

      {/* Depth meter */}
      {!showIntro && <DepthMeter activeScene={activeScene} />}

      {/* Stats panel */}
      {!showIntro && <StatsPanel activeScene={activeScene} />}

      {/* Navigation */}
      {!showIntro && (
        <Navigation
          activeScene={activeScene}
          onSceneChange={handleSceneChange}
        />
      )}

      {/* ECG Pulse Line */}
      {!showIntro && <ECGPulse activeScene={activeScene} />}

      {/* Scroll indicator */}
      {!showIntro && <ScrollIndicator visible={activeScene === 0} />}

      {/* Game Button — driven by sceneData.gameButton */}
      {!showIntro && (() => {
        const scene = SCENES[activeScene];
        const gb = scene?.gameButton;
        if (!gb) return null;
        const col = gb.color ?? scene.accentColor;
        const fs  = gb.fontSize  ?? 12;
        const px  = gb.paddingX  ?? 52;
        const py  = gb.paddingY  ?? 16;
        const bot = gb.y         ?? 112;
        const posStyle: React.CSSProperties = gb.x != null
          ? { left: gb.x, bottom: bot }
          : { left: "50%", bottom: bot, transform: "translateX(-50%)" };
        return (
          <div className="fixed" style={{ ...posStyle, zIndex: 40 }}>
            <div className="hud-btn-wrap">
              {gb.topLabel && (
                <div className="hud-top-label" style={{ "--hud-c": col } as React.CSSProperties}>
                  {gb.topLabel}
                </div>
              )}
              <button
                className={`hud-btn${btnPressed ? " pressed" : ""}`}
                style={{
                  "--hud-c":        col,
                  "--hud-c-bg":     `color-mix(in srgb, ${col} 8%, transparent)`,
                  "--hud-c-bgHover":`color-mix(in srgb, ${col} 20%, transparent)`,
                  "--hud-c-border": `color-mix(in srgb, ${col} 50%, transparent)`,
                  "--hud-c-glow1":  `color-mix(in srgb, ${col} 18%, transparent)`,
                  "--hud-c-glow2":  `color-mix(in srgb, ${col} 7%, transparent)`,
                  "--hud-c-glow3":  `color-mix(in srgb, ${col} 38%, transparent)`,
                  padding: `${py}px ${px}px`,
                  fontSize: fs,
                } as React.CSSProperties}
                onClick={handleGameBtnClick}
              >
                <div className="hud-corner hud-corner-tl" />
                <div className="hud-corner hud-corner-tr" />
                <div className="hud-corner hud-corner-bl" />
                <div className="hud-corner hud-corner-br" />
                <span className="hud-label" style={{ fontSize: fs }}>{gb.label}</span>
              </button>
              {gb.subLabel && (
                <div className="hud-sub-label" style={{ "--hud-c": col } as React.CSSProperties}>
                  {gb.subLabel}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Stroke type selector */}
      {!showIntro && (
        <StrokeTypeSelector activeScene={activeScene} onSelectType={handleSceneChange} />
      )}

      {/* F.A.S.T. overlay — disabled (scene removed) */}
      {/* ReplayControls — disabled (scene removed) */}

      {/* Audio toggle */}
      {!showIntro && !showGame && <AccessibleControlPanel />}

      {/* User Settings & Streak (Bottom Right) */}
      {!showIntro && !showGame && <SettingsPanel />}

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && <IntroOverlay visible={showIntro} onStart={handleStart} />}
      </AnimatePresence>

      {/* Depth level indicator (mobile - bottom left) */}
      {!showIntro && !showGame && (
        <div
          className="fixed left-6 md:left-12 bottom-16 pointer-events-none lg:hidden"
          style={{ zIndex: 35 }}
        >
          <div
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              color: "rgba(150, 160, 170, 0.3)",
            }}
          >
            Depth Level
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "rgba(0, 212, 170, 0.4)",
            }}
          >
            {String(activeScene + 1).padStart(2, "0")}
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGame && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 60, backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={() => setShowGame(false)}
        >
          <div
            className="absolute inset-6 md:inset-12"
            style={{
              border: "1px solid rgba(255, 80, 0, 0.3)",
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: "0 0 80px rgba(255, 60, 0, 0.2), inset 0 0 80px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar */}
            <div
              style={{
                background: "rgba(10,10,15,0.95)",
                borderBottom: "1px solid rgba(255, 80, 0, 0.2)",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.25em",
                color: "rgba(255, 120, 40, 0.7)",
                textTransform: "uppercase",
              }}>
                ● &nbsp; Stroke Training Module
              </span>
              <button
                onClick={() => setShowGame(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 100, 40, 0.6)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,140,60,1)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,100,40,0.6)")}
              >
                ESC / ปิด ✕
              </button>
            </div>

            {/* iframe */}
            <iframe
              src={currentGameUrl}
              style={{ width: "100%", height: "calc(100% - 41px)", border: "none", display: "block" }}
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {!showIntro && !showGame && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: "fixed", bottom: 74, right: 14, zIndex: 55,
            background: "rgba(8, 12, 18, 0.62)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(20, 220, 180, 0.28)",
            color: "#14dcb4", borderRadius: "50%",
            width: 44, height: 44, fontSize: 20,
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(20,220,180,0.2)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(20,220,180,0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          🩺
        </button>
      )}

      {!showIntro && !showGame && showChat && <StrokeChatWidget onClose={() => setShowChat(false)} />}

    </div>
  );
}