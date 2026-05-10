/*
 * LogoutButton.tsx
 * HUD-style logout button matching the "Surgical Theater" design system
 * Place in: client/src/components/LogoutButton.tsx
 *
 * Usage in Home.tsx:
 *   import LogoutButton from "@/components/LogoutButton";
 *   ...
 *   {!showIntro && <LogoutButton onLogout={handleLogout} />}
 *
 * Add handleLogout to Home.tsx:
 *   const handleLogout = useCallback(() => {
 *     // e.g. clear auth token, then redirect
 *     window.location.href = "/login";
 *   }, []);
 */

import { useState, useCallback } from "react";

interface LogoutButtonProps {
  onLogout?: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = useCallback(() => {
    if (!confirmed) {
      // First click → ask confirm
      setConfirmed(true);
      // Auto-cancel confirm after 3s
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }
    // Second click → logout
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onLogout?.();
    }, 400);
  }, [confirmed, onLogout]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmed(false);
  }, []);

  return (
    <>
      <style>{`
        @keyframes logout-scanline {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes logout-corner-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        @keyframes logout-flicker {
          0%, 90%, 100% { opacity: 1; }
          93% { opacity: 0.45; }
          97% { opacity: 0.8; }
        }
        @keyframes logout-glow-breathe {
          0%, 100% { box-shadow: 0 0 14px rgba(0,180,140,0.12), inset 0 0 14px rgba(0,180,140,0.03); }
          50% { box-shadow: 0 0 26px rgba(0,180,140,0.22), inset 0 0 20px rgba(0,180,140,0.07); }
        }
        @keyframes logout-confirm-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(255,80,0,0.3), inset 0 0 18px rgba(255,80,0,0.08); }
          50% { box-shadow: 0 0 36px rgba(255,80,0,0.5), inset 0 0 28px rgba(255,80,0,0.15); }
        }
        @keyframes logout-press-flash {
          0% { background: rgba(0,212,170,0.06); }
          40% { background: rgba(0,212,170,0.22); }
          100% { background: rgba(0,212,170,0.06); }
        }
        @keyframes logout-confirm-appear {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logout-sub-drift {
          0%, 100% { opacity: 0.3; letter-spacing: 0.18em; }
          50% { opacity: 0.5; letter-spacing: 0.22em; }
        }

        .logout-wrap {
          position: relative;
          display: inline-block;
        }

        /* ── Normal state button ── */
        .logout-btn {
          background: rgba(0,212,170,0.05);
          border: none;
          cursor: pointer;
          position: relative;
          padding: 12px 42px 12px 36px;
          display: flex;
          align-items: center;
          gap: 11px;
          clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
          transition: background 0.25s ease, transform 0.15s ease;
          animation: logout-glow-breathe 3.5s ease-in-out infinite;
          outline: none;
        }
        .logout-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(0,212,170,0.35);
          clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
          transition: border-color 0.25s ease;
          pointer-events: none;
        }
        .logout-btn::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 30%;
          background: linear-gradient(90deg, transparent, rgba(0,212,170,0.1), transparent);
          animation: logout-scanline 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        .logout-btn:hover {
          background: rgba(0,212,170,0.11);
          transform: translateY(-1px);
          animation: none;
          box-shadow: 0 0 32px rgba(0,212,170,0.25), inset 0 0 22px rgba(0,212,170,0.08);
        }
        .logout-btn:hover::before { border-color: rgba(0,212,170,0.75); }
        .logout-btn.pressed {
          transform: scale(0.97) translateY(1px);
          animation: logout-press-flash 0.4s ease forwards;
        }

        /* ── Confirm state button ── */
        .logout-btn.confirming {
          background: rgba(255,80,0,0.08);
          animation: logout-confirm-pulse 1.2s ease-in-out infinite;
        }
        .logout-btn.confirming::before { border-color: rgba(255,100,30,0.7); }
        .logout-btn.confirming::after {
          background: linear-gradient(90deg, transparent, rgba(255,80,0,0.12), transparent);
        }

        /* ── Icon (power symbol) ── */
        .logout-icon {
          width: 14px;
          height: 14px;
          position: relative;
          flex-shrink: 0;
          z-index: 1;
        }
        .logout-icon svg {
          width: 14px;
          height: 14px;
          transition: stroke 0.25s;
        }
        .logout-btn .logout-icon svg { stroke: rgba(0,212,170,0.8); }
        .logout-btn:hover .logout-icon svg { stroke: rgba(0,255,200,1); }
        .logout-btn.confirming .logout-icon svg { stroke: rgba(255,130,40,0.9); }
        .logout-btn.pressed .logout-icon svg { stroke: rgba(180,255,230,1); }

        /* ── Label ── */
        .logout-label {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(0,212,170,0.85);
          transition: color 0.25s;
          position: relative;
          z-index: 1;
          animation: logout-flicker 8s infinite;
          white-space: nowrap;
        }
        .logout-btn:hover .logout-label { color: rgba(0,255,200,1); animation: none; }
        .logout-btn.confirming .logout-label { color: rgba(255,130,40,0.95); animation: none; }
        .logout-btn.pressed .logout-label { color: rgba(180,255,230,1); animation: none; }

        /* ── HUD corners ── */
        .logout-corner {
          position: absolute;
          width: 6px; height: 6px;
          border-color: rgba(0,200,160,0.6);
          border-style: solid;
          animation: logout-corner-pulse 2.6s ease-in-out infinite;
          pointer-events: none;
          transition: border-color 0.25s;
        }
        .logout-btn.confirming .logout-corner { border-color: rgba(255,100,30,0.7); }
        .logout-corner-tl { top: -1px; left: 10px; border-width: 1.5px 0 0 1.5px; }
        .logout-corner-tr { top: -1px; right: -1px; border-width: 1.5px 1.5px 0 0; }
        .logout-corner-bl { bottom: -1px; left: 10px; border-width: 0 0 1.5px 1.5px; }
        .logout-corner-br { bottom: -1px; right: -1px; border-width: 0 1.5px 1.5px 0; }

        /* ── Sub label ── */
        .logout-sub {
          position: absolute;
          bottom: -20px;
          left: 12px;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          color: rgba(0,180,140,0.35);
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
          animation: logout-sub-drift 5s ease-in-out infinite;
          transition: color 0.25s;
        }
        .logout-btn.confirming + .logout-sub { color: rgba(255,80,0,0.45); animation: none; }

        /* ── Confirm dialog strip ── */
        .logout-confirm-bar {
          position: absolute;
          top: calc(100% + 28px);
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: logout-confirm-appear 0.25s ease forwards;
          z-index: 10;
        }
        .logout-confirm-text {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,130,40,0.85);
          white-space: nowrap;
        }
        .logout-confirm-yes {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,80,0,0.9);
          border: 1px solid rgba(255,80,0,0.4);
          background: transparent;
          padding: 3px 8px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .logout-confirm-yes:hover {
          background: rgba(255,80,0,0.15);
          color: rgba(255,160,60,1);
          border-color: rgba(255,100,30,0.8);
        }
        .logout-confirm-no {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(150,160,170,0.5);
          border: 1px solid rgba(150,160,170,0.2);
          background: transparent;
          padding: 3px 8px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .logout-confirm-no:hover {
          background: rgba(150,160,170,0.08);
          color: rgba(150,160,170,0.9);
          border-color: rgba(150,160,170,0.4);
        }
      `}</style>

      <div className="logout-wrap">
        {/* Main button */}
        <button
          className={`logout-btn${confirmed ? " confirming" : ""}${pressed ? " pressed" : ""}`}
          onClick={handleClick}
          title={confirmed ? "คลิกอีกครั้งเพื่อออกจากระบบ" : "ออกจากระบบ"}
        >
          <div className="logout-corner logout-corner-tl" />
          <div className="logout-corner logout-corner-tr" />
          <div className="logout-corner logout-corner-bl" />
          <div className="logout-corner logout-corner-br" />

          {/* Power / exit icon */}
          <div className="logout-icon">
            <svg viewBox="0 0 14 14" fill="none" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 2.5A5 5 0 1 0 9 2.5" />
              <line x1="7" y1="1" x2="7" y2="7" />
            </svg>
          </div>

          <span className="logout-label">
            {confirmed ? "ยืนยัน ?" : "Logout"}
          </span>
        </button>

        {/* Floating sub-label */}
        <div className="logout-sub">
          {confirmed ? "กดอีกครั้งเพื่อยืนยัน //———" : "Terminate Session //———"}
        </div>

        {/* Confirm action bar */}
        {confirmed && (
          <div className="logout-confirm-bar">
            <span className="logout-confirm-text">ออกจากระบบ ?</span>
            <button className="logout-confirm-yes" onClick={handleClick}>
              ✓ ยืนยัน
            </button>
            <button className="logout-confirm-no" onClick={handleCancel}>
              ✕ ยกเลิก
            </button>
          </div>
        )}
      </div>
    </>
  );
}