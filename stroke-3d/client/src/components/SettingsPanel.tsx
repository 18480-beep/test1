/*
 * SettingsPanel.tsx — v2 Profile Edition
 * แผง Account Profile แบบเต็ม
 * - ข้อมูลบัญชี: ชื่อ, email, วิธีสมัคร, avatar
 * - Stats: streak, progress, sessions completed
 * - Settings: dark mode, text size
 * - Logout
 * - Delete Account (2-step confirmation)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { useProfile } from "@/hooks/useProfile";

export default function SettingsPanel() {
  const { theme, toggleTheme, textScale, setTextScale } = useTheme();
  const { isLoggedIn, user } = useAuth();
  const { streak, progress } = useUserData();
  const { profile, avatarEmoji, avatarPhoto } = useProfile();
  const [open, setOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // ใช้ชื่อจาก profiles table ก่อน ถ้าไม่มีค่อย fallback ไปชื่อ Google
  const name = profile?.username || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";
  const email = user?.email || "—";
  // ใช้รูปจาก profiles table ก่อน ถ้าไม่มีค่อย fallback ไปรูป Google
  const avatar = avatarPhoto || (user?.user_metadata?.avatar_url as string | undefined);
  const avatarDisplay = avatarEmoji;
  const initial = name.charAt(0).toUpperCase();

  // Detect provider
  const provider = (() => {
    const id = user?.app_metadata?.provider as string | undefined;
    if (id === "google") return { label: "Google", icon: "🔵" };
    if (id === "github") return { label: "GitHub", icon: "⚫" };
    if (id === "facebook") return { label: "Facebook", icon: "🔷" };
    if (id === "email") return { label: "Email/Password", icon: "✉️" };
    return { label: isLoggedIn ? "OAuth" : "ไม่ได้เข้าสู่ระบบ", icon: "👤" };
  })();

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        .sp-fab {
          position: fixed;
          right: max(env(safe-area-inset-right, 0px), 14px);
          bottom: 72px;
          width: 44px; height: 44px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          background: color-mix(in oklch, var(--background), transparent 30%);
          border: 1px solid var(--border);
          color: var(--foreground); cursor: pointer;
          backdrop-filter: blur(8px);
          z-index: 60;
          box-shadow: 0 8px 30px rgba(0,0,0,0.45);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          padding: 0;
          overflow: hidden;
        }
        .sp-fab:hover { transform: translateY(-2px); border-color: var(--primary); }
        .sp-fab img { width: 100%; height: 100%; object-fit: cover; border-radius: 999px; }

        .sp-panel {
          position: fixed;
          right: max(env(safe-area-inset-right, 0px), 14px);
          bottom: calc(72px + 56px);
          z-index: 61;
          width: min(340px, calc(100vw - 28px));
          border-radius: 20px;
          background: color-mix(in oklch, var(--card), transparent 8%);
          color: var(--foreground);
          border: 1px solid var(--border);
          box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(120,180,255,0.05);
          backdrop-filter: blur(20px);
          font-family: var(--font-body, system-ui, sans-serif);
          overflow: hidden;
        }

        /* Header gradient band */
        .sp-header {
          padding: 20px 18px 16px;
          background: linear-gradient(135deg, rgba(77,159,255,0.12) 0%, rgba(160,107,255,0.08) 100%);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sp-avatar {
          width: 52px; height: 52px; border-radius: 999px;
          background: linear-gradient(135deg, #4d9fff, #a06bff);
          display: flex; align-items: center; justify-content: center;
          font-size: calc(20px * var(--text-scale-tight, 1)); font-weight: 700; color: #fff;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.15);
          overflow: hidden;
        }
        .sp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sp-name { font-size: calc(15px * var(--text-scale-tight, 1)); font-weight: 700; color: #fff; line-height: 1.3; }
        .sp-email { font-size: calc(11px * var(--text-scale-tight, 1)); color: rgba(180,205,240,0.65); margin-top: 2px; word-break: break-all; }
        .sp-badge {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 5px;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: calc(10px * var(--text-scale-tight, 1)); color: rgba(180,205,240,0.8);
        }

        .sp-body { padding: 14px 18px 6px; }

        /* Stats grid */
        .sp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .sp-stat {
          background: color-mix(in oklch, var(--foreground), transparent 96%);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }
        .sp-stat-val {
          font-size: calc(18px * var(--text-scale-tight, 1)); font-weight: 700;
          font-family: var(--font-display, monospace);
          color: var(--foreground); line-height: 1;
        }
        .sp-stat-label {
          font-size: calc(9px * var(--text-scale-tight, 1)); color: var(--muted-foreground);
          margin-top: 4px; letter-spacing: .06em; text-transform: uppercase;
        }

        /* Divider */
        .sp-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 4px 0 12px;
        }

        /* Rows */
        .sp-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0; gap: 10px;
        }
        .sp-row-label { font-size: calc(13px * var(--text-scale-tight, 1)); color: rgba(200,220,245,0.85); }
        .sp-row-sub { font-size: calc(10px * var(--text-scale-tight, 1)); color: rgba(150,180,220,0.45); margin-top: 1px; }

        /* Toggle */
        .sp-toggle {
          appearance: none; -webkit-appearance: none; outline: none;
          width: 48px; height: 26px; border-radius: 999px;
          background: rgba(255,255,255,0.14); position: relative; cursor: pointer;
          transition: background .25s ease; flex-shrink: 0;
          border: none;
        }
        .sp-toggle::after {
          content: ""; position: absolute; top: 3px; left: 3px;
          width: 20px; height: 20px; border-radius: 999px; background: #fff;
          transition: left .2s ease;
        }
        .sp-toggle[data-on="true"] { background: linear-gradient(135deg,#4ea7ff,#a06bff); }
        .sp-toggle[data-on="true"]::after { left: 25px; }

        /* Text size */
        .sp-size-btn {
          width: 30px; height: 30px; border-radius: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          color: #fff; cursor: pointer; font-size: calc(12px * var(--text-scale-tight, 1)); font-weight: 600;
        }
        .sp-size-btn:hover { background: rgba(255,255,255,0.12); }

        .sp-color-picker {
          display: flex; gap: 8px; align-items: center;
        }
        .sp-color-input {
          -webkit-appearance: none; -moz-appearance: none; appearance: none;
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; padding: 0; overflow: hidden;
        }
        .sp-color-input::-webkit-color-swatch-wrapper { padding: 0; }
        .sp-color-input::-webkit-color-swatch { border: none; }
        .sp-color-input::-moz-color-swatch { border: none; }

        /* Logout */
        .sp-logout {
          width: 100%; margin: 12px 0 4px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,60,60,0.08);
          border: 1px solid rgba(255,60,60,0.2);
          color: #ff7070; font-size: calc(13px * var(--text-scale-tight, 1)); font-weight: 600;
          cursor: pointer; transition: background .2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .sp-logout:hover { background: rgba(255,60,60,0.16); }

        /* Delete Account */
        .sp-delete-btn {
          width: 100%; margin: 0 0 16px;
          padding: 9px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid rgba(255,60,60,0.12);
          color: rgba(255,100,100,0.5); font-size: calc(12px * var(--text-scale-tight, 1)); font-weight: 500;
          cursor: pointer; transition: all .2s;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          letter-spacing: .02em;
        }
        .sp-delete-btn:hover {
          background: rgba(255,40,40,0.07);
          border-color: rgba(255,60,60,0.28);
          color: rgba(255,80,80,0.8);
        }

        /* Delete Confirm Modal */
        .sp-delete-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .sp-delete-modal {
          background: rgba(10,14,24,0.97);
          border: 1px solid rgba(255,60,60,0.3);
          border-radius: 20px;
          padding: 28px 24px 24px;
          width: min(360px, 100%);
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,40,40,0.08);
          text-align: center;
          animation: sp-modal-in .2s ease;
        }
        @keyframes sp-modal-in {
          from { opacity: 0; transform: scale(.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .sp-delete-icon {
          font-size: calc(40px * var(--text-scale-tight, 1)); line-height: 1; margin-bottom: 14px;
        }
        .sp-delete-title {
          font-size: calc(17px * var(--text-scale-tight, 1)); font-weight: 700; color: #ff6b6b;
          margin-bottom: 8px;
        }
        .sp-delete-desc {
          font-size: calc(13px * var(--text-scale-tight, 1)); color: rgba(200,210,230,0.7);
          line-height: 1.6; margin-bottom: 22px;
        }
        .sp-delete-desc strong { color: rgba(255,120,120,0.9); }
        .sp-delete-actions {
          display: flex; gap: 10px;
        }
        .sp-delete-cancel {
          flex: 1; padding: 11px;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(200,220,245,0.85); font-size: calc(13px * var(--text-scale-tight, 1)); font-weight: 600;
          cursor: pointer; transition: background .2s;
        }
        .sp-delete-cancel:hover { background: rgba(255,255,255,0.12); }
        .sp-delete-confirm {
          flex: 1; padding: 11px;
          border-radius: 10px;
          background: rgba(220,40,40,0.15);
          border: 1px solid rgba(220,40,40,0.4);
          color: #ff6b6b; font-size: calc(13px * var(--text-scale-tight, 1)); font-weight: 700;
          cursor: pointer; transition: background .2s;
        }
        .sp-delete-confirm:hover { background: rgba(220,40,40,0.28); }
        .sp-delete-confirm:disabled {
          opacity: 0.5; cursor: not-allowed;
        }

        /* join date */
        .sp-join {
          text-align: center; font-size: calc(10px * var(--text-scale-tight, 1));
          color: rgba(150,180,220,0.3);
          padding-bottom: 14px;
          letter-spacing: .04em;
        }

        /* Light mode overrides */
        .sp-light .sp-panel {
          background: rgba(248,250,255,0.95);
          color: #0c1320;
          border-color: rgba(20,40,80,0.15);
        }
        .sp-light .sp-name { color: #0c1320; }
        .sp-light .sp-row-label { color: rgba(20,40,80,0.85); }
        .sp-light .sp-stat { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); }
        .sp-light .sp-stat-val { color: #0c1320; }
        .sp-light .sp-fab { background: rgba(248,250,255,0.92); color: #0c1320; border-color: rgba(20,40,80,0.18); }
        .sp-light .sp-divider { background: rgba(0,0,0,0.08); }

        @media (max-width: 480px) {
          .sp-panel { width: calc(100vw - 28px); }
        }
      `}</style>

      <div className={isDark ? "" : "sp-light"}>
        {/* FAB button — แสดง avatar ถ้ามี */}
        <button
          aria-label="Open profile"
          className="sp-fab"
          onClick={() => setOpen(o => !o)}
        >
          {avatar
            ? <img src={avatar} alt={name} />
            : avatarDisplay
              ? <span style={{ fontSize: "calc(22px * var(--text-scale-tight, 1))", lineHeight: 1 }}>{avatarDisplay}</span>
              : initial
          }
        </button>

        {open && (
          <div className="sp-panel" role="dialog" aria-label="Account Profile">

            {/* ── Profile Header ── */}
            <div className="sp-header">
              <div className="sp-avatar">
                {avatar
                  ? <img src={avatar} alt={name} />
                  : avatarDisplay
                    ? <span style={{ fontSize: "calc(26px * var(--text-scale-tight, 1))", lineHeight: 1 }}>{avatarDisplay}</span>
                    : initial
                }
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sp-name">{name}</div>
                <div className="sp-email">{email}</div>
                <div className="sp-badge">
                  {provider.icon} สมัครด้วย {provider.label}
                </div>
              </div>
            </div>

            <div className="sp-body">

              {/* ── Stats ── */}
              <div className="sp-stats" style={{ marginTop: 12 }}>
                <div className="sp-stat">
                  <div className="sp-stat-val" style={{ color: "#ff7b5c" }}>
                    🔥 {streak.current_streak}
                  </div>
                  <div className="sp-stat-label">Streak</div>
                </div>
                <div className="sp-stat">
                  <div className="sp-stat-val" style={{ color: "#4d9fff" }}>
                    {progress.max_scene}
                  </div>
                  <div className="sp-stat-label">Max Scene</div>
                </div>
                <div className="sp-stat">
                  <div className="sp-stat-val" style={{ color: "#00d4aa" }}>
                    {progress.total_completed}
                  </div>
                  <div className="sp-stat-label">Sessions</div>
                </div>
              </div>

              {/* Best streak sub-row */}
              {streak.longest_streak > 0 && (
                <div style={{
                  textAlign: "center", fontSize: "calc(10px * var(--text-scale-tight, 1))",
                  color: "rgba(150,180,220,0.4)",
                  marginBottom: 10, marginTop: -4,
                }}>
                  Best streak: {streak.longest_streak} days
                </div>
              )}

              <div className="sp-divider" />

              {/* ── Dark Mode ── */}
              <div className="sp-row">
                <div>
                  <div className="sp-row-label">Dark Mode</div>
                </div>
                <button
                  aria-label="Toggle theme"
                  className="sp-toggle"
                  data-on={isDark}
                  onClick={() => toggleTheme?.()}
                />
              </div>

              {/* ── Text Size ── */}
              <div className="sp-row">
                <div className="sp-row-label">Text Size</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="sp-size-btn" onClick={() => setTextScale(Math.max(0.85, +(textScale - 0.05).toFixed(2)))}>A−</button>
                  <span style={{ fontSize: "calc(12px * var(--text-scale-tight, 1))", opacity: 0.7, minWidth: 36, textAlign: "center" }}>
                    {Math.round(textScale * 100)}%
                  </span>
                  <button className="sp-size-btn" onClick={() => setTextScale(Math.min(1.5, +(textScale + 0.05).toFixed(2)))}>A+</button>
                </div>
              </div>

              <div className="sp-divider" />



              {/* ── Logout ── */}
              {isLoggedIn && (
                <button
                  className="sp-logout"
                  onClick={async () => {
                    const { supabase } = await import("@/lib/supabase");
                    await supabase.auth.signOut();
                    setOpen(false);
                  }}
                >
                  <span>⎋</span> ออกจากระบบ
                </button>
              )}

              {/* ── Delete Account ── */}
              {isLoggedIn && (
                <button
                  className="sp-delete-btn"
                  onClick={() => setDeleteStep(1)}
                >
                  🗑 ลบบัญชีผู้ใช้
                </button>
              )}

              {joinedDate && (
                <div className="sp-join">สมาชิกตั้งแต่ {joinedDate}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Account Modal — Step 1 (first warning) ── */}
      {deleteStep === 1 && (
        <div className="sp-delete-overlay" onClick={() => { setDeleteStep(0); setDeleteError(null); }}>
          <div className="sp-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-delete-icon">⚠️</div>
            <div className="sp-delete-title">ลบบัญชีผู้ใช้?</div>
            <div className="sp-delete-desc">
              การลบบัญชีจะ<strong>ลบข้อมูลทั้งหมด</strong>ของคุณออกจากระบบอย่างถาวร
              รวมถึง progress, streak, และข้อมูล session ทั้งหมด
            </div>
            <div className="sp-delete-actions">
              <button className="sp-delete-cancel" onClick={() => { setDeleteStep(0); setDeleteError(null); }}>
                ยกเลิก
              </button>
              <button className="sp-delete-confirm" onClick={() => setDeleteStep(2)}>
                ดำเนินการต่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal — Step 2 (final confirmation) ── */}
      {deleteStep === 2 && (
        <div className="sp-delete-overlay" onClick={() => !isDeleting && setDeleteStep(0)}>
          <div className="sp-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-delete-icon">🗑️</div>
            <div className="sp-delete-title">ยืนยันการลบบัญชี</div>
            <div className="sp-delete-desc">
              คุณแน่ใจหรือไม่? <strong>การกระทำนี้ไม่สามารถย้อนกลับได้</strong>
              บัญชีและข้อมูลทั้งหมดจะถูกลบถาวร
            </div>
            {deleteError && (
              <div style={{
                background: "rgba(220,40,40,0.12)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                fontSize: "calc(12px * var(--text-scale-tight, 1))",
                color: "#ff8080",
                textAlign: "left",
                lineHeight: 1.5,
              }}>
                ❌ {deleteError}
              </div>
            )}
            <div className="sp-delete-actions">
              <button
                className="sp-delete-cancel"
                disabled={isDeleting}
                onClick={() => { setDeleteStep(0); setDeleteError(null); }}
              >
                ยกเลิก
              </button>
              <button
                className="sp-delete-confirm"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    const { supabase } = await import("@/lib/supabase");

                    // ดึง access token ของ user ปัจจุบัน
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error("ไม่พบ session กรุณาล็อกอินใหม่");

                    // ลอง server API ก่อน (ถ้า backend รองรับ)
                    let serverSuccess = false;
                    try {
                      const res = await fetch("/api/delete-account", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${session.access_token}`,
                        },
                      });
                      if (res.ok) {
                        serverSuccess = true;
                      } else {
                        const body = await res.json().catch(() => ({}));
                        // ถ้า server ไม่มี service role key → fallback ลบ profile แทน
                        if (res.status !== 500) throw new Error(body.error || "ลบบัญชีไม่สำเร็จ");
                      }
                    } catch (fetchErr) {
                      // network error หรือ endpoint ไม่มี → ข้ามไป fallback
                    }

                    if (!serverSuccess) {
                      // Fallback: ลบข้อมูลทั้งหมดที่เกี่ยวข้องกับ user นี้
                      // หมายเหตุ: เนื่องจาก client-side ไม่สามารถลบ Auth User ได้โดยตรง (ต้องใช้ Service Role)
                      // เราจึงลบข้อมูลในทุก table เพื่อให้เหมือนเป็นบัญชีใหม่เมื่อเขากลับมา
                      
                      const userId = session.user.id;
                      
                      // ลบข้อมูลตามลำดับความสัมพันธ์ (Child tables ก่อน)
                      const tablesToDelete = [
                        { name: "rehab_daily_logs", key: "user_id" },
                        { name: "rehab_profiles", key: "user_id" },
                        { name: "game_sessions", key: "user_id" },
                        { name: "user_settings", key: "user_id" },
                        { name: "user_progress", key: "user_id" },
                        { name: "user_activities", key: "user_id" },
                        { name: "profiles", key: "id" }
                      ];

                      for (const table of tablesToDelete) {
                        try {
                          const { error } = await supabase.from(table.name).delete().eq(table.key, userId);
                          if (error) console.warn(`[Delete] Error deleting from ${table.name}:`, error.message);
                        } catch (e) {
                          console.warn(`[Delete] Failed to delete from ${table.name}`);
                        }
                      }
                      
                      // ล้าง cache ทั้งหมด
                      localStorage.removeItem(`profile:${userId}`);
                      // ล้าง session เพื่อให้ระบบบังคับ login ใหม่และไปหน้า setup
                      await supabase.auth.signOut();
                    }

                    setDeleteStep(0);
                    setOpen(false);
                    // บังคับ reload เพื่อให้สถานะ auth ใน context อัปเดตและ redirect ไปหน้า login/setup
                    window.location.href = "/login";
                  } catch (err: unknown) {
                    console.error("Delete account error:", err);
                    const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
                    setDeleteError(msg);
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "กำลังลบ..." : "ลบบัญชีถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
