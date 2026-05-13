import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import TTSControlButton from "@/components/TTSControlButton";
import { useBreakpoint } from "@/hooks/useBreakpoint";

export default function AccessibleControlPanel() {
  const themeContext = useTheme();
  const { theme = "dark" } = themeContext;
  const toggleTheme = themeContext?.toggleTheme;
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { sidebarWidth } = useBreakpoint();
  const leftOffset = sidebarWidth - 200;

  const handleThemeToggle = () => {
    console.log("Theme toggle clicked, current theme:", theme);
    if (toggleTheme) {
      toggleTheme();
    }
  };

  return (
    <>
      <style>{`
        .control-panel-container {
          position: fixed;
          bottom: 72px;
          left: 16px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
        }

        .control-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 52px;
          height: 52px;
          border-radius: 12px;
          border: 1.5px solid rgba(79, 142, 247, 0.4);
          background: linear-gradient(135deg, rgba(10, 10, 15, 0.85), rgba(20, 20, 35, 0.9));
          color: #4F8EF7;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
        }

        .control-button:hover {
          transform: translateY(-3px);
          border-color: #4F8EF7;
          box-shadow: 0 8px 28px rgba(79, 142, 247, 0.3);
          background: linear-gradient(135deg, rgba(79, 142, 247, 0.15), rgba(100, 180, 255, 0.1));
        }

        .control-button:active {
          transform: translateY(-1px);
        }

        .control-button.audio-on {
          border-color: #00D4AA;
          color: #00D4AA;
        }

        .control-button.audio-on:hover {
          border-color: #00D4AA;
          box-shadow: 0 8px 28px rgba(0, 212, 170, 0.3);
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(100, 220, 200, 0.1));
        }

        .control-button.theme {
          border-color: rgba(255, 180, 50, 0.4);
          color: rgba(255, 180, 50, 0.7);
        }

        .control-button.theme:hover {
          border-color: rgba(255, 180, 50, 0.8);
          color: rgba(255, 180, 50, 1);
          box-shadow: 0 8px 28px rgba(255, 180, 50, 0.2);
        }

        @media (max-width: 768px) {
          .control-panel-container {
            gap: 6px;
            bottom: 68px;
          }

          .control-button {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .control-panel-container {
            bottom: 64px;
            left: 10px;
          }

          .control-button {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      {/* Control Panel */}
      <div style={{
        position: "fixed",
        bottom: 72,
        left: leftOffset,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "'DM Sans', sans-serif",
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Audio Toggle Button */}
        <button
          className={`control-button ${audioEnabled ? "audio-on" : ""}`}
          onClick={() => setAudioEnabled(!audioEnabled)}
          aria-label={audioEnabled ? "ปิดเสียง" : "เปิดเสียง"}
        >
          {audioEnabled ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a7 7 0 0 1 0 9.9M21 4a9.9 9.9 0 0 1 0 14" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        {/* Text-to-Speech Control Button */}
        <TTSControlButton />
      </div>
    </>
  );
}