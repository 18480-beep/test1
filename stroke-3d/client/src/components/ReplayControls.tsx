/*
 * ReplayControls.tsx — แก้ไขใหม่ทั้งหมด
 * ใช้ GameSession type และ field ตรงกับ supabase.ts จริงๆ
 * ไม่มั่วข้อมูล: query จาก game_sessions ด้วย field ที่มีจริงใน DB
 *
 * แก้ไขใน: stroke-3d-upgraded/stroke-3d/client/src/components/ReplayControls.tsx
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, getDailySummaries, type GameSession, type DailySummary } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ReplayControlsProps {
  visible: boolean;
  onReplay: () => void;
  onGoToScene: (scene: number) => void;
}

const ACCENT_COLORS = ["#00D4AA", "#4F8EF7", "#FF6B00", "#C084FC", "#F472B6"];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function qualityColor(q: string) {
  if (q === "excellent") return "#00D4AA";
  if (q === "good")      return "#4F8EF7";
  if (q === "normal")    return "#FF6B00";
  return "#FF2020";
}

function qualityLabel(q: string) {
  if (q === "excellent") return "ดีเยี่ยม";
  if (q === "good")      return "ดี";
  if (q === "normal")    return "ปกติ";
  return "ต้องปรับปรุง";
}

function accColor(v: number) {
  return v >= 80 ? "#00D4AA" : v >= 60 ? "#FF6B00" : "#FF2020";
}

// ── Chart: วาด accuracy + score 7 sessions ล่าสุด ──────────────────────────
function drawChart(
  canvas: HTMLCanvasElement,
  accent: string,
  dark: boolean,
  sessions: GameSession[]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (sessions.length === 0) {
    ctx.fillStyle = dark ? "rgba(180,190,200,0.3)" : "#aaa";
    ctx.font = "12px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("ยังไม่มีข้อมูล — เล่นเกมเพื่อดูกราฟ", W / 2, H / 2);
    ctx.textAlign = "left";
    return;
  }

  // เรียงจากเก่า → ใหม่ เอา 7 รายการล่าสุด
  const sorted = [...sessions]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-7);

  const labels = sorted.map((s) => s.created_at.slice(5, 10));
  const accData = sorted.map((s) => Math.round(s.accuracy));
  const scoreData = sorted.map((s) => Math.min(100, Math.round(s.score / 1000)));

  const pad = { top: 14, right: 12, bottom: 30, left: 34 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  function xPos(i: number) {
    return pad.left + (i / Math.max(sorted.length - 1, 1)) * cW;
  }
  function yPos(v: number) {
    return pad.top + (1 - v / 100) * cH;
  }

  const gridC = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tickC = dark ? "rgba(180,190,200,0.4)" : "#aaa";
  ctx.font = "9px 'Space Mono', monospace";

  for (let v = 0; v <= 100; v += 25) {
    const y = yPos(v);
    ctx.strokeStyle = gridC;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = tickC;
    ctx.fillText(String(v), 0, y + 3);
  }

  labels.forEach((lbl, i) => {
    ctx.fillStyle = tickC;
    ctx.fillText(lbl, xPos(i) - 14, H - 6);
  });

  function drawLine(data: number[], color: string, dashed: boolean) {
    if (data.length < 2) return;
    ctx!.strokeStyle = color;
    ctx!.lineWidth = 2;
    ctx!.setLineDash(dashed ? [5, 3] : []);
    ctx!.beginPath();
    data.forEach((v, i) => {
      i === 0 ? ctx!.moveTo(xPos(i), yPos(v)) : ctx!.lineTo(xPos(i), yPos(v));
    });
    ctx!.stroke();
    ctx!.setLineDash([]);
    ctx!.fillStyle = color;
    data.forEach((v, i) => {
      ctx!.beginPath();
      ctx!.arc(xPos(i), yPos(v), 3.5, 0, Math.PI * 2);
      ctx!.fill();
    });
  }

  drawLine(accData, accent, false);
  drawLine(scoreData, "#FF6B00", true);
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ReplayControls({ visible, onReplay, onGoToScene }: ReplayControlsProps) {
  const { user } = useAuth();
  const [accent, setAccent]           = useState("#00D4AA");
  const [brightness, setBrightness]   = useState(100);
  const [reportOpen, setReportOpen]   = useState(false);
  const [sessions, setSessions]       = useState<GameSession[]>([]);
  const [summaries, setSummaries]     = useState<DailySummary[]>([]);
  const [loading, setLoading]         = useState(false);

  const dashCanvasRef = useRef<HTMLCanvasElement>(null);
  const rptCanvasRef  = useRef<HTMLCanvasElement>(null);

  // ── โหลดข้อมูลจริงจาก Supabase ด้วย field ที่ถูกต้อง ─────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // game_sessions: ใช้ field ตาม GameSession type ใน supabase.ts
      const { data: sessData, error: sessErr } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!sessErr && sessData) setSessions(sessData as GameSession[]);

      // daily_summaries: ใช้ getDailySummaries helper จาก supabase.ts
      const sumData = await getDailySummaries(user.id, 30);
      setSummaries(sumData);
    } catch (err) {
      console.warn("[ReplayControls] loadData failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  useEffect(() => {
    const canvas = dashCanvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth || 400;
    canvas.height = 150;
    drawChart(canvas, accent, true, sessions);
  }, [accent, sessions]);

  useEffect(() => {
    if (!reportOpen) return;
    setTimeout(() => {
      const canvas = rptCanvasRef.current;
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth || 400;
      canvas.height = 160;
      drawChart(canvas, accent, false, sessions);
    }, 100);
  }, [reportOpen, accent, sessions]);

  // ── คำนวณ KPI จาก field จริงของ GameSession ──────────────────────────────
  const total       = sessions.length;
  const done        = sessions.filter((s) => s.completed).length;
  const consistency = total > 0 ? Math.round((done / total) * 100) : 0;
  const avgAcc      = total > 0
    ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / total)
    : 0;
  const avgScore    = total > 0
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / total / 1000)
    : 0;
  const avgDur      = total > 0
    ? Math.round(sessions.reduce((a, s) => a + s.duration_sec, 0) / total)
    : 0;
  const totalHits   = sessions.reduce((a, s) => a + s.hit_count, 0);
  const avgResp     = total > 0
    ? Math.round(sessions.reduce((a, s) => a + s.responsiveness, 0) / total)
    : 0;

  // left/right arm quality จาก session ล่าสุด
  const latestSession = sessions[0] ?? null;

  // Export CSV ใช้ field จริง
  function exportCSV() {
    const rows = [
      ["Date", "Game Type", "Status", "Score", "Accuracy%", "Duration(s)",
       "Hits", "Miss", "Combo", "Left Score", "Right Score", "Responsiveness%",
       "Left Arm", "Right Arm"],
      ...sessions.map((s) => [
        s.created_at.slice(0, 10),
        s.game_type,
        s.completed ? "Done" : "Quit",
        s.score,
        Math.round(s.accuracy),
        s.duration_sec,
        s.hit_count,
        s.miss_count,
        s.combo,
        s.left_hand_score,
        s.right_hand_score,
        Math.round(s.responsiveness),
        s.left_arm_quality,
        s.right_arm_quality,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `stroke3d_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const rptDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const accentDim    = accent + "20";
  const accentBorder = accent + "3F";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
        :root {
          --ac: ${accent};
          --ac-dim: ${accentDim};
          --ac-bd: ${accentBorder};
          --red: #FF2020;
          --ora: #FF6B00;
          --bg: #0A0A0F;
          --bg2: rgba(255,255,255,0.03);
          --txt: #E0E8F0;
          --mut: rgba(180,190,200,0.5);
          --mono: 'Space Mono', monospace;
          --dis: 'Syne', sans-serif;
        }
        *{box-sizing:border-box;margin:0;padding:0;}

        /* ── dashboard shell ── */
        .rc-dash{padding:24px 28px;max-width:980px;margin:0 auto;}
        .rc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--ac-bd);flex-wrap:wrap;gap:12px;}
        .rc-patient-label{font-family:var(--mono);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:var(--ac);opacity:.7;margin-bottom:4px;}
        .rc-patient-name{font-size:22px;font-weight:800;color:var(--txt);}
        .rc-patient-meta{font-family:var(--mono);font-size:11px;color:var(--mut);margin-top:4px;display:flex;gap:10px;flex-wrap:wrap;}
        .rc-header-right{display:flex;flex-direction:column;gap:8px;align-items:flex-end;}
        .rc-action-btns{display:flex;gap:8px;flex-wrap:wrap;}
        .rc-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid var(--ac-bd);background:rgba(10,10,15,.8);cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ac);transition:all .2s;}
        .rc-btn:hover{background:var(--ac-dim);border-color:var(--ac);}
        .rc-btn-rpt{border-color:rgba(255,107,0,.4);color:var(--ora);}
        .rc-btn-rpt:hover{background:rgba(255,107,0,.1);border-color:var(--ora);}
        .rc-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
        .rc-ctrl-group{display:flex;flex-direction:column;gap:4px;}
        .rc-ctrl-label{font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);}
        .rc-ctrl-row{display:flex;gap:5px;align-items:center;}
        .rc-color-btn{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:border-color .2s;}
        .rc-color-btn.active,.rc-color-btn:hover{border-color:white;}
        input[type=range]{width:72px;height:4px;accent-color:var(--ac);cursor:pointer;}
        .rc-val-out{font-family:var(--mono);font-size:10px;color:var(--ac);min-width:28px;}

        /* ── KPI cards ── */
        .rc-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px;}
        .rc-kpi{background:var(--bg2);border:1px solid var(--ac-bd);border-radius:12px;padding:16px 18px;transition:all .2s;}
        .rc-kpi:hover{border-color:var(--ac);background:var(--ac-dim);}
        .rc-kpi-label{font-family:var(--mono);font-size:11px;color:var(--mut);margin-bottom:6px;}
        .rc-kpi-val{font-size:28px;font-weight:800;line-height:1.1;}
        .rc-kpi-sub{font-family:var(--mono);font-size:10px;color:var(--mut);margin-top:4px;}

        /* ── arm quality row ── */
        .rc-arm-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
        .rc-arm-card{background:var(--bg2);border:1px solid var(--ac-bd);border-radius:12px;padding:14px 18px;}
        .rc-arm-title{font-family:var(--mono);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--mut);margin-bottom:8px;}
        .rc-arm-body{display:flex;align-items:center;gap:10px;}
        .rc-arm-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
        .rc-arm-quality{font-size:16px;font-weight:700;}
        .rc-arm-score{font-family:var(--mono);font-size:12px;color:var(--mut);margin-left:auto;}

        /* ── panels row ── */
        .rc-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
        .rc-panel{background:var(--bg2);border:1px solid var(--ac-bd);border-radius:12px;padding:16px;}
        .rc-panel-title{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--mut);margin-bottom:12px;}

        /* ── calendar ── */
        .rc-cal{display:flex;flex-wrap:wrap;gap:5px;}
        .rc-cal-day{width:36px;height:36px;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:default;transition:transform .15s;}
        .rc-cal-day:hover{transform:scale(1.08);}
        .rc-cal-done{background:rgba(0,212,170,.12);border:1px solid rgba(0,212,170,.35);}
        .rc-cal-skip{background:rgba(255,32,32,.08);border:1px solid rgba(255,32,32,.2);}
        .rc-cal-num{font-family:var(--mono);font-size:12px;font-weight:700;}
        .rc-cal-done .rc-cal-num{color:var(--ac);}
        .rc-cal-skip .rc-cal-num{color:var(--red);}
        .rc-cal-tick{font-size:8px;}
        .rc-cal-done .rc-cal-tick{color:var(--ac);}
        .rc-cal-skip .rc-cal-tick{color:var(--red);opacity:.7;}

        /* ── chart ── */
        .rc-chart-wrap{width:100%;height:150px;}

        /* ── table ── */
        .rc-table-wrap{background:var(--bg2);border:1px solid var(--ac-bd);border-radius:12px;overflow:hidden;}
        .rc-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
        .rc-table{width:100%;border-collapse:collapse;font-size:12px;min-width:680px;}
        thead tr{background:rgba(0,212,170,.04);border-bottom:1px solid var(--ac-bd);}
        th{font-family:var(--mono);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--mut);padding:10px 14px;text-align:left;font-weight:400;}
        td{padding:10px 14px;font-family:var(--mono);color:rgba(180,190,200,.75);border-bottom:1px solid rgba(255,255,255,.03);}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(0,212,170,.025);}
        .rc-badge{border-radius:4px;padding:3px 7px;font-size:10px;}
        .rc-badge-done{background:rgba(0,212,170,.1);color:var(--ac);border:1px solid rgba(0,212,170,.3);}
        .rc-badge-skip{background:rgba(255,32,32,.08);color:var(--red);border:1px solid rgba(255,32,32,.2);}

        /* ── report modal ── */
        .rc-modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;}
        .rc-modal-bg.open{display:flex;}
        .rc-report{background:#fff;color:#111;border-radius:12px;width:100%;max-width:760px;padding:40px 44px;position:relative;font-family:'Syne',sans-serif;}
        .rc-rpt-close{position:absolute;top:16px;right:18px;background:none;border:none;font-size:22px;cursor:pointer;color:#666;line-height:1;}
        .rc-rpt-close:hover{color:#111;}
        .rc-rpt-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #111;}
        .rc-rpt-logo-text{font-weight:800;font-size:16px;color:#111;letter-spacing:-.02em;}
        .rc-rpt-logo-sub{font-family:'Space Mono',monospace;font-size:9px;color:#888;letter-spacing:.15em;text-transform:uppercase;}
        .rc-rpt-date{font-family:'Space Mono',monospace;font-size:10px;color:#888;text-align:right;}
        .rc-rpt-patient{display:grid;grid-template-columns:1fr 1fr;margin-bottom:20px;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;}
        .rc-rpt-prow{display:flex;flex-direction:column;padding:10px 14px;border-bottom:1px solid #f0f0f0;}
        .rc-rpt-prow:nth-child(odd){border-right:1px solid #f0f0f0;}
        .rc-rpt-prow:last-child,.rc-rpt-prow:nth-last-child(2){border-bottom:none;}
        .rc-rpt-plabel{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#999;margin-bottom:3px;}
        .rc-rpt-pval{font-size:14px;font-weight:700;color:#111;}
        .rc-rpt-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;}
        .rc-rpt-kpi{background:#f8f8f8;border-radius:8px;padding:12px 14px;border-left:3px solid #111;}
        .rc-rpt-kpi.hi{border-left-color:#00B894;}
        .rc-rpt-kpi.md{border-left-color:#FF6B00;}
        .rc-rpt-kpi-label{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#888;margin-bottom:4px;}
        .rc-rpt-kpi-val{font-size:20px;font-weight:800;color:#111;}
        .rc-rpt-kpi-sub{font-family:'Space Mono',monospace;font-size:9px;color:#aaa;margin-top:2px;}
        .rc-rpt-sec-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#888;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #f0f0f0;}
        .rc-rpt-chart-wrap{width:100%;height:160px;margin-bottom:6px;}
        .rc-rpt-table{width:100%;border-collapse:collapse;font-size:11px;}
        .rc-rpt-table thead tr{background:#f5f5f5;}
        .rc-rpt-table th{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#888;padding:8px 10px;text-align:left;font-weight:400;}
        .rc-rpt-table td{padding:7px 10px;color:#444;border-bottom:1px solid #f5f5f5;font-family:'Space Mono',monospace;font-size:10px;}
        .rc-rpt-table tr:last-child td{border-bottom:none;}
        .rc-rpt-note{background:#f9f9f9;border-radius:8px;padding:14px 16px;margin-top:16px;border:1px solid #e5e5e5;}
        .rc-rpt-note-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:6px;}
        .rc-rpt-note-body{font-size:13px;color:#555;line-height:1.7;}
        .rc-rpt-footer{margin-top:24px;padding-top:14px;border-top:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;}
        .rc-rpt-footer-left{font-family:'Space Mono',monospace;font-size:9px;color:#bbb;line-height:1.7;}
        .rc-rpt-print-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;background:#0A0A0F;color:#00D4AA;border:none;border-radius:7px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;}
        .rc-rpt-print-btn:hover{opacity:.85;}
        .rc-empty{font-family:var(--mono);font-size:11px;color:var(--mut);padding:20px 0;text-align:center;}
      `}</style>

      {/* ═══════════════════════════ DASHBOARD ═══════════════════════════ */}
      <div
        className="rc-dash"
        style={{ filter: `brightness(${brightness / 100})`, display: visible ? "block" : "none" }}
      >

        {/* Header */}
        <div className="rc-header">
          <div>
            <div className="rc-patient-label">• Scene 7 / 7 — Rehabilitation Summary</div>
            <div className="rc-patient-name">
              {user?.user_metadata?.full_name || user?.email || "Guest Patient"}
            </div>
            <div className="rc-patient-meta">
              <span style={{ color: accent }}>ID: {user?.id?.slice(0, 8) ?? "—"}</span>
              <span>·</span>
              <span>Active Recovery</span>
              <span>·</span>
              <span>{total} เซสชัน</span>
            </div>
          </div>

          <div className="rc-header-right">
            <div className="rc-action-btns">
              <button className="rc-btn" onClick={exportCSV}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Export CSV
              </button>
              <button className="rc-btn rc-btn-rpt" onClick={() => setReportOpen(true)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="2" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Doctor Report
              </button>
            </div>
            <div className="rc-controls">
              <div className="rc-ctrl-group">
                <div className="rc-ctrl-label">Accent</div>
                <div className="rc-ctrl-row">
                  {ACCENT_COLORS.map((c) => (
                    <div
                      key={c}
                      className={`rc-color-btn${accent === c ? " active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setAccent(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="rc-ctrl-group">
                <div className="rc-ctrl-label">Brightness</div>
                <div className="rc-ctrl-row">
                  <input
                    type="range" min={60} max={100} value={brightness} step={1}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                  <span className="rc-val-out">{brightness}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards — คำนวณจาก field จริงของ GameSession */}
        <div className="rc-kpi-grid">
          <div className="rc-kpi">
            <div className="rc-kpi-label">ความสม่ำเสมอ</div>
            <div className="rc-kpi-val" style={{ color: accent }}>{consistency}%</div>
            <div className="rc-kpi-sub">{done}/{total} เซสชัน</div>
          </div>
          <div className="rc-kpi">
            <div className="rc-kpi-label">ความแม่นยำเฉลี่ย</div>
            <div className="rc-kpi-val" style={{ color: accColor(avgAcc) }}>{avgAcc}%</div>
            <div className="rc-kpi-sub">accuracy</div>
          </div>
          <div className="rc-kpi">
            <div className="rc-kpi-label">คะแนนเฉลี่ย</div>
            <div className="rc-kpi-val" style={{ color: accent }}>{avgScore}K</div>
            <div className="rc-kpi-sub">ต่อเซสชัน</div>
          </div>
          <div className="rc-kpi">
            <div className="rc-kpi-label">เวลาเฉลี่ย</div>
            <div className="rc-kpi-val" style={{ color: "#FF6B00" }}>{fmtTime(avgDur)}</div>
            <div className="rc-kpi-sub">ต่อเซสชัน</div>
          </div>
          <div className="rc-kpi">
            <div className="rc-kpi-label">ตีโดนทั้งหมด</div>
            <div className="rc-kpi-val" style={{ color: accent }}>{totalHits.toLocaleString()}</div>
            <div className="rc-kpi-sub">hit count รวม</div>
          </div>
          <div className="rc-kpi">
            <div className="rc-kpi-label">ความตอบสนองเฉลี่ย</div>
            <div className="rc-kpi-val" style={{ color: accColor(avgResp) }}>{avgResp}%</div>
            <div className="rc-kpi-sub">responsiveness</div>
          </div>
        </div>

        {/* Arm quality จาก session ล่าสุด */}
        {latestSession && (
          <div className="rc-arm-row">
            <div className="rc-arm-card">
              <div className="rc-arm-title">แขนซ้าย (session ล่าสุด)</div>
              <div className="rc-arm-body">
                <div
                  className="rc-arm-dot"
                  style={{ background: qualityColor(latestSession.left_arm_quality) }}
                />
                <span
                  className="rc-arm-quality"
                  style={{ color: qualityColor(latestSession.left_arm_quality) }}
                >
                  {qualityLabel(latestSession.left_arm_quality)}
                </span>
                <span className="rc-arm-score">
                  {latestSession.left_hand_score.toLocaleString()} pts
                </span>
              </div>
            </div>
            <div className="rc-arm-card">
              <div className="rc-arm-title">แขนขวา (session ล่าสุด)</div>
              <div className="rc-arm-body">
                <div
                  className="rc-arm-dot"
                  style={{ background: qualityColor(latestSession.right_arm_quality) }}
                />
                <span
                  className="rc-arm-quality"
                  style={{ color: qualityColor(latestSession.right_arm_quality) }}
                >
                  {qualityLabel(latestSession.right_arm_quality)}
                </span>
                <span className="rc-arm-score">
                  {latestSession.right_hand_score.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Calendar + Chart */}
        <div className="rc-row2">
          <div className="rc-panel">
            <div className="rc-panel-title">Daily Consistency (30 วันล่าสุด)</div>
            <div className="rc-cal">
              {sessions.length === 0 ? (
                <div className="rc-empty">ยังไม่มีข้อมูล — เล่นเกมก่อนนะครับ</div>
              ) : (
                [...sessions]
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .slice(-28)
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`rc-cal-day ${s.completed ? "rc-cal-done" : "rc-cal-skip"}`}
                      title={`${s.created_at.slice(0, 10)} — ${s.completed ? "สำเร็จ" : "ออกกลางคัน"}`}
                    >
                      <span className="rc-cal-num">{s.created_at.slice(8, 10)}</span>
                      <span className="rc-cal-tick">{s.completed ? "✓" : "✗"}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className="rc-panel">
            <div className="rc-panel-title">Accuracy + Score (7 sessions ล่าสุด)</div>
            <div className="rc-chart-wrap">
              <canvas ref={dashCanvasRef} style={{ width: "100%", height: "150px" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--mono)", fontSize: 10, color: "var(--mut)" }}>
                <span style={{ display: "inline-block", width: 16, height: 2, background: accent }} />
                Accuracy %
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--mono)", fontSize: 10, color: "var(--mut)" }}>
                <span style={{ display: "inline-block", width: 16, height: 2, background: "#FF6B00", borderTop: "2px dashed #FF6B00" }} />
                Score (scaled)
              </span>
            </div>
          </div>
        </div>

        {/* Session Table */}
        <div className="rc-table-wrap">
          <div className="rc-table-scroll">
            <table className="rc-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>สถานะ</th>
                  <th>คะแนน</th>
                  <th>ความแม่นยำ</th>
                  <th>เวลา</th>
                  <th>ตี</th>
                  <th>พลาด</th>
                  <th>Combo</th>
                  <th>ตอบสนอง</th>
                  <th>แขนซ้าย</th>
                  <th>แขนขวา</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 32, color: accent }}>
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="rc-empty">
                      ยังไม่มีข้อมูล — เล่นเกมเพื่อดูผลลัพธ์
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ color: "var(--txt)", whiteSpace: "nowrap" }}>
                        {s.created_at.slice(0, 10)}
                      </td>
                      <td style={{ fontSize: 10 }}>{s.game_type}</td>
                      <td>
                        <span className={`rc-badge ${s.completed ? "rc-badge-done" : "rc-badge-skip"}`}>
                          {s.completed ? "✓ Done" : "✗ Quit"}
                        </span>
                      </td>
                      <td style={{ color: accent }}>{(s.score / 1000).toFixed(1)}K</td>
                      <td style={{ color: accColor(s.accuracy) }}>
                        {Math.round(s.accuracy)}%
                      </td>
                      <td>{fmtTime(s.duration_sec)}</td>
                      <td style={{ color: "var(--ac)" }}>{s.hit_count}</td>
                      <td style={{ color: s.miss_count > 10 ? "#FF6B00" : "var(--mut)" }}>
                        {s.miss_count}
                      </td>
                      <td style={{ color: s.combo >= 10 ? accent : "var(--mut)" }}>
                        {s.combo}
                      </td>
                      <td style={{ color: accColor(s.responsiveness) }}>
                        {Math.round(s.responsiveness)}%
                      </td>
                      <td style={{ color: qualityColor(s.left_arm_quality), fontSize: 10 }}>
                        {qualityLabel(s.left_arm_quality)}
                      </td>
                      <td style={{ color: qualityColor(s.right_arm_quality), fontSize: 10 }}>
                        {qualityLabel(s.right_arm_quality)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ DOCTOR REPORT MODAL ═══════════════════════ */}
      <div className={`rc-modal-bg${reportOpen ? " open" : ""}`}>
        <div className="rc-report">
          <button className="rc-rpt-close" onClick={() => setReportOpen(false)}>✕</button>

          <div className="rc-rpt-header">
            <div>
              <div className="rc-rpt-logo-text">STROKE 3D</div>
              <div className="rc-rpt-logo-sub">Rehabilitation Report</div>
            </div>
            <div className="rc-rpt-date">
              <div style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>รายงานความก้าวหน้า</div>
              <div>ออกเมื่อ: {rptDate}</div>
              <div>จำนวนเซสชัน: {total} รายการ</div>
            </div>
          </div>

          <div className="rc-rpt-patient">
            <div className="rc-rpt-prow">
              <div className="rc-rpt-plabel">ชื่อผู้ป่วย</div>
              <div className="rc-rpt-pval">{user?.user_metadata?.full_name || user?.email || "Guest"}</div>
            </div>
            <div className="rc-rpt-prow">
              <div className="rc-rpt-plabel">รหัสผู้ป่วย</div>
              <div className="rc-rpt-pval">ID-{user?.id?.slice(0, 6) ?? "—"}</div>
            </div>
            <div className="rc-rpt-prow">
              <div className="rc-rpt-plabel">ประเภทการประเมิน</div>
              <div className="rc-rpt-pval">Stroke Rehabilitation</div>
            </div>
            <div className="rc-rpt-prow">
              <div className="rc-rpt-plabel">แหล่งข้อมูล</div>
              <div className="rc-rpt-pval">game_sessions (Supabase)</div>
            </div>
          </div>

          <div className="rc-rpt-kpis">
            <div className="rc-rpt-kpi hi">
              <div className="rc-rpt-kpi-label">Consistency</div>
              <div className="rc-rpt-kpi-val">{consistency}%</div>
              <div className="rc-rpt-kpi-sub">{done}/{total} sessions</div>
            </div>
            <div className="rc-rpt-kpi hi">
              <div className="rc-rpt-kpi-label">Avg Accuracy</div>
              <div className="rc-rpt-kpi-val">{avgAcc}%</div>
              <div className="rc-rpt-kpi-sub">ความแม่นยำ</div>
            </div>
            <div className="rc-rpt-kpi hi">
              <div className="rc-rpt-kpi-label">Avg Score</div>
              <div className="rc-rpt-kpi-val">{avgScore}K</div>
              <div className="rc-rpt-kpi-sub">ต่อเซสชัน</div>
            </div>
            <div className="rc-rpt-kpi md">
              <div className="rc-rpt-kpi-label">Avg Responsiveness</div>
              <div className="rc-rpt-kpi-val">{avgResp}%</div>
              <div className="rc-rpt-kpi-sub">ความตอบสนอง</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="rc-rpt-sec-title">กราฟ Accuracy + Score (7 sessions ล่าสุด)</div>
            <div className="rc-rpt-chart-wrap">
              <canvas ref={rptCanvasRef} style={{ width: "100%", height: "160px" }} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="rc-rpt-sec-title">รายละเอียดเซสชัน</div>
            <table className="rc-rpt-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>สถานะ</th>
                  <th>คะแนน</th>
                  <th>แม่นยำ</th>
                  <th>เวลา</th>
                  <th>ตี</th>
                  <th>พลาด</th>
                  <th>Combo</th>
                  <th>ตอบสนอง</th>
                  <th>แขนซ้าย</th>
                  <th>แขนขวา</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 12, color: "#999" }}>ยังไม่มีข้อมูล</td></tr>
                ) : sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.created_at.slice(0, 10)}</td>
                    <td>{s.game_type}</td>
                    <td>{s.completed ? "✓ Done" : "✗ Quit"}</td>
                    <td style={{ color: "#00A878", fontWeight: 700 }}>{(s.score / 1000).toFixed(1)}K</td>
                    <td style={{ color: s.accuracy >= 80 ? "#00A878" : s.accuracy >= 60 ? "#FF6B00" : "#E53E3E", fontWeight: 700 }}>
                      {Math.round(s.accuracy)}%
                    </td>
                    <td>{fmtTime(s.duration_sec)}</td>
                    <td>{s.hit_count}</td>
                    <td>{s.miss_count}</td>
                    <td>{s.combo}</td>
                    <td>{Math.round(s.responsiveness)}%</td>
                    <td>{qualityLabel(s.left_arm_quality)}</td>
                    <td>{qualityLabel(s.right_arm_quality)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rc-rpt-note">
            <div className="rc-rpt-note-title">หมายเหตุสำหรับแพทย์</div>
            <div className="rc-rpt-note-body">
              จากข้อมูล {total} เซสชันล่าสุด ผู้ป่วยมีความสม่ำเสมอในการฝึก {consistency}%
              ความแม่นยำเฉลี่ย {avgAcc}% ความตอบสนองเฉลี่ย {avgResp}%
              {latestSession && ` สถานะแขนซ้ายล่าสุด: ${qualityLabel(latestSession.left_arm_quality)}, แขนขวาล่าสุด: ${qualityLabel(latestSession.right_arm_quality)}`}
              {" "}ข้อมูลนี้ดึงจาก Supabase โดยตรงและแสดงผลแบบ real-time
            </div>
          </div>

          <div className="rc-rpt-footer">
            <div className="rc-rpt-footer-left">
              <div>STROKE 3D Rehabilitation Platform</div>
              <div>รายงานนี้ผลิตโดยระบบอัตโนมัติ — ใช้ประกอบการวินิจฉัยเท่านั้น</div>
            </div>
            <button className="rc-rpt-print-btn" onClick={() => window.print()}>
              🖨 Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}