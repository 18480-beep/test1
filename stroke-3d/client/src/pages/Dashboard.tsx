/*
 * Dashboard.tsx
 * Patient Progress Dashboard — Surgical Theater / Biopunk aesthetic
 * Real data from Supabase + Mock fallback when empty
 */

import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, AreaChart
} from "recharts";

interface SessionData {
  id: string;
  date: string;
  completed: boolean;
  timeSpent: number;
  reps: number;
  score: number;
  accuracy: number;
  mode: string;
  rank: string;
}

// ── Mock data สำหรับ dev / ยังไม่มี session ──
const MOCK_SESSIONS: SessionData[] = [
  { id: "m1", date: "2026-04-29", completed: true,  timeSpent: 312, reps: 47, score: 84200, accuracy: 91, mode: "Story", rank: "S" },
  { id: "m2", date: "2026-04-30", completed: true,  timeSpent: 278, reps: 39, score: 71500, accuracy: 82, mode: "Story", rank: "A" },
  { id: "m3", date: "2026-05-01", completed: false, timeSpent: 95,  reps: 12, score: 21000, accuracy: 67, mode: "Free",  rank: "C" },
  { id: "m4", date: "2026-05-02", completed: true,  timeSpent: 340, reps: 53, score: 96800, accuracy: 94, mode: "Story", rank: "S" },
  { id: "m5", date: "2026-05-03", completed: true,  timeSpent: 295, reps: 44, score: 79400, accuracy: 88, mode: "Story", rank: "A" },
  { id: "m6", date: "2026-05-04", completed: true,  timeSpent: 360, reps: 58, score: 103200, accuracy: 97, mode: "Story", rank: "S+" },
  { id: "m7", date: "2026-05-05", completed: true,  timeSpent: 330, reps: 51, score: 91600, accuracy: 93, mode: "Free",  rank: "S" },
];

const RANK_COLOR: Record<string, string> = {
  "S+": "#FFD700", S: "#00D4AA", A: "#a78bfa", B: "#38bdf8", C: "#FF6B00", D: "#FF2020",
};

function getRankColor(rank: string) {
  return RANK_COLOR[rank] ?? "#888";
}

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub: string; color: string; icon: string;
}) {
  return (
    <div className="dash-card" style={{ "--accent": color } as React.CSSProperties}>
      <div className="dash-card-icon">{icon}</div>
      <p className="dash-card-label">{label}</p>
      <p className="dash-card-value" style={{ color }}>{value}</p>
      <p className="dash-card-sub">{sub}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,10,20,0.96)",
      border: "1px solid rgba(0,212,170,0.25)",
      borderRadius: 10, padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: 12,
    }}>
      <p style={{ color: "rgba(180,190,200,0.6)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}{p.name === "Accuracy" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) { setSessions(MOCK_SESSIONS); setIsMock(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("played_at", { ascending: true });

      if (!error && data && data.length > 0) {
        setSessions(data.map((s: any) => ({
          id: s.id,
          date: s.played_at.slice(0, 10),
          completed: s.completed,
          timeSpent: s.time_sec,
          reps: s.reps,
          score: s.score,
          accuracy: s.accuracy || (s.reps > 0 ? 80 : 0),
          mode: s.mode || "Standard",
          rank: s.rank || "D",
        })));
        setIsMock(false);
      } else {
        setSessions(MOCK_SESSIONS);
        setIsMock(true);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  // ── สถิติ ──
  const total = sessions.length;
  const done = sessions.filter(s => s.completed).length;
  const consistency = total > 0 ? Math.round((done / total) * 100) : 0;
  const avgAcc = total > 0 ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / total) : 0;
  const totalReps = sessions.reduce((a, s) => a + s.reps, 0);
  const avgScore = total > 0 ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / total) : 0;
  const totalTime = sessions.reduce((a, s) => a + s.timeSpent, 0);
  const bestRank = sessions.reduce((best, s) => {
    const order = ["D","C","B","A","S","S+"];
    return order.indexOf(s.rank) > order.indexOf(best) ? s.rank : best;
  }, "D");
  const streak = sessions.filter(s => s.completed).length; // simplified

  const chartData = sessions.map(s => ({
    date: s.date.slice(5),
    Accuracy: s.accuracy,
    Score: Math.min(100, Math.round(s.score / 1000)),
  }));

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#060810",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid rgba(0,212,170,0.2)",
          borderTop: "2px solid #00D4AA",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(0,212,170,0.6)", letterSpacing: "0.2em" }}>
          LOADING DATA...
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root {
          --teal: #00D4AA;
          --orange: #FF6B00;
          --purple: #a78bfa;
          --blue: #38bdf8;
          --gold: #FFD700;
          --bg: #060810;
          --surface: rgba(10,14,28,0.85);
          --border: rgba(0,212,170,0.12);
          --text: #C8D8E8;
          --muted: rgba(150,165,185,0.45);
        }

        .dash-wrap {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* grid background */
        .dash-wrap::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,212,170,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,170,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* glow top-left */
        .dash-wrap::after {
          content: '';
          position: fixed; top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .dash-inner {
          position: relative; z-index: 1;
          max-width: 1100px; margin: 0 auto;
          padding: 32px 24px 80px;
        }

        /* ── Header ── */
        .dash-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 36px;
          gap: 16px;
        }
        .dash-logo-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .dash-logo-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--teal);
          box-shadow: 0 0 12px var(--teal);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .dash-eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 10px; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--teal);
          opacity: 0.7;
        }
        .dash-username {
          font-family: var(--font-display, 'Orbitron', sans-serif);
          font-size: 28px; font-weight: 800;
          color: #E8F4FF; line-height: 1.1;
          margin-bottom: 6px;
        }
        .dash-meta {
          display: flex; gap: 12px; font-family: var(--font-mono, monospace);
          font-size: 11px; color: var(--muted);
        }
        .dash-meta-sep { opacity: 0.3; }

        .dash-back-btn {
          flex-shrink: 0;
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 8px; cursor: pointer;
          font-family: var(--font-mono, monospace); font-size: 11px;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--teal); background: rgba(0,212,170,0.06);
          border: 1px solid rgba(0,212,170,0.2);
          transition: all 0.2s;
        }
        .dash-back-btn:hover {
          background: rgba(0,212,170,0.12);
          border-color: rgba(0,212,170,0.4);
        }

        /* ── Mock badge ── */
        .mock-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px; margin-bottom: 28px;
          font-family: var(--font-mono, monospace); font-size: 11px;
          color: #fbbf24; letter-spacing: 0.1em;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
        }

        /* ── Stat Cards ── */
        .dash-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 28px;
        }
        .dash-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 20px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, transform 0.2s;
          backdrop-filter: blur(12px);
        }
        .dash-card:hover {
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
          transform: translateY(-2px);
        }
        .dash-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.6;
        }
        .dash-card-icon {
          font-size: 20px; margin-bottom: 10px;
        }
        .dash-card-label {
          font-family: var(--font-mono, monospace);
          font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 6px;
        }
        .dash-card-value {
          font-family: 'Orbitron', var(--font-display, sans-serif);
          font-size: 26px; font-weight: 800;
          line-height: 1; margin-bottom: 4px;
        }
        .dash-card-sub {
          font-family: var(--font-mono, monospace);
          font-size: 10px; color: var(--muted);
        }

        /* ── Panel ── */
        .dash-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 24px;
          margin-bottom: 20px;
          backdrop-filter: blur(12px);
        }
        .dash-panel-title {
          font-family: var(--font-mono, monospace);
          font-size: 10px; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .dash-panel-title::after {
          content: ''; flex: 1; height: 1px;
          background: var(--border);
        }

        /* ── Calendar ── */
        .dash-calendar {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .cal-day {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
        }
        .cal-cell {
          width: 38px; height: 38px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono, monospace);
          font-size: 12px; font-weight: 700;
          border: 1px solid; transition: transform 0.15s;
          cursor: default;
        }
        .cal-cell:hover { transform: scale(1.1); }
        .cal-cell.done {
          background: rgba(0,212,170,0.12);
          border-color: rgba(0,212,170,0.35);
          color: var(--teal);
        }
        .cal-cell.skip {
          background: rgba(255,32,32,0.08);
          border-color: rgba(255,32,32,0.2);
          color: rgba(255,80,80,0.7);
        }
        .cal-rank {
          font-family: var(--font-mono, monospace);
          font-size: 9px; letter-spacing: 0.05em;
        }

        /* ── Two-col grid ── */
        .dash-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px; margin-bottom: 20px;
        }
        @media (max-width: 700px) {
          .dash-grid-2 { grid-template-columns: 1fr; }
          .dash-username { font-size: 20px; }
          .dash-card-value { font-size: 20px; }
        }

        /* ── No data ── */
        .dash-empty {
          text-align: center; padding: 40px 20px;
          font-family: var(--font-mono, monospace);
          font-size: 12px; color: var(--muted);
          letter-spacing: 0.1em;
        }
      `}</style>

      <div className="dash-wrap">
        <div className="dash-inner">

          {/* ── Header ── */}
          <div className="dash-header">
            <div>
              <div className="dash-logo-row">
                <div className="dash-logo-dot" />
                <span className="dash-eyebrow">Patient Dashboard</span>
              </div>
              <div className="dash-username">
                {profile?.username || "Guest Patient"}
              </div>
              <div className="dash-meta">
                <span>ID: {user?.id?.slice(0, 8) ?? "——"}</span>
                <span className="dash-meta-sep">·</span>
                <span>Active Recovery</span>
                <span className="dash-meta-sep">·</span>
                <span>{total} เกม</span>
              </div>
            </div>
            <button className="dash-back-btn" onClick={() => navigate("/")}>
              ← กลับ
            </button>
          </div>

          {/* Mock badge */}
          {isMock && (
            <div className="mock-badge">
              ⚠️ DEMO MODE — ข้อมูลจำลอง (เล่นเกมก่อนแล้วกลับมาดูข้อมูลจริง)
            </div>
          )}

          {/* ── Summary Cards ── */}
          <div className="dash-cards">
            <StatCard label="Consistency" value={`${consistency}%`} sub={`${done}/${total} sessions`} color="var(--teal)" icon="🎯" />
            <StatCard label="Avg Accuracy" value={`${avgAcc}%`} sub="Overall Performance" color="#a78bfa" icon="🎱" />
            <StatCard label="Total Hits" value={totalReps.toLocaleString()} sub="Total Reps" color="var(--blue)" icon="⚡" />
            <StatCard label="Best Rank" value={bestRank} sub="Personal Best" color={getRankColor(bestRank)} icon="🏆" />
            <StatCard label="Avg Score" value={`${(avgScore / 1000).toFixed(1)}K`} sub="Points / Session" color="var(--orange)" icon="📈" />
            <StatCard label="Total Time" value={`${Math.floor(totalTime / 60)}m`} sub={`${totalTime % 60}s รวม`} color="#fbbf24" icon="⏱️" />
          </div>

          {/* ── Calendar + Chart ── */}
          <div className="dash-grid-2">

            {/* Calendar */}
            <div className="dash-panel">
              <div className="dash-panel-title">Training Calendar</div>
              <div className="dash-calendar">
                {sessions.map(s => (
                  <div key={s.id} className="cal-day">
                    <div className={`cal-cell ${s.completed ? "done" : "skip"}`}>
                      {s.date.slice(8)}
                    </div>
                    <span className="cal-rank" style={{ color: getRankColor(s.rank) }}>
                      {s.completed ? s.rank : "✗"}
                    </span>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="dash-empty">ยังไม่มีข้อมูล — เล่นเกมก่อนนะ</div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="dash-panel">
              <div className="dash-panel-title">Accuracy + Score Trend</div>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" stroke="rgba(150,165,185,0.3)"
                        tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }} />
                      <YAxis domain={[0, 100]} stroke="rgba(150,165,185,0.3)"
                        tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Accuracy" stroke="#00D4AA" strokeWidth={2}
                        fill="url(#gradAcc)" dot={{ fill: "#00D4AA", r: 3 }} />
                      <Area type="monotone" dataKey="Score" stroke="#FF6B00" strokeWidth={2}
                        fill="url(#gradScore)" dot={{ fill: "#FF6B00", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
                    {[{ c: "#00D4AA", l: "Accuracy %" }, { c: "#FF6B00", l: "Score (scaled)" }].map(x => (
                      <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 16, height: 2, background: x.c, borderRadius: 2 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dash-empty">ยังไม่มีข้อมูล — เล่นเกมก่อนนะ</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
