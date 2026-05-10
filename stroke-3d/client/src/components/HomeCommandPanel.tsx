/*
 * HomeCommandPanel.tsx  — RESPONSIVE VERSION
 *
 * Layout adapts exactly like Flutter's LayoutBuilder:
 *  Mobile  (<640px)  → single-column, full-bleed cards, bottom padding for nav bar
 *  Tablet  (640-1023) → 2-column stats, chart full-width
 *  Desktop (≥1024px)  → original 3-column stats + chart/crew row
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import NearbyBrainHospitals from "@/components/NearbyBrainHospitals";
import PetCompanion from "@/components/PetCompanion";

interface SessionData {
  id: string;
  date: string;
  completed: boolean;
  reps: number;
  score: number;
  accuracy: number;
  rank: string;
}

export default function HomeCommandPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [time, setTime] = useState(new Date());
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) {
      // มั่นใจว่าถ้าไม่มี User ก็จะไม่พัง และแสดงผล Default ได้
      setSessions([]);
      return;
    }
    supabase
      .from("game_sessions")
      .select("id,played_at,completed,reps,score,accuracy,rank")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSessions(data.map((s: any) => ({
          id: s.id,
          date: s.played_at?.slice(0, 10) ?? "—",
          completed: s.completed,
          reps: s.reps ?? 0,
          score: s.score ?? 0,
          accuracy: s.accuracy ?? 0,
          rank: s.rank ?? "—",
        })));
      });
  }, [user]);

  const total = sessions.length;
  const done = sessions.filter(s => s.completed).length;
  const avgAcc = total > 0 ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / total) : 0;
  const totalReps = sessions.reduce((a, s) => a + s.reps, 0);
  const consistency = total > 0 ? Math.round((done / total) * 100) : 0;

  const chartData = [...sessions].reverse().slice(-7).map(s => ({
    date: s.date.slice(5),
    acc: s.accuracy,
    ok: s.completed,
  }));

  const rankColor: Record<string, string> = {
    S: "#ffd700", A: "#00e5c0", B: "#a78bfa", C: "#fb923c", D: "#f87171",
  };

  // Responsive values
  const statsColumns = isMobile ? "1fr 1fr" : isTablet ? "1fr 1fr 1fr" : "repeat(3, 1fr)";
  // On mobile, chart and crew stack vertically; on desktop they're side by side
  const chartCrewColumns = isDesktop ? "1fr 200px" : "1fr";
  // Padding — extra bottom space for mobile nav dots bar
  const paddingBottom = isMobile ? "100px" : "80px";
  const paddingTop = isMobile ? "64px" : "60px";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "fixed",
        inset: 0,
        left: 0,
        zIndex: 15,
        display: "flex",
        pointerEvents: "none",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Main panel content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: `${paddingTop} ${isMobile ? "16px" : isTablet ? "40px" : "60px"} ${paddingBottom} ${isMobile ? "16px" : isTablet ? "40px" : "60px"}`,
          gap: isMobile ? 10 : 16,
          pointerEvents: "auto",
          overflowY: "auto",
          height: "100%",
          // Hide scrollbar visually but allow scroll
          scrollbarWidth: "none",
        }}
      >
        {/* ── Header ── */}
        <div>
          <div style={{
            fontSize: 20, letterSpacing: "0.3em", textTransform: "uppercase",
            color: "rgba(150,170,200,0.5)", fontFamily: "var(--font-mono)",
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
          }}>
            <span style={{ color: "#00e5c0" }}>——</span> Executive Overview
            <span style={{ marginLeft: "auto", color: "rgba(150,170,200,0.35)", fontSize: 20 }}>
              {time.toLocaleTimeString()}
            </span>
          </div>
          <h1 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#e8f4ff",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.1,
          }}>
            Command Center
          </h1>
          {!isMobile && (
            <p style={{
              fontSize: 20,
              color: "rgba(150,175,210,0.65)",
              marginTop: 8,
              fontFamily: "var(--font-body)",
              lineHeight: 1.6,
              maxWidth: 480,
            }}>
              System status is optimal. All rehab sessions are reporting synchronous data streams.
            </p>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: statsColumns, gap: isMobile ? 8 : 10 }}>
          {[
            { label: "ATMOSPHERE",    val: `${avgAcc}%`,       sub: "Avg Accuracy",      color: "#e8f4ff" },
            { label: "INTERNAL TEMP", val: `${consistency}%`,  sub: "Consistency Rate",  color: "#00e5c0" },
            { label: "LUMINESCENCE",  val: `${totalReps}`,     sub: "Total Reps",        color: "#e8f4ff" },
          ].map(m => (
            <div key={m.label} className="hcp-card" style={{
              padding: isMobile ? "10px 12px" : "14px 16px",
            }}>
              <div style={{ fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(150,170,200,0.4)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {m.val}
              </div>
              <div style={{ fontSize: 20, color: "#00e5c0", marginTop: 3, fontFamily: "var(--font-body)" }}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart + Crew row ── */}
        <div style={{ display: "grid", gridTemplateColumns: chartCrewColumns, gap: isMobile ? 8 : 12 }}>

          {/* Chart */}
          <div className="hcp-card" style={{
            padding: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#d8eaff", fontFamily: "var(--font-display)" }}>
                  Mission Trajectory
                </div>
                <div style={{ fontSize: 20, color: "rgba(150,170,200,0.4)", fontFamily: "var(--font-mono)" }}>
                  Real-time vector analysis
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(0,229,192,0.12)",
                border: "1px solid rgba(0,229,192,0.3)",
                borderRadius: 6, padding: "3px 8px",
                fontSize: 20, fontWeight: 700, color: "#00e5c0",
                fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e5c0", display: "inline-block", animation: "cc-pulse 1.5s infinite" }} />
                LIVE
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 80 : 100}>
                <BarChart data={chartData} barGap={3}>
                  <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 20, fill: "rgba(150,170,200,0.35)", fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    contentStyle={{ background: "#080c14", border: "1px solid rgba(0,229,192,0.2)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 20 }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="acc" radius={[3, 3, 0, 0]} name="Accuracy %">
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.ok ? `rgba(0,229,192,${0.4 + i * 0.08})` : `rgba(168,85,247,${0.35 + i * 0.06})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: isMobile ? 80 : 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "rgba(150,170,200,0.3)", fontFamily: "var(--font-mono)" }}>
                No session data yet
              </div>
            )}
          </div>

          {/* Pet Companion — แสดงบน desktop เท่านั้น */}
          {!isMobile && (
            <PetCompanion />
          )}
        </div>

        {/* Mobile: recent sessions as a compact horizontal scroll list */}
        {isMobile && sessions.length > 0 && (
          <div style={{
            background: "rgba(8,12,20,0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#d8eaff", fontFamily: "var(--font-display)" }}>Recent Sessions</div>
              <button onClick={() => navigate("/command")} style={{ background: "none", border: "none", color: "#00e5c0", fontSize: 20, cursor: "pointer", padding: 0 }}>→</button>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} style={{
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${rankColor[s.rank] || "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  textAlign: "center",
                  minWidth: 64,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: rankColor[s.rank] || "#aaa", fontFamily: "var(--font-mono)" }}>{s.rank}</div>
                  <div style={{ fontSize: 20, color: "rgba(150,170,200,0.5)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.date.slice(5)}</div>
                  <div style={{ fontSize: 20, color: "#00e5c0", marginTop: 1 }}>{s.accuracy}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sector 7 Diagnostics ── */}
        <div className="hcp-card" style={{
          padding: isMobile ? "12px 14px" : "14px 20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 10 : 24,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#d8eaff", fontFamily: "var(--font-display)", marginBottom: 4 }}>
              Sector 7 Diagnostics
            </div>
            <div style={{ fontSize: 20, color: "rgba(150,170,200,0.55)", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
              Recovery systems reporting peak filtration cycles. Neural pathways show {Math.max(0, avgAcc - 70)}% bio-performance increase. No anomalies detected.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "ACTIVE SENSORS",  val: total.toString() },
              { label: "SIGNAL STRENGTH", val: avgAcc >= 70 ? "Optimal" : "Low", accent: avgAcc >= 70 ? "#00e5c0" : "#f87171" },
              { label: "LAST SYNC",       val: sessions[0]?.date.slice(5) ?? "—" },
            ].map(stat => (
              <div key={stat.label} className="hcp-card-sm" style={{
                padding: isMobile ? "6px 10px" : "8px 14px",
                textAlign: "center",
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 20, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(150,170,200,0.35)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.accent || "#c8d8f0", fontFamily: "var(--font-display)" }}>
                  {stat.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Nearby Brain Hospitals Map ── */}
        <NearbyBrainHospitals />

      </div>

      <style>{`
        @keyframes cc-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        ::-webkit-scrollbar { display: none; }
        .hcp-card {
          background: rgba(8,12,20,0.65);
          backdrop-filter: blur(12px);
          position: relative;
          clip-path: polygon(
            14px 0%, 100% 0%,
            100% calc(100% - 14px),
            calc(100% - 14px) 100%,
            0% 100%,
            0% 14px
          );
        }
        .hcp-card::before {
          content: '';
          position: absolute;
          inset: 0;
          clip-path: polygon(
            14px 0%, 100% 0%,
            100% calc(100% - 14px),
            calc(100% - 14px) 100%,
            0% 100%,
            0% 14px
          );
          border: 1px solid rgba(255,255,255,0.10);
          pointer-events: none;
        }
        .hcp-card-sm {
          background: rgba(255,255,255,0.04);
          position: relative;
          clip-path: polygon(
            8px 0%, 100% 0%,
            100% calc(100% - 8px),
            calc(100% - 8px) 100%,
            0% 100%,
            0% 8px
          );
        }
        .hcp-card-sm::before {
          content: '';
          position: absolute;
          inset: 0;
          clip-path: polygon(
            8px 0%, 100% 0%,
            100% calc(100% - 8px),
            calc(100% - 8px) 100%,
            0% 100%,
            0% 8px
          );
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
        }
      `}</style>
    </motion.div>
  );
}