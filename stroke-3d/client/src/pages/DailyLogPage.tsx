/*
 * DailyLogPage.tsx
 * หน้าบันทึกรายวัน (วันที่ 1–7)
 * ใช้มาตรฐาน: Barthel Index, Fugl-Meyer ย่อ, Berg Balance, VAS Pain
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRehab, DailyLog } from "@/contexts/RehabContext";

// ── Score helpers ──────────────────────────────────────────────────────────

const BARTHEL_LABELS = {
  0: "ต้องการช่วย", 1: "ช่วยบางส่วน", 2: "ทำได้เอง"
};
const FM_LABELS = { 0: "ทำไม่ได้", 1: "ทำบางส่วน", 2: "ทำได้ปกติ" };
const BALANCE_LABELS = { 0: "ไม่ได้", 1: "ได้บ้าง", 2: "ได้ปกติ" };
const MOOD_LABELS = { 1: "😞 แย่มาก", 2: "😕 แย่", 3: "😐 ปานกลาง", 4: "🙂 ดี", 5: "😄 ดีมาก" };

function ScoreBtn({
  value, current, label, color = "#14dcb4", onChange
}: {
  value: 0|1|2; current: number; label: string; color?: string; onChange: (v: 0|1|2) => void
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      style={{
        flex: 1, padding: "8px 4px", borderRadius: 8, border: "1px solid",
        borderColor: active ? color : "rgba(255,255,255,0.12)",
        background: active ? `${color}22` : "rgba(255,255,255,0.04)",
        color: active ? color : "rgba(255,255,255,0.6)",
        fontSize: 13, cursor: "pointer", transition: "all 0.2s",
        fontWeight: active ? 600 : 400,
      }}
    >{label}</button>
  );
}

function SliderRow({
  label, value, min = 0, max = 10, color = "#14dcb4", onChange
}: {
  label: string; value: number; min?: number; max?: number; color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 18, minWidth: 28, textAlign: "right" }}>
          {value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value} step={1}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: "100%", accentColor: color }}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{min} = ไม่มี</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{max} = รุนแรงมาก</span>
      </div>
    </div>
  );
}

export default function DailyLogPage({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { profile, dailyLogs, saveDailyLog, getCurrentDay, getTodayLog } = useRehab();
  const [section, setSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentDay = getCurrentDay();
  const existingLog = getTodayLog();

  const defaultLog: Omit<DailyLog, "id" | "userId" | "profileId" | "createdAt"> = {
    day: currentDay,
    date: today,
    bathing: 1, dressing: 1, feeding: 1, mobility: 1, toileting: 1, stairs: 1,
    armLeft: 1, armRight: 1, legLeft: 1, legRight: 1,
    standingBalance: 1, walkingBalance: 1,
    painScore: 3, fatigueScore: 4, moodScore: 3, notes: "",
  };

  const [form, setForm] = useState(existingLog ? {
    day: existingLog.day, date: existingLog.date,
    bathing: existingLog.bathing, dressing: existingLog.dressing,
    feeding: existingLog.feeding, mobility: existingLog.mobility,
    toileting: existingLog.toileting, stairs: existingLog.stairs,
    armLeft: existingLog.armLeft, armRight: existingLog.armRight,
    legLeft: existingLog.legLeft, legRight: existingLog.legRight,
    standingBalance: existingLog.standingBalance,
    walkingBalance: existingLog.walkingBalance,
    painScore: existingLog.painScore, fatigueScore: existingLog.fatigueScore,
    moodScore: existingLog.moodScore, notes: existingLog.notes,
  } : defaultLog);

  const set2 = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const sections = ["การเคลื่อนไหว", "กล้ามเนื้อ", "ความสมดุล", "ความเจ็บปวด", "บันทึก"];
  const totalSections = sections.length;

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true); setError("");
    try {
      await saveDailyLog({
        ...form,
        id: existingLog?.id,
        userId: user.id,
        profileId: profile.id!,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onDone(); }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes dl-bg-anim {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dl-wrap {
          position: fixed; inset: 0; z-index: 200;
          background: linear-gradient(135deg, #060b14, #050f0a, #0a060f, #0d0805);
          background-size: 400% 400%;
          animation: dl-bg-anim 25s ease infinite;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .dl-card {
          width: 100%; max-width: 560px;
          background: rgba(10, 12, 22, 0.98);
          border: 1px solid rgba(255, 160, 50, 0.25);
          border-radius: 16px; padding: 28px;
          max-height: 92vh; overflow-y: auto;
        }
        .dl-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 8px;
        }
        .dl-day { font-size: 24px; font-weight: 800; color: #FFA032; }
        .dl-date { font-size: 12px; color: rgba(255,255,255,0.4); }
        .dl-subtitle { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px; }
        .dl-tabs {
          display: flex; gap: 4px; overflow-x: auto;
          margin-bottom: 24px; padding-bottom: 4px;
        }
        .dl-tab {
          flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
          font-size: 12px; cursor: pointer; border: none;
          transition: all 0.2s;
        }
        .dl-tab.active {
          background: rgba(255,160,50,0.2);
          color: #FFA032; font-weight: 600;
          border: 1px solid rgba(255,160,50,0.4);
        }
        .dl-tab.inactive {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .dl-section-title {
          font-size: 15px; font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-bottom: 18px;
        }
        .dl-row-label {
          font-size: 14px; color: rgba(255,255,255,0.75);
          margin-bottom: 6px; display: block;
        }
        .dl-score-row {
          display: flex; gap: 6px; margin-bottom: 14px;
        }
        .dl-mood-row {
          display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .dl-mood-btn {
          flex: 1; min-width: 80px; padding: 10px 4px;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6); font-size: 13px;
          cursor: pointer; text-align: center;
          transition: all 0.2s;
        }
        .dl-mood-btn.active {
          border-color: #FFA032;
          background: rgba(255,160,50,0.15);
          color: #FFA032; font-weight: 600;
        }
        .dl-textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; padding: 10px 14px;
          color: #fff; font-size: 14px; resize: vertical;
          outline: none; min-height: 100px;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .dl-textarea:focus { border-color: #FFA032; }
        .dl-btn-row { display: flex; gap: 10px; margin-top: 20px; }
        .dl-btn {
          flex: 1; padding: 12px; border-radius: 10px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.2s;
        }
        .dl-btn-primary {
          background: linear-gradient(135deg, #FFA032, #e8851a);
          color: #fff;
        }
        .dl-btn-primary:hover { opacity: 0.9; }
        .dl-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .dl-btn-secondary {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .dl-error {
          color: #ff6b6b; font-size: 13px; padding: 8px 12px;
          background: rgba(255,100,100,0.1); border-radius: 6px;
          margin-top: 8px;
        }
        .dl-saved {
          color: #14dcb4; font-size: 15px; text-align: center;
          padding: 16px; font-weight: 600;
        }
        .dl-progress-bar {
          height: 3px; background: rgba(255,255,255,0.1);
          border-radius: 2px; margin-bottom: 20px;
        }
        .dl-progress-fill {
          height: 100%; border-radius: 2px;
          background: #FFA032;
          transition: width 0.3s;
        }
      `}</style>

      <div className="dl-wrap">
        <div className="dl-card">

          {/* Header */}
          <div className="dl-header">
            <div>
              <div className="dl-day">
                วันที่ {currentDay}/7
                {profile?.nickname && ` · คุณ${profile.nickname}`}
              </div>
              <div className="dl-date">{new Date().toLocaleDateString("th-TH", {
                weekday: "long", year: "numeric", month: "long", day: "numeric"
              })}</div>
            </div>
            <button
              onClick={onDone}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 24, cursor: "pointer" }}
            >✕</button>
          </div>

          {existingLog && (
            <p className="dl-subtitle">⚠️ แก้ไขบันทึกของวันนี้ (วันที่ {currentDay})</p>
          )}

          {/* Progress */}
          <div className="dl-progress-bar">
            <div className="dl-progress-fill" style={{ width: `${((section) / totalSections) * 100}%` }} />
          </div>

          {/* Tabs */}
          <div className="dl-tabs">
            {sections.map((s, i) => (
              <button key={s}
                className={`dl-tab ${i === section ? "active" : "inactive"}`}
                onClick={() => setSection(i)}>
                {i < section ? "✓ " : ""}{s}
              </button>
            ))}
          </div>

          {saved && <div className="dl-saved">✅ บันทึกสำเร็จ!</div>}

          {/* ── Section 0: Barthel Index ── */}
          {section === 0 && (
            <div>
              <p className="dl-section-title">🚶 การเคลื่อนไหวและดูแลตัวเอง (Barthel Index)</p>

              {([
                ["bathing", "🛁 การอาบน้ำ"],
                ["dressing", "👕 การแต่งกาย"],
                ["feeding", "🍽️ การรับประทานอาหาร"],
                ["mobility", "🚶 การเดิน/เคลื่อนที่"],
                ["toileting", "🚻 การขับถ่าย"],
                ["stairs", "🪜 การขึ้น-ลงบันได"],
              ] as [keyof typeof form, string][]).map(([key, label]) => (
                <div key={key}>
                  <span className="dl-row-label">{label}</span>
                  <div className="dl-score-row">
                    {([0, 1, 2] as const).map(v => (
                      <ScoreBtn key={v} value={v} current={form[key] as number}
                        label={BARTHEL_LABELS[v]}
                        onChange={(val) => set2(key, val)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Section 1: Fugl-Meyer ── */}
          {section === 1 && (
            <div>
              <p className="dl-section-title">💪 การทำงานของกล้ามเนื้อ (Fugl-Meyer ย่อ)</p>
              {([
                ["armLeft", "💪 แขนซ้าย"],
                ["armRight", "💪 แขนขวา"],
                ["legLeft", "🦵 ขาซ้าย"],
                ["legRight", "🦵 ขาขวา"],
              ] as [keyof typeof form, string][]).map(([key, label]) => (
                <div key={key}>
                  <span className="dl-row-label">{label}</span>
                  <div className="dl-score-row">
                    {([0, 1, 2] as const).map(v => (
                      <ScoreBtn key={v} value={v} current={form[key] as number}
                        label={FM_LABELS[v]} color="#a78bfa"
                        onChange={(val) => set2(key, val)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Section 2: Berg Balance ── */}
          {section === 2 && (
            <div>
              <p className="dl-section-title">⚖️ ความสมดุล (Berg Balance ย่อ)</p>
              {([
                ["standingBalance", "🧍 การยืน/นั่งสมดุล"],
                ["walkingBalance", "🚶 การเดินและหมุนตัว"],
              ] as [keyof typeof form, string][]).map(([key, label]) => (
                <div key={key}>
                  <span className="dl-row-label">{label}</span>
                  <div className="dl-score-row">
                    {([0, 1, 2] as const).map(v => (
                      <ScoreBtn key={v} value={v} current={form[key] as number}
                        label={BALANCE_LABELS[v]} color="#38bdf8"
                        onChange={(val) => set2(key, val)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Section 3: Pain / Fatigue ── */}
          {section === 3 && (
            <div>
              <p className="dl-section-title">⚡ ความเจ็บปวดและความเหนื่อยล้า</p>
              <SliderRow label="🔴 ความเจ็บปวด (VAS)" value={form.painScore}
                color="#f87171" onChange={v => set2("painScore", v)} />
              <SliderRow label="🟡 ความเหนื่อยล้า" value={form.fatigueScore}
                color="#fbbf24" onChange={v => set2("fatigueScore", v)} />

              <div style={{ marginTop: 20 }}>
                <span className="dl-row-label">😊 อารมณ์วันนี้</span>
                <div className="dl-mood-row">
                  {([1, 2, 3, 4, 5] as const).map(v => (
                    <button key={v}
                      className={`dl-mood-btn ${form.moodScore === v ? "active" : ""}`}
                      onClick={() => set2("moodScore", v)}>
                      {MOOD_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Section 4: Notes ── */}
          {section === 4 && (
            <div>
              <p className="dl-section-title">📝 หมายเหตุและอาการพิเศษ</p>
              <textarea className="dl-textarea"
                placeholder="เช่น วันนี้ฝึกเดินได้ดีขึ้น แต่ยังเจ็บที่ข้อเท้า..."
                value={form.notes}
                onChange={e => set2("notes", e.target.value)}
              />
              {error && <div className="dl-error">{error}</div>}
            </div>
          )}

          {/* Buttons */}
          <div className="dl-btn-row">
            {section > 0 && (
              <button className="dl-btn dl-btn-secondary" onClick={() => setSection(s => s - 1)}>
                ← ย้อนกลับ
              </button>
            )}
            {section < totalSections - 1 ? (
              <button className="dl-btn dl-btn-primary" onClick={() => setSection(s => s + 1)}>
                ถัดไป →
              </button>
            ) : (
              <button className="dl-btn dl-btn-primary"
                disabled={saving} onClick={handleSave}>
                {saving ? "⏳ กำลังบันทึก..." : "💾 บันทึกวันนี้"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}