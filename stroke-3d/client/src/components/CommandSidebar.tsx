/*
 * CommandSidebar.tsx — Readable Edition
 * ✅ ตัวหนังสือใหญ่ขึ้นทั้ง sidebar
 * ✅ ผูก font-size กับ var(--text-scale) ทุกจุด
 * ✅ สีสวยขึ้น contrast ชัดขึ้น
 * ✅ แก้ไข: export SIDEBAR_WIDTH ให้ useBreakpoint และ component ใช้ค่าเดียวกัน
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SCENES } from "@/lib/sceneData";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import TTSControlButton from "@/components/TTSControlButton";

interface CommandSidebarProps {
  activeScene: number;
  onSceneChange: (scene: number) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { icon: "📋", label: "หน้าแรก",        key: "log",   path: "/"      },
  { icon: "🗺",  label: "Resource Map",   key: "map",   path: null     },
  { icon: "👤", label: "Rehab Tracker",  key: "rehab", path: "/rehab" },
  { icon: "⚙️", label: "System Health",  key: "sys",   path: null     },
];

// ✅ ค่าความกว้าง sidebar ที่ใช้ร่วมกันทั้งโปรเจกต์
// นำ export นี้ไปใช้ใน useBreakpoint เพื่อให้ sidebarWidth ตรงกัน
export const SIDEBAR_WIDTH_FULL = 200;
export const SIDEBAR_WIDTH_COLLAPSED = 13;
export const SIDEBAR_WIDTH_MOBILE = 260;

export default function CommandSidebar({
  activeScene,
  onSceneChange,
  mobileOpen = false,
  onMobileClose,
}: CommandSidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const collapsed = isTablet || (isDesktop && desktopCollapsed);

  // ✅ แก้ไข: W คำนวณจากค่าคงที่ที่ export ออกไปด้วย ไม่ใช่ตัวเลขลอย
  const W = isMobile
    ? SIDEBAR_WIDTH_MOBILE
    : collapsed
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH_FULL;

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Commander";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const currentScene = SCENES[activeScene];
  const accent = currentScene?.accentColor || "#00e5c0";

  const isActive = (path: string | null) => !!path && location === path;

  useEffect(() => {
    if (isMobile) onMobileClose?.();
  }, [location]);

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            onClick={onMobileClose}
            style={{
              position: "fixed", inset: 0, zIndex: 44,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
        )}
        <aside style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: W,
          zIndex: 45,
          background: "rgba(5, 8, 14, 0.98)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <SidebarContent
            collapsed={false} accent={accent}
            userInitials={userInitials} userName={userName}
            activeScene={activeScene} onSceneChange={onSceneChange}
            isActive={isActive} navigate={navigate} logout={logout}
            onToggleCollapse={() => onMobileClose?.()} collapseIcon="✕"
          />
        </aside>
      </>
    );
  }

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: W,
      zIndex: 45,
      background: "rgba(5, 8, 14, 0.92)",
      backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
    }}>
      <SidebarContent
        collapsed={collapsed} accent={accent}
        userInitials={userInitials} userName={userName}
        activeScene={activeScene} onSceneChange={onSceneChange}
        isActive={isActive} navigate={navigate} logout={logout}
        onToggleCollapse={isDesktop ? () => setDesktopCollapsed(c => !c) : undefined}
        collapseIcon={desktopCollapsed ? "›" : "‹"}
      />
    </aside>
  );
}

interface ContentProps {
  collapsed: boolean; accent: string;
  userInitials: string; userName: string;
  activeScene: number; onSceneChange: (i: number) => void;
  isActive: (path: string | null) => boolean;
  navigate: (path: string) => void; logout: () => void;
  onToggleCollapse?: () => void; collapseIcon?: string;
}

function AudioToggleButton({ collapsed }: { collapsed: boolean }) {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn(v => !v)}
      title={on ? "ปิดเสียง" : "เปิดเสียง"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        border: `1.5px solid ${on ? "rgba(0,212,170,0.5)" : "rgba(120,140,180,0.25)"}`,
        background: on ? "rgba(0,212,170,0.08)" : "rgba(255,255,255,0.03)",
        color: on ? "#00D4AA" : "rgba(160,190,230,0.35)",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {on ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a7 7 0 0 1 0 9.9M21 4a9.9 9.9 0 0 1 0 14" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}

function SidebarContent({
  collapsed, accent, userInitials, userName,
  activeScene, onSceneChange, isActive, navigate, logout,
  onToggleCollapse, collapseIcon = "‹",
}: ContentProps) {
  const [location] = useLocation();

  return (
    <>
      {/* ── Profile ── */}
      <div style={{
        padding: collapsed ? "18px 10px" : "18px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10, minHeight: 72,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
          border: `1.5px solid ${accent}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: accent,
          fontFamily: "var(--font-mono)", flexShrink: 0,
          boxShadow: `0 0 16px ${accent}35`,
          fontSize: `${(15/13).toFixed(3)}rem`,
          transition: "border-color 0.5s, box-shadow 0.5s",
        }}>
          {userInitials}
        </div>

        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: `${(13/16).toFixed(3)}rem`,
              fontWeight: 600, color: "#e0f0ff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontFamily: "var(--font-body)",
            }}>
              {userName.length > 12 ? userName.slice(0, 12) + "…" : userName}
            </div>
            <div style={{
              fontSize: `${(10/16).toFixed(3)}rem`,
              color: "rgba(160,190,230,0.5)",
              letterSpacing: "0.1em", fontFamily: "var(--font-mono)", marginTop: 2,
            }}>
              Fleet Commander
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button onClick={onToggleCollapse} style={{
            background: "none", border: "none",
            color: "rgba(160,190,230,0.4)",
            cursor: "pointer", padding: "4px",
            fontSize: `${(14/16).toFixed(3)}rem`,
            lineHeight: 1, flexShrink: 0,
            marginLeft: collapsed ? "auto" : 0,
          }}>
            {collapseIcon}
          </button>
        )}
      </div>

      {/* ── Scene Progress ── */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{
            fontSize: `${(9/16).toFixed(3)}rem`,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(160,190,230,0.4)", fontFamily: "var(--font-mono)", marginBottom: 8,
          }}>
            Scene Progress
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {SCENES.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => {
                  if (location !== "/") navigate("/");
                  setTimeout(() => onSceneChange(i), location !== "/" ? 100 : 0);
                }}
                title={scene.slug}
                style={{
                  width: 22, height: 22, borderRadius: 5,
                  border: `1px solid ${i === activeScene ? scene.accentColor : "rgba(255,255,255,0.1)"}`,
                  background: i === activeScene ? `${scene.accentColor}25` : i < activeScene ? "rgba(255,255,255,0.06)" : "transparent",
                  cursor: "pointer",
                  fontSize: `${(8/16).toFixed(3)}rem`,
                  fontFamily: "var(--font-mono)",
                  color: i === activeScene ? scene.accentColor : "rgba(160,190,230,0.35)",
                  fontWeight: 700, transition: "all 0.2s",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{
            marginTop: 8,
            fontSize: `${(11/16).toFixed(3)}rem`,
            fontFamily: "var(--font-mono)", color: accent, letterSpacing: "0.05em",
          }}>
            {SCENES[activeScene]?.slug}{" "}
            <span style={{ opacity: 0.4 }}>· {activeScene + 1}/{SCENES.length}</span>
          </div>
        </div>
      )}

      {/* ── Nav Items ── */}
      <nav style={{
        flex: 1,
        padding: collapsed ? "12px 8px" : "12px 10px",
        display: "flex", flexDirection: "column", gap: 2, overflowY: "auto",
      }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => item.path && navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "10px" : "10px 12px",
                borderRadius: 8, border: "none",
                borderLeft: active ? `2.5px solid ${accent}` : "2.5px solid transparent",
                background: active ? `${accent}18` : "transparent",
                color: active ? accent : "rgba(160,190,230,0.55)",
                fontWeight: active ? 600 : 400,
                cursor: item.path ? "pointer" : "default",
                width: "100%", textAlign: "left",
                transition: "all 0.2s",
                justifyContent: collapsed ? "center" : "flex-start",
                opacity: item.path ? 1 : 0.4,
                fontSize: `${(13/16).toFixed(3)}rem`,
              }}
            >
              <span style={{ fontSize: `${(15/16).toFixed(3)}rem`, flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ fontFamily: "var(--font-body)" }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: collapsed ? "12px 8px" : "12px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {/* ── Audio controls row ── */}
        <div style={{
          display: "flex",
          gap: 60,
          justifyContent: collapsed ? "center" : "flex-start",
          marginBottom: 6,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <AudioToggleButton collapsed={collapsed} />
          {!collapsed && <TTSControlButton />}
        </div>
        {[
          { icon: "❓", label: "Support", action: null },
          { icon: "⎋",  label: "Logout",  action: logout },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => item.action?.()}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 8,
              background: "none", border: "none",
              color: "rgba(160,190,230,0.4)",
              cursor: "pointer",
              padding: collapsed ? "7px" : "6px 4px",
              borderRadius: 5,
              justifyContent: collapsed ? "center" : "flex-start",
              transition: "color 0.2s",
              fontFamily: "var(--font-body)",
              fontSize: `${(20/16).toFixed(3)}rem`,
            }}
            title={collapsed ? item.label : undefined}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </>
  );
}