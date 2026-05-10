/*
 * ReportPage.tsx
 * สร้างรายงาน 7 วันโดย AI (Anthropic Claude)
 * - วิเคราะห์แนวโน้ม Barthel / Fugl-Meyer / Balance / Pain
 * - สรุปภาษาไทย + คำแนะนำสำหรับแพทย์
 * - Export เป็น HTML พร้อม print เป็น PDF
 */

import { useState, useRef } from "react";
import { useRehab, DailyLog } from "@/contexts/RehabContext";

// ── คำนวณ Barthel score (0–12) ───────────────────────────────────────────
function barthelScore(log: DailyLog) {
  return log.bathing + log.dressing + log.feeding + log.mobility + log.toileting + log.stairs;
}
function fmScore(log: DailyLog) {
  return log.armLeft + log.armRight + log.legLeft + log.legRight;
}
function balanceScore(log: DailyLog) {
  return log.standingBalance + log.walkingBalance;
}

// ── เรียก Claude API ─────────────────────────────────────────────────────
async function generateAIReport(
  profile: NonNullable<ReturnType<typeof useRehab>["profile"]>,
  logs: DailyLog[]
): Promise<string> {
  const logsText = logs.map(l => `
วันที่ ${l.day} (${l.date}):
- Barthel: ${barthelScore(l)}/12 (อาบน้ำ${l.bathing} แต่งตัว${l.dressing} กิน${l.feeding} เดิน${l.mobility} ขับถ่าย${l.toileting} บันได${l.stairs})
- กล้ามเนื้อ Fugl-Meyer: แขนซ้าย${l.armLeft} แขนขวา${l.armRight} ขาซ้าย${l.legLeft} ขาขวา${l.legRight}
- ความสมดุล: ยืน${l.standingBalance} เดิน${l.walkingBalance}
- ความเจ็บปวด VAS: ${l.painScore}/10
- ความเหนื่อยล้า: ${l.fatigueScore}/10
- อารมณ์: ${l.moodScore}/5
- หมายเหตุ: ${l.notes || "ไม่มี"}
`).join("\n");

  const prompt = `คุณเป็นนักกายภาพบำบัดผู้เชี่ยวชาญ กรุณาวิเคราะห์ผลการติดตามผู้ป่วย Stroke และเขียนรายงานเพื่อส่งแพทย์

ข้อมูลผู้ป่วย:
- ชื่อ: ${profile.fullName} (${profile.nickname}) อายุ ${profile.age} ปี
- Stroke ชนิด: ${profile.strokeType === "ischemic" ? "Ischemic (หลอดเลือดอุดตัน)" : profile.strokeType === "hemorrhagic" ? "Hemorrhagic (หลอดเลือดแตก)" : "ไม่ทราบชนิด"}
- วันที่เกิดอาการ: ${profile.strokeDate}
- ด้านที่อ่อนแรง: ${profile.affectedSide === "left" ? "ซ้าย" : profile.affectedSide === "right" ? "ขวา" : "ทั้งสองข้าง"}
- อาการเริ่มต้น: ${profile.initialSymptoms.join(", ") || "ไม่ระบุ"}

ผลการติดตาม 7 วัน:
${logsText}

กรุณาเขียนรายงานเป็นภาษาไทย ประกอบด้วย:
1. สรุปภาพรวมความก้าวหน้า
2. วิเคราะห์แนวโน้มรายด้าน (Barthel, Fugl-Meyer, สมดุล, ความเจ็บปวด)
3. ประเมินระดับพัฒนาการ (ดีขึ้น/คงที่/แย่ลง)
4. จุดที่ต้องให้ความสนใจเป็นพิเศษ
5. คำแนะนำท่ากายภาพที่ควรเน้น
6. สัญญาณเตือนที่แพทย์ควรทราบ
7. เป้าหมายสัปดาห์ถัดไป

เขียนในรูปแบบรายงานทางการแพทย์ที่อ่านเข้าใจง่าย ใช้ภาษาที่เหมาะสำหรับส่งแพทย์`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.map((b: { type: string; text?: string }) =>
    b.type === "text" ? b.text : ""
  ).join("") || "";

  if (!text) throw new Error("AI ไม่สามารถสร้างรายงานได้");
  return text;
}

// ── Mini chart bar ───────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 8, borderRadius: 4,
        background: "rgba(255,255,255,0.08)", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: color, transition: "width 0.5s",
        }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 28 }}>
        {value}/{max}
      </span>
    </div>
  );
}

export default function ReportPage({ onClose }: { onClose: () => void }) {
  const { profile, dailyLogs } = useRehab();
  const [aiText, setAiText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const completedDays = dailyLogs.length;
  const canGenerate = completedDays >= 1;

  const handleGenerate = async () => {
    if (!profile) return;
    setGenerating(true); setError("");
    try {
      const text = await generateAIReport(profile, dailyLogs);
      setAiText(text);
      setGenerated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const html = `<!DOCTYPE html><html lang="th">
<head>
<meta charset="UTF-8">
<title>รายงานกายภาพบำบัด — ${profile?.fullName}</title>
<style>
  body { font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; line-height: 1.8; }
  h1 { color: #1a6b4e; font-size: 22px; border-bottom: 2px solid #1a6b4e; padding-bottom: 8px; }
  h2 { color: #2d4a8a; font-size: 16px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #2d4a8a; color: white; padding: 8px 12px; text-align: left; }
  td { border: 1px solid #ddd; padding: 6px 12px; }
  tr:nth-child(even) { background: #f5f5f5; }
  .ai-section { background: #f0faf5; border: 1px solid #1a6b4e; border-radius: 8px; padding: 16px; margin-top: 20px; }
  .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>📋 รายงานการฟื้นฟูจาก Stroke — 7 วัน</h1>
<p><strong>ชื่อผู้ป่วย:</strong> ${profile?.fullName} (${profile?.nickname}) &nbsp;|&nbsp;
<strong>อายุ:</strong> ${profile?.age} ปี &nbsp;|&nbsp;
<strong>ชนิด Stroke:</strong> ${profile?.strokeType}</p>
<p><strong>วันที่เกิดอาการ:</strong> ${profile?.strokeDate} &nbsp;|&nbsp;
<strong>ด้านที่อ่อนแรง:</strong> ${profile?.affectedSide} &nbsp;|&nbsp;
<strong>ผู้ดูแล:</strong> ${profile?.caregiverName} (${profile?.caregiverPhone})</p>

<h2>📊 ตารางคะแนนรายวัน</h2>
<table>
<tr>
  <th>วัน</th><th>วันที่</th>
  <th>Barthel (0-12)</th><th>กล้ามเนื้อ (0-8)</th>
  <th>สมดุล (0-4)</th><th>ปวด VAS</th><th>อารมณ์</th>
</tr>
${dailyLogs.map(l => `
<tr>
  <td>วัน ${l.day}</td><td>${l.date}</td>
  <td>${barthelScore(l)}</td><td>${fmScore(l)}</td>
  <td>${balanceScore(l)}</td><td>${l.painScore}/10</td>
  <td>${l.moodScore}/5</td>
</tr>`).join("")}
</table>

<div class="ai-section">
<h2>🤖 การวิเคราะห์โดย AI (Claude)</h2>
<div style="white-space: pre-wrap">${aiText || "(ยังไม่ได้สร้างรายงาน AI)"}</div>
</div>

<div class="footer">
<p>อ้างอิงมาตรฐาน: Barthel Index | Fugl-Meyer Assessment (FMA) | Berg Balance Scale | VAS Pain Scale | WSO Rehabilitation Checklist</p>
<p>สร้างโดยระบบ STROKE 3D — วันที่ ${new Date().toLocaleDateString("th-TH")} | ข้อมูลนี้เป็นส่วนเสริมการวินิจฉัย ไม่ใช่การวินิจฉัยทางการแพทย์</p>
</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <>
      <style>{`
        @keyframes rp-bg-anim {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .rp-wrap {
          position: fixed; inset: 0; z-index: 200;
          background: linear-gradient(135deg, #060b14, #050f0a, #0a060f, #0d0805); background-size: 400% 400%; animation: rp-bg-anim 22s ease infinite;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'DM Sans', system-ui, sans-serif;
          overflow-y: auto;
        }
        .rp-card {
          width: 100%; max-width: 620px;
          background: rgba(10,12,22,0.98);
          border: 1px solid rgba(56,189,248,0.25);
          border-radius: 16px; padding: 28px;
          margin: auto;
        }
        .rp-title { font-size: 22px; font-weight: 700; color: #38bdf8; margin: 0 0 4px; }
        .rp-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 24px; }
        .rp-day-grid {
          display: grid; grid-template-columns: repeat(7,1fr);
          gap: 6px; margin-bottom: 24px;
        }
        .rp-day-pill {
          aspect-ratio: 1; border-radius: 8px; display: flex;
          align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .rp-day-done { background: rgba(20,220,180,0.2); color: #14dcb4; border: 1px solid rgba(20,220,180,0.3); }
        .rp-day-empty { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.06); }
        .rp-score-section { margin-bottom: 20px; }
        .rp-score-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 4px; display: block; }
        .rp-ai-box {
          background: rgba(20,220,180,0.06);
          border: 1px solid rgba(20,220,180,0.2);
          border-radius: 10px; padding: 16px;
          white-space: pre-wrap; color: rgba(255,255,255,0.8);
          font-size: 14px; line-height: 1.7;
          max-height: 360px; overflow-y: auto;
          margin-bottom: 16px;
        }
        .rp-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .rp-btn {
          flex: 1; min-width: 120px; padding: 12px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.2s;
        }
        .rp-btn-ai {
          background: linear-gradient(135deg,#14dcb4,#0eb89a);
          color: #04120e;
        }
        .rp-btn-ai:disabled { opacity: 0.5; cursor: not-allowed; }
        .rp-btn-pdf {
          background: linear-gradient(135deg,#38bdf8,#0284c7);
          color: #fff;
        }
        .rp-btn-close {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .rp-error {
          color: #f87171; font-size: 13px; padding: 8px 12px;
          background: rgba(248,113,113,0.1); border-radius: 6px; margin-bottom: 12px;
        }
        .rp-loading {
          display: flex; align-items: center; gap: 10px;
          color: #14dcb4; font-size: 14px; padding: 16px 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rp-spinner {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid rgba(20,220,180,0.2);
          border-top-color: #14dcb4;
          animation: spin 0.8s linear infinite;
        }
        .rp-ref { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 16px; line-height: 1.6; }
      `}</style>

      <div className="rp-wrap">
        <div className="rp-card" ref={reportRef}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p className="rp-title">📋 รายงานการฟื้นฟู</p>
              <p className="rp-sub">
                {profile?.fullName} ({profile?.nickname}) · {completedDays}/7 วันที่บันทึกแล้ว
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.4)",
              fontSize: 22, cursor: "pointer", padding: "4px 8px",
            }}>✕</button>
          </div>

          {/* วันที่ครบแล้ว */}
          <div className="rp-day-grid">
            {[1,2,3,4,5,6,7].map(d => {
              const done = dailyLogs.some(l => l.day === d);
              return (
                <div key={d} className={`rp-day-pill ${done ? "rp-day-done" : "rp-day-empty"}`}>
                  {done ? `✓${d}` : d}
                </div>
              );
            })}
          </div>

          {/* คะแนนสรุปรายวัน */}
          {dailyLogs.length > 0 && (
            <div className="rp-score-section">
              {dailyLogs.map(l => (
                <div key={l.day} style={{ marginBottom: 12 }}>
                  <span className="rp-score-label">
                    วัน {l.day} · {l.date}
                    {l.notes ? ` · "${l.notes.slice(0, 30)}${l.notes.length > 30 ? "..." : ""}"` : ""}
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                    <div><span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Barthel</span>
                      <MiniBar value={barthelScore(l)} max={12} color="#14dcb4" /></div>
                    <div><span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>กล้ามเนื้อ</span>
                      <MiniBar value={fmScore(l)} max={8} color="#a78bfa" /></div>
                    <div><span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>สมดุล</span>
                      <MiniBar value={balanceScore(l)} max={4} color="#38bdf8" /></div>
                    <div><span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>ปวด</span>
                      <MiniBar value={10 - l.painScore} max={10} color="#f87171" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI report */}
          {generating && (
            <div className="rp-loading">
              <div className="rp-spinner" />
              <span>AI กำลังวิเคราะห์ข้อมูล...</span>
            </div>
          )}

          {generated && aiText && (
            <div className="rp-ai-box">{aiText}</div>
          )}

          {error && <div className="rp-error">⚠️ {error}</div>}

          {/* Actions */}
          <div className="rp-btn-row">
            {!generated ? (
              <button className="rp-btn rp-btn-ai"
                disabled={!canGenerate || generating}
                onClick={handleGenerate}>
                {generating ? "⏳ กำลังสร้าง..." : `🤖 สร้างรายงาน AI (${completedDays} วัน)`}
              </button>
            ) : (
              <button className="rp-btn rp-btn-ai" onClick={handleGenerate} disabled={generating}>
                🔄 สร้างใหม่
              </button>
            )}

            <button className="rp-btn rp-btn-pdf" onClick={handlePrint}
              disabled={!generated}>
              🖨️ พิมพ์ / PDF
            </button>

            <button className="rp-btn rp-btn-close" onClick={onClose}>
              ✕ ปิด
            </button>
          </div>

          {!canGenerate && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
              * บันทึกอย่างน้อย 1 วันเพื่อสร้างรายงาน (ครบ 7 วันรายงานจะสมบูรณ์ที่สุด)
            </p>
          )}

          <p className="rp-ref">
            อ้างอิง: Barthel Index | Fugl-Meyer Assessment | Berg Balance Scale | VAS Pain Scale | WSO Stroke Rehabilitation Checklist 2022 | PROMIS | Modified Rankin Scale (mRS)<br/>
            รายงานนี้เป็นส่วนเสริมการวินิจฉัย ไม่ใช่การวินิจฉัยทางการแพทย์โดยตรง
          </p>
        </div>
      </div>
    </>
  );
}

// function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
//   const pct = Math.round((value / max) * 100);
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//       <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
//         <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color }} />
//       </div>
//       <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 28 }}>{value}/{max}</span>
//     </div>
//   );
// }