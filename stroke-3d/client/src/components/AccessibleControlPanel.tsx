import { useState } from "react";
import TTSControlButton from "@/components/TTSControlButton";
import { useBreakpoint } from "@/hooks/useBreakpoint";

export default function AccessibleControlPanel() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { isMobile, sidebarWidth } = useBreakpoint();

  // ✅ แก้ไข: clamp sidebarWidth ไม่ให้ติดลบ แล้วบวก offset 14px
  const safeSidebarWidth = Math.max(0, sidebarWidth ?? 0);
  const leftOffset = isMobile
    ? "max(env(safe-area-inset-left, 0px), 10px)"
    : `${safeSidebarWidth - 170}px`;

  return (
    <>
      <style>{`
        .control-panel-container {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(56px, 8vh, 72px));
          left: var(--control-panel-left, 16px);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: clamp(6px, 1.4vw, 8px);
          font-family: 'DM Sans', sans-serif;
          transition: left 0.25s cubic-bezier(0.4,0,0.2,1), bottom 0.2s ease;
          max-width: calc(100vw - var(--control-panel-left, 16px) - max(env(safe-area-inset-right, 0px), 10px));
        }

        .control-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: clamp(40px, 4.4vw, 52px);
          height: clamp(40px, 4.4vw, 52px);
          min-width: 40px;
          min-height: 40px;
          border-radius: 12px;
          border: 1.5px solid rgba(79, 142, 247, 0.4);
          background: linear-gradient(135deg, rgba(10, 10, 15, 0.85), rgba(20, 20, 35, 0.9));
          color: #4F8EF7;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 0;
          flex: 0 0 auto;
          touch-action: manipulation;
        }

        .control-button svg {
          width: clamp(18px, 2.2vw, 22px);
          height: clamp(18px, 2.2vw, 22px);
          flex: 0 0 auto;
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
            bottom: calc(env(safe-area-inset-bottom, 0px) + 62px);
          }
        }

        @media (max-width: 480px) {
          .control-panel-container {
            bottom: calc(env(safe-area-inset-bottom, 0px) + 58px);
          }
        }
      `}</style>

      <div
        className="control-panel-container"
        style={{ "--control-panel-left": leftOffset } as React.CSSProperties}
      >
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

        <TTSControlButton />
      </div>
    </>
  );
}