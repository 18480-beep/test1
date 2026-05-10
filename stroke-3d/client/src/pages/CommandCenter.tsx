/*
 * CommandCenter.tsx — Readable + Quality Color Edition
 * ✅ ตัวหนังสือทุกจุดผูก var(--text-scale) → กด A+/A− แล้วขยายทั้งหน้า
 * ✅ สีปรับให้ contrast ชัดขึ้น อ่านง่ายขึ้น
 * ✅ ปรับขนาดวิดีโอได้ที่ TOP_VIDEO_HEIGHT / BOTTOM_VIDEO_HEIGHT
 */

const TOP_VIDEO_HEIGHT    = 220;
const BOTTOM_VIDEO_HEIGHT = 200;

import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useRehab } from "@/contexts/RehabContext";
import CompanionDisplay from "@/components/CompanionDisplay";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface SessionData {
  id: string; date: string; completed: boolean;
  timeSpent: number; reps: number; score: number;
  accuracy: number; mode: string; rank: string;
}

/* rem ตาม html { font-size: calc(16px * var(--text-scale)) } — ไม่กระทบ UI layout/map */
const fs = (px: number) => `${(px / 16).toFixed(3)}rem`;

export default function CommandCenter() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { loading: rehabLoading } = useRehab();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("played_at", { ascending: true });

      if (!error && data) {
        setSessions(data.map((s: any) => ({
          id: s.id, date: s.played_at.slice(0, 10),
          completed: s.completed, timeSpent: s.time_sec,
          reps: s.reps, score: s.score,
          accuracy: s.accuracy || (s.reps > 0 ? 80 : 0),
          mode: s.mode || "Standard", rank: s.rank || "D",
        })));
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const totalSessions     = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const avgAccuracy       = totalSessions > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / totalSessions) : 0;
  const totalReps         = sessions.reduce((a, s) => a + s.reps, 0);
  const consistency       = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const chartData = sessions.slice(-7).map((s) => ({
    date: s.date.slice(5),
    accuracy: s.accuracy,
    score: Math.min(100, Math.round(s.score / 1000)),
    completed: s.completed,
  }));

  const userName     = profile?.username || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Commander";
  const userInitials = userName.slice(0, 2).toUpperCase();

  if (loading || rehabLoading) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#080c14",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#00e5c0", fontFamily: "'JetBrains Mono', monospace",
        fontSize: fs(13), letterSpacing: "0.3em",
      }}>
        INITIALIZING COMMAND CENTER...
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh",
      background: "#080c14", color: "#c8d8f0",
      fontFamily: "'IBM Plex Sans', sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, minWidth: 224,
        background: "rgba(5,8,14,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        padding: "22px 0", zIndex: 10,
      }}>
        {/* Profile */}
        <div style={{ padding: "0 20px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "linear-gradient(135deg, #0d2035, #061525)",
              border: "1.5px solid rgba(0,229,192,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: fs(140), fontWeight: 700, color: "#00e5c0",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 0 18px rgba(0,229,192,0.2)",
            }}>
              {userInitials}
            </div>
            <div>
              <div style={{ fontSize: fs(14), fontWeight: 600, color: "#e4f0ff", lineHeight: 1.2 }}>
                {userName.length > 14 ? userName.slice(0, 14) + "…" : userName}
              </div>
              <div style={{
                fontSize: fs(10), color: "rgba(160,190,230,0.5)",
                letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace",
              }}>
                Fleet Commander
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: "⊞", label: "Command Center", key: "command", path: "/command" },
            { icon: "📋", label: "Mission Log",    key: "log",     path: "/"        },
            { icon: "🗺",  label: "Resource Map",   key: "map",     path: null       },
            { icon: "👤", label: "Rehab Tracker",  key: "rehab",   path: "/rehab"   },
            { icon: "⚙️", label: "System Health",  key: "sys",     path: null       },
          ].map((item) => {
            const active = item.path === "/command";
            return (
              <button
                key={item.key}
                onClick={() => item.path && navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "11px 13px", borderRadius: 9, border: "none",
                  borderLeft: active ? "2.5px solid #00e5c0" : "2.5px solid transparent",
                  background: active ? "rgba(0,229,192,0.12)" : "transparent",
                  color: active ? "#00e5c0" : "rgba(160,190,230,0.55)",
                  fontSize: fs(13), fontWeight: active ? 600 : 400,
                  cursor: item.path ? "pointer" : "default",
                  width: "100%", textAlign: "left", transition: "all 0.2s",
                  opacity: item.path ? 1 : 0.45,
                }}
                onMouseEnter={e => { if (item.path && !active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#d4e8ff";
                }}}
                onMouseLeave={e => { if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(160,190,230,0.55)";
                }}}
              >
                <span style={{ fontSize: fs(15) }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Back button */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%", padding: "11px 0",
              background: "linear-gradient(135deg, rgba(0,180,154,0.14), rgba(0,229,192,0.08))",
              border: "1px solid rgba(0,229,192,0.35)",
              borderRadius: 9, color: "#00e5c0",
              fontSize: fs(11), fontWeight: 600, letterSpacing: "0.1em",
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,229,192,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,180,154,0.14), rgba(0,229,192,0.08))"}
          >
            ← BACK TO HOME
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          height: 56, flexShrink: 0,
          background: "rgba(5,8,14,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center",
          padding: "0 28px", gap: 16,
        }}>
          <div style={{ fontSize: fs(13), color: "rgba(160,190,230,0.45)", fontFamily: "'JetBrains Mono', monospace" }}>
            🔍 Search data points...
          </div>
          <div style={{ marginLeft: "auto", fontSize: fs(12), color: "rgba(160,190,230,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>
            {time.toLocaleTimeString()}
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(0,229,192,0.14)",
            border: "1px solid rgba(0,229,192,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: fs(13), color: "#00e5c0", fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{userInitials}</div>
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px" }}>

          {/* ── Hero (Video) ── */}
          <div style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 24, overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
          }}>
            {/* Top video */}
            <div style={{
              position: "relative", height: TOP_VIDEO_HEIGHT, overflow: "hidden",
              background: "linear-gradient(135deg, #090f20, #0b1830)",
              flexShrink: 0,
            }}>
              <video autoPlay loop muted playsInline style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", display: "block",
              }}>
                <source src="/videos/cc-top.mp4" type="video/mp4" />
              </video>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(6,10,18,0.2) 0%, rgba(6,10,18,0.75) 100%)",
                pointerEvents: "none",
              }} />

              {/* Text */}
              <div style={{ position: "absolute", bottom: 26, left: 32, right: 150, zIndex: 2 }}>
                <div style={{
                  fontSize: fs(11), letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(0,229,192,0.8)", marginBottom: 7,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span>——</span> Executive Overview
                </div>
                <h1 style={{
                  fontSize: fs(36), fontWeight: 700, color: "#f0f6ff",
                  margin: "0 0 8px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: "-0.02em",
                  textShadow: "0 2px 24px rgba(0,0,0,0.9)",
                }}>
                  Command Center
                </h1>
                <p style={{
                  fontSize: fs(13), color: "rgba(190,215,255,0.8)",
                  maxWidth: 520, lineHeight: 1.65, margin: 0,
                  textShadow: "0 1px 10px rgba(0,0,0,0.8)",
                }}>
                  System status is optimal. All rehab sessions are reporting synchronous data streams.
                </p>
              </div>

              {/* Stats badge */}
              <div style={{
                position: "absolute", top: 16, right: 20,
                background: "rgba(6,10,18,0.82)",
                border: "1px solid rgba(0,229,192,0.35)",
                borderRadius: 12, padding: "12px 18px",
                textAlign: "center", backdropFilter: "blur(14px)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                zIndex: 2, boxShadow: "0 0 24px rgba(0,229,192,0.12)",
              }}>
                <div style={{
                  fontSize: fs(28), fontWeight: 700, color: "#f0f6ff",
                  fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em",
                }}>
                  {totalReps.toLocaleString()}
                </div>
                <div style={{ fontSize: fs(11), color: "rgba(160,190,230,0.65)" }}>Total Reps</div>
                <div style={{ marginTop: 6, width: "100%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${consistency}%`, background: "linear-gradient(90deg, #ff6b9d, #ff9a8b)", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: fs(10), color: "#ff9a8b", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>
                  {consistency}% EFF
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{
              height: 2, flexShrink: 0,
              background: "linear-gradient(90deg, transparent, rgba(0,229,192,0.55) 30%, rgba(0,229,192,0.55) 70%, transparent)",
            }} />

            {/* Bottom video */}
            <div style={{
              position: "relative", height: BOTTOM_VIDEO_HEIGHT, overflow: "hidden",
              background: "#04070f", flexShrink: 0,
            }}>
              <video autoPlay loop muted playsInline style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", display: "block",
              }}>
                <source src="/videos/cc-bottom.mp4" type="video/mp4" />
              </video>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(6,10,18,0.75) 0%, rgba(6,10,18,0.12) 60%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: "rgba(160,190,230,0.5)",
                fontSize: fs(11), letterSpacing: "0.25em",
                fontFamily: "'JetBrains Mono', monospace", zIndex: 2,
              }}>
                <span>SCROLL TO EXPLORE</span>
                <span style={{ fontSize: fs(15), animation: "bounce 1.8s infinite" }}>↓</span>
              </div>
            </div>
          </div>

          {/* ── Middle Row: Chart + Companion ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>

            {/* Chart Panel */}
            <div style={{
              background: "rgba(8,12,20,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "24px",
              boxShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: fs(16), fontWeight: 600, color: "#ddeeff" }}>Mission Trajectory</div>
                  <div style={{ fontSize: fs(12), color: "rgba(160,190,230,0.45)", marginTop: 3 }}>Real-time vector analysis</div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(0,229,192,0.12)",
                  border: "1px solid rgba(0,229,192,0.3)",
                  borderRadius: 7, padding: "5px 12px",
                  fontSize: fs(11), fontWeight: 700, color: "#00e5c0",
                  letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5c0", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                  LIVE
                </div>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barGap={4}>
                    <XAxis dataKey="date" stroke="rgba(180,190,210,0.15)"
                      tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "rgba(160,190,230,0.5)" }} />
                    <YAxis domain={[0, 100]} stroke="rgba(180,190,210,0.15)"
                      tick={{ fontSize: 10, fill: "rgba(160,190,230,0.4)" }} />
                    <Tooltip contentStyle={{
                      background: "#080c14",
                      border: "1px solid rgba(0,229,192,0.25)",
                      borderRadius: 9, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      color: "#d4e8ff",
                    }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="accuracy" radius={[3, 3, 0, 0]} name="Accuracy %">
                      {chartData.map((entry, i) => (
                        <Cell key={i}
                          fill={entry.completed
                            ? `rgba(0,229,192,${0.35 + (i / chartData.length) * 0.5})`
                            : `rgba(168,85,247,${0.35 + (i / chartData.length) * 0.4})`}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="score" radius={[3, 3, 0, 0]} name="Score" fill="rgba(255,107,157,0.38)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs(13), color: "rgba(160,190,230,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
                  No session data yet
                </div>
              )}
            </div>

            <CompanionDisplay />
          </div>

          {/* ── Metrics Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { label: "ATMOSPHERE",    value: `${avgAccuracy}`,       unit: "%",     sub: "Average Accuracy",     color: "#eef6ff", accent2: "#4d9fff", sub2: "Stable Condition"    },
              { label: "INTERNAL TEMP", value: `${consistency}`,       unit: "%",     sub: "+0.2 Variance",         color: "#00e5c0", accent2: "#00e5c0", sub2: "Consistency Rate"    },
              { label: "LUMINESCENCE",  value: `${completedSessions}`, unit: " done", sub: "Natural Cycle Active",  color: "#eef6ff", accent2: "#a06bff", sub2: "Sessions Completed" },
            ].map((m) => (
              <div key={m.label} style={{
                background: "rgba(8,12,20,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "22px 26px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.3)",
              }}>
                <div style={{
                  fontSize: fs(10), letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(160,190,230,0.45)", marginBottom: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{m.label}</div>
                <div style={{
                  fontSize: fs(36), fontWeight: 700, color: m.color,
                  fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1,
                }}>
                  {m.value}<span style={{ fontSize: fs(15), opacity: 0.65 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: fs(12), color: m.accent2, marginTop: 8, fontWeight: 500 }}>{m.sub2}</div>
                <div style={{ fontSize: fs(11), color: "rgba(160,190,230,0.4)", marginTop: 3 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Diagnostics ── */}
          <div style={{
            background: "rgba(8,12,20,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, overflow: "hidden",
            display: "grid", gridTemplateColumns: "280px 1fr",
            boxShadow: "0 2px 24px rgba(0,0,0,0.3)",
          }}>
            {/* Network visual */}
            <div style={{
              background: "linear-gradient(135deg, #060a12, #091220)",
              position: "relative", minHeight: 200,
              borderRight: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <svg width="280" height="200" style={{ position: "absolute", inset: 0 }}>
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#00e5c0" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00e5c0" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 28} x2="280" y2={i * 28} stroke="rgba(0,229,192,0.07)" strokeWidth="1" />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 31} y1="0" x2={i * 31} y2="200" stroke="rgba(0,229,192,0.07)" strokeWidth="1" />
                ))}
                <path d="M40,100 Q80,60 140,80 Q200,100 240,60"           stroke="#00e5c0" strokeWidth="1.5" fill="none" opacity="0.55" />
                <path d="M20,140 Q70,120 120,130 Q180,145 220,110 Q250,90 270,100" stroke="#00e5c0" strokeWidth="1"   fill="none" opacity="0.35" />
                <path d="M60,170 Q100,150 150,160 Q200,170 250,140"       stroke="#00e5c0" strokeWidth="0.8" fill="none" opacity="0.25" />
                <circle cx="140" cy="80" r="32" fill="url(#glow)" opacity="0.65" />
                <circle cx="140" cy="80" r="6"  fill="rgba(0,229,192,0.85)" />
                <circle cx="140" cy="80" r="11" fill="none" stroke="#00e5c0" strokeWidth="1" opacity="0.45" />
              </svg>
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
                {[0,1,2,3,4].map((i) => (
                  <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? "#00e5c0" : "rgba(255,255,255,0.2)" }} />
                ))}
              </div>
            </div>

            {/* Diagnostics text */}
            <div style={{ padding: "26px 30px" }}>
              <h2 style={{ fontSize: fs(20), fontWeight: 700, color: "#ddeeff", margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>
                Sector 7 Diagnostics
              </h2>
              <p style={{ fontSize: fs(13), color: "rgba(170,200,240,0.7)", lineHeight: 1.75, margin: "0 0 22px" }}>
                Recovery systems reporting peak filtration cycles.
                Neural pathways show {Math.max(0, avgAccuracy - 70)}% bio-performance increase. No anomalies detected.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "ACTIVE SENSORS",  value: totalSessions.toLocaleString(), color: "rgba(180,210,255,0.9)" },
                  { label: "SIGNAL STRENGTH", value: avgAccuracy >= 70 ? "Optimal" : "Low", color: avgAccuracy >= 70 ? "#00e5c0" : "#ff9a8b" },
                  { label: "LAST SYNC",       value: sessions.length > 0 ? sessions[sessions.length - 1].date.slice(5) : "—", color: "rgba(180,210,255,0.9)" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "12px 16px",
                  }}>
                    <div style={{ fontSize: fs(10), letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(160,190,230,0.4)", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: fs(16), fontWeight: 700, color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hospital Map ── */}
          <div style={{ marginTop: 20 }}>
            {/* NearbyBrainHospitals rendered via parent page if needed */}
          </div>

        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #00b89a, #00e5c0)",
          border: "none", color: "#04100e",
          fontSize: fs(22), cursor: "pointer", zIndex: 50,
          boxShadow: "0 0 28px rgba(0,229,192,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        +
      </button>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
      `}</style>
    </div>
  );
}
