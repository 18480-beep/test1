/*
 * Navigation.tsx  — RESPONSIVE VERSION
 *
 * Mobile  (<640px)  → compact top bar with hamburger ☰ to open drawer
 *                     scene dots hidden (too crowded)
 * Tablet  (640-1023) → top bar shifts right by 56 px (icon sidebar)
 * Desktop (≥1024px)  → original top bar at left:200, full breadcrumbs
 */

import { motion } from "framer-motion";
import { SCENES } from "@/lib/sceneData";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface NavigationProps {
  activeScene: number;
  onSceneChange: (scene: number) => void;
  /** Mobile only: callback to open sidebar drawer */
  onMenuOpen?: () => void;
}

export default function Navigation({ activeScene, onSceneChange, onMenuOpen }: NavigationProps) {
  const { logout } = useAuth();
  const { textScale, theme } = useTheme();
  const { isMobile } = useBreakpoint();

  const accent = SCENES[activeScene]?.accentColor || "#00D4AA";
  const isDark = theme !== "light";

  return (
    <>
      {/* ── Top navigation bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed top-0 right-0 flex items-center justify-between px-4 md:px-6 py-3 pointer-events-auto"
        style={{
          zIndex: 40,
          left: 0,
          transition: "none",
          // subtle bottom border on mobile so it reads as a bar
          borderBottom: isMobile ? "1px solid rgba(255,255,255,0.05)" : "none",
          background: isMobile ? "rgba(6,9,15,0.75)" : "transparent",
          backdropFilter: isMobile ? "blur(12px)" : "none",
        }}
      >
        {/* Left: hamburger (mobile) OR logo (tablet+) */}
        <div className="flex items-center gap-3">
          {isMobile && onMenuOpen && (
            <button
              onClick={onMenuOpen}
              style={{
                background: "none",
                border: `1px solid rgba(255,255,255,0.12)`,
                borderRadius: 7,
                color: "rgba(200,220,255,0.7)",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 16,
                flexShrink: 0,
              }}
              aria-label="Open menu"
            >
              ☰
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center"
              style={{ borderColor: `${accent}40` }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke={accent} strokeWidth="1.5" />
                <circle cx="8" cy="8" r="6" stroke={accent} strokeWidth="0.5" opacity="0.5" />
                <line x1="8" y1="1" x2="8" y2="4" stroke={accent} strokeWidth="0.5" />
                <line x1="8" y1="12" x2="8" y2="15" stroke={accent} strokeWidth="0.5" />
                <line x1="1" y1="8" x2="4" y2="8" stroke={accent} strokeWidth="0.5" />
                <line x1="12" y1="8" x2="15" y2="8" stroke={accent} strokeWidth="0.5" />
              </svg>
            </div>
            <span
              className="text-sm font-medium tracking-wider"
              style={{ fontFamily: "var(--font-display)", color: accent }}
            >
              STROKE 3D
            </span>
          </div>
        </div>

        {/* Centre: breadcrumbs (desktop only) */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-1">
            {SCENES.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => onSceneChange(i)}
                className="group flex items-center gap-1 px-2 py-1 rounded transition-all duration-300 hover:bg-white/5"
              >
                <span
                  className="tracking-wider uppercase transition-colors duration-300"
                  style={{
                    fontSize: `calc(25 ๆpx * ${textScale})`,
                    fontFamily: "var(--font-mono)",
                    color: i === activeScene
                      ? scene.accentColor
                      : isDark ? "rgba(150,160,170,0.5)" : "rgba(40,50,60,0.5)",
                  }}
                >
                  {scene.slug}
                </span>
                {i < SCENES.length - 1 && (
                  <span style={{ fontSize: `calc(14px * ${textScale})` }} className="text-white/20 ml-1">›</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Right: counter + logout */}
        <div className="flex items-center gap-3">
          <div
            className="tracking-wider"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: `calc(14px * ${textScale})`,
              color: isDark ? "rgba(150,160,170,0.6)" : "rgba(40,50,60,0.6)",
            }}
          >
            <span style={{ color: accent }}>
              {String(activeScene + 1).padStart(2, "0")}
            </span>
            <span className="mx-1">/</span>
            <span>{String(SCENES.length).padStart(2, "0")}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 hover:bg-white/10"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: `calc(14px * ${textScale})`,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isDark ? "rgba(150,160,170,0.55)" : "rgba(40,50,60,0.7)",
              border: `1px solid ${isDark ? "rgba(150,160,170,0.15)" : "rgba(0,0,0,0.1)"}`,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            {/* Hide text on very small screens */}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </motion.header>

      {/* ── Right-side vertical progress dots (tablet+) ── */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="fixed right-4 md:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 pointer-events-auto"
          style={{ zIndex: 40 }}
        >
          {SCENES.map((scene, i) => (
            <button
              key={scene.id}
              onClick={() => onSceneChange(i)}
              className="group relative flex items-center"
            >
              {/* Tooltip */}
              <span
                className="absolute right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-wider uppercase whitespace-nowrap"
                style={{
                  fontSize: `calc(10px * ${textScale})`,
                  fontFamily: "var(--font-mono)",
                  color: scene.accentColor,
                }}
              >
                {scene.slug}
              </span>

              {/* Dot */}
              <motion.div
                animate={{
                  scale: i === activeScene ? 1 : 0.6,
                  opacity: i === activeScene ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: i === activeScene ? scene.accentColor : "rgba(150,160,170,0.3)",
                  boxShadow: i === activeScene ? `0 0 10px ${scene.accentColor}80` : "none",
                }}
              />

              {i < SCENES.length - 1 && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-px h-3"
                  style={{
                    backgroundColor: i < activeScene ? scene.accentColor + "40" : "rgba(150,160,170,0.1)",
                  }}
                />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Mobile: mini scene dots bar at bottom of screen */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: "rgba(6,9,15,0.85)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "10px 16px",
            paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          }}
        >
          {SCENES.map((scene, i) => (
            <button
              key={scene.id}
              onClick={() => onSceneChange(i)}
              style={{
                width: i === activeScene ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: i === activeScene ? scene.accentColor : "rgba(150,160,170,0.25)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                padding: 0,
                boxShadow: i === activeScene ? `0 0 8px ${scene.accentColor}60` : "none",
              }}
              aria-label={scene.slug}
            />
          ))}
        </div>
      )}
    </>
  );
}