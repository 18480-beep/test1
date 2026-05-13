/*
 * StatsPanel.tsx — v5 (Readable Edition)
 * ✅ ตัวหนังสือใหญ่ขึ้น อ่านออกชัดเจน
 * ✅ ปรับขนาดได้ผ่าน --text-scale (Settings → Text Size)
 * ✅ padding / spacing넉넉ขึ้น
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface StatsPanelProps {
  activeScene: number;
}

type SpeechProgressData = {
  stage_id: string;
  chapter_id: number | null;
  stage_level: number | null;
  stage_name: string | null;
  stars: number | null;
  best_accuracy: number | string | null;
  attempts: number | null;
  cleared: boolean | null;
  last_played_at: string | null;
  raw_data: {
    attempted?: number;
    correct?: number;
    totalQuestions?: number;
    durationSec?: number;
  } | null;
};

const sceneStats: Record<number, { label: string; value: string; unit: string }[]> = {
  2: [
    { label: "Neurons", value: "86B", unit: "cells" },
    { label: "Weight", value: "1.4", unit: "kg" },
    { label: "Blood Supply", value: "20", unit: "%" },
  ],
  3: [
    { label: "Vessel Length", value: "400", unit: "miles" },
    { label: "Blood Flow", value: "750", unit: "mL/min" },
    { label: "O₂ Usage", value: "20", unit: "%" },
  ],
  4: [
    { label: "Prevalence", value: "87", unit: "%" },
    { label: "Neurons Lost", value: "1.9M", unit: "/min" },
    { label: "Treatment Window", value: "4.5", unit: "hrs" },
  ],
  5: [
    { label: "Prevalence", value: "13", unit: "%" },
    { label: "Mortality", value: "40", unit: "%" },
    { label: "Cause #1", value: "HBP", unit: "" },
  ],
};

export default function StatsPanel({ activeScene }: StatsPanelProps) {
  const { user } = useAuth();
  const [speechProgress, setSpeechProgress] = useState<SpeechProgressData[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (activeScene !== 2 || !user) {
      setSpeechProgress([]);
      return () => {
        cancelled = true;
      };
    }

    supabase
      .from("speech_stage_progress")
      .select("stage_id,chapter_id,stage_level,stage_name,stars,best_accuracy,attempts,cleared,last_played_at,raw_data")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[StatsPanel] speech progress error:", error.message);
          setSpeechProgress([]);
          return;
        }
        setSpeechProgress((data ?? []) as SpeechProgressData[]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeScene, user?.id]);

  const speechStats = useMemo(() => {
    const rows = speechProgress;
    const accuracyRows = rows
      .map((row) => Number(row.best_accuracy ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const avgAccuracy = accuracyRows.length
      ? Math.round(accuracyRows.reduce((sum, value) => sum + value, 0) / accuracyRows.length)
      : 0;
    const clearedCount = rows.filter((row) => row.cleared).length;
    const stars = rows.reduce((sum, row) => sum + Number(row.stars ?? 0), 0);
    const totalAttempts = rows.reduce((sum, row) => sum + Number(row.attempts ?? 0), 0);
    const spokenWords = rows.reduce((sum, row) => sum + Number(row.raw_data?.attempted ?? 0), 0);
    const correctWords = rows.reduce((sum, row) => sum + Number(row.raw_data?.correct ?? 0), 0);
    const totalQuestions = rows.reduce((sum, row) => sum + Number(row.raw_data?.totalQuestions ?? 0), 0);
    const durationSec = rows.reduce((sum, row) => sum + Number(row.raw_data?.durationSec ?? 0), 0);
    const latest = [...rows].sort((a, b) => {
      const chapterDiff = Number(b.chapter_id ?? 0) - Number(a.chapter_id ?? 0);
      if (chapterDiff) return chapterDiff;
      return Number(b.stage_level ?? 0) - Number(a.stage_level ?? 0);
    })[0];
    const minutes = durationSec > 0 ? Math.max(1, Math.ceil(durationSec / 60)) : 0;
    const wordsPerMinute = durationSec > 0 ? spokenWords / (durationSec / 60) : 0;
    const speed = wordsPerMinute > 0 ? Math.min(2.4, Math.max(0.4, wordsPerMinute / 8)) : 0;
    const completionRate = totalQuestions > 0 ? Math.round((spokenWords / totalQuestions) * 100) : (clearedCount ? 100 : 0);
    const rhythm = wordsPerMinute > 0 ? Math.min(100, Math.round((wordsPerMinute / 12) * 100)) : 0;
    const confidence = rows.length ? Math.round((avgAccuracy + completionRate + Math.min(100, stars * 12)) / 3) : 0;
    const sortedRows = [...rows].sort((a, b) => {
      const aTime = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
      const bTime = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
      return aTime - bTime;
    });
    const progressValues = (sortedRows.length ? sortedRows : rows)
      .slice(-6)
      .map((row) => Math.max(12, Math.min(100, Number(row.best_accuracy ?? 0))));
    const bars = Array.from({ length: 6 }, (_, index) => progressValues[index] ?? Math.max(14, 24 + index * 10));
    const frequency = Array.from({ length: 14 }, (_, index) => {
      const row = sortedRows[index % Math.max(sortedRows.length, 1)];
      const acc = Number(row?.best_accuracy ?? avgAccuracy ?? 0);
      return Math.max(14, Math.min(88, 26 + ((acc + index * 17 + spokenWords * 3) % 56)));
    });

    return {
      accuracy: Math.min(100, avgAccuracy),
      speed,
      minutes,
      totalAttempts,
      spokenWords,
      correctWords,
      levelText: latest ? `${latest.chapter_id ?? 0}-${latest.stage_level ?? 0}` : "0",
      stageName: latest?.stage_name ?? latest?.stage_id ?? "No progress yet",
      stars,
      pronunciation: Math.min(100, avgAccuracy),
      rhythm,
      confidence: Math.min(100, confidence),
      bars,
      frequency,
    };
  }, [speechProgress]);

  if (activeScene === 2) {
    const ringStyle = (value: number, color: string) => ({
      "--ring-value": `${value}%`,
      "--ring-color": color,
    }) as CSSProperties;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="speech-stats"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="fixed right-6 top-28 pointer-events-none hidden xl:block"
          style={{ zIndex: 22 }}
        >
          <style>{`
            @keyframes speechRingSpin {
              0% { filter: drop-shadow(0 0 6px rgba(0,229,192,0.25)); }
              50% { filter: drop-shadow(0 0 18px rgba(255,62,214,0.35)); }
              100% { filter: drop-shadow(0 0 6px rgba(0,229,192,0.25)); }
            }
            @keyframes speechGraphWave {
              0%, 100% { transform: scaleY(0.72); opacity: 0.7; }
              50% { transform: scaleY(1); opacity: 1; }
            }
            @keyframes speechPanelGlow {
              0%, 100% { box-shadow: 0 0 28px rgba(0,229,192,0.12), inset 0 0 28px rgba(0,229,192,0.05); }
              50% { box-shadow: 0 0 42px rgba(255,62,214,0.18), inset 0 0 32px rgba(255,62,214,0.06); }
            }
          `}</style>
          <div
            style={{
              width: 260,
              border: "1px solid rgba(0,229,192,0.42)",
              borderRadius: 8,
              background: "linear-gradient(145deg, rgba(7,10,28,0.88), rgba(18,10,44,0.72))",
              backdropFilter: "blur(18px)",
              padding: 16,
              animation: "speechPanelGlow 4.2s ease-in-out infinite",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "#00e5c0",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                fontSize: "calc(11px * var(--text-scale-tight, 1))",
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              Key Statistics
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { value: `${speechStats.accuracy}%`, unit: "", label: "Accuracy" },
                { value: speechStats.speed ? speechStats.speed.toFixed(1) : "0.0", unit: "x", label: "Speed" },
                { value: String(speechStats.minutes), unit: "min", label: "Time Spent" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ color: "#f4f7ff", fontFamily: "var(--font-display)", fontSize: "calc(22px * var(--text-scale-tight, 1))", fontWeight: 800, lineHeight: 1, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 2 }}>
                    <span>{stat.value}</span>
                    {stat.unit && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "calc(10px * var(--text-scale-tight, 1))", color: "rgba(220,230,255,0.66)", textTransform: "uppercase" }}>{stat.unit}</span>
                    )}
                  </div>
                  <div style={{ color: "rgba(200,215,235,0.62)", fontFamily: "var(--font-mono)", fontSize: "calc(9px * var(--text-scale-tight, 1))", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 7 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { value: speechStats.pronunciation, label: "การออกเสียง", color: "#00e5c0" },
                { value: speechStats.rhythm, label: "จังหวะ", color: "#00aaff" },
                { value: speechStats.confidence, label: "ความมั่นใจ", color: "#ff3ed6" },
              ].map((ring) => (
                <div key={ring.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      ...ringStyle(ring.value, ring.color),
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      margin: "0 auto 8px",
                      display: "grid",
                      placeItems: "center",
                      background: "conic-gradient(var(--ring-color) var(--ring-value), rgba(255,255,255,0.1) 0)",
                      animation: "speechRingSpin 3s ease-in-out infinite",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(8,10,24,0.92)",
                        color: "#fff",
                        fontFamily: "var(--font-display)",
                        fontSize: "calc(12px * var(--text-scale-tight, 1))",
                        fontWeight: 800,
                      }}
                    >
                      {ring.value}%
                    </div>
                  </div>
                  <div style={{ color: "rgba(235,242,255,0.72)", fontFamily: "var(--font-body)", fontSize: "calc(11px * var(--text-scale-tight, 1))", whiteSpace: "nowrap" }}>
                    {ring.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ color: "rgba(180,190,255,0.7)", fontFamily: "var(--font-mono)", fontSize: "calc(10px * var(--text-scale-tight, 1))", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
              Voice Frequency
            </div>
            <svg viewBox="0 0 260 78" preserveAspectRatio="none" style={{ width: "100%", height: 64, marginBottom: 16, border: "1px solid rgba(255,62,214,0.38)", background: "rgba(46,12,74,0.2)" }}>
              <defs>
                <linearGradient id="speechFreqLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#ff52df" />
                  <stop offset="54%" stopColor="#00e5c0" />
                  <stop offset="100%" stopColor="#1fb8ff" />
                </linearGradient>
              </defs>
              {[1, 2, 3].map((line) => (
                <path key={`h-${line}`} d={`M0 ${line * 19.5} H260`} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
              {[1, 2, 3, 4, 5].map((line) => (
                <path key={`v-${line}`} d={`M${line * 43.33} 0 V78`} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              ))}
              <polyline
                points={speechStats.frequency.map((value, index) => `${index * 20},${78 - value * 0.72}`).join(" ")}
                fill="none"
                stroke="url(#speechFreqLine)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>

            <div style={{ color: "rgba(180,190,255,0.7)", fontFamily: "var(--font-mono)", fontSize: "calc(10px * var(--text-scale-tight, 1))", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
              Progress
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 8, height: 78, padding: "10px 6px 16px", border: "1px solid rgba(255,62,214,0.28)", background: "rgba(31,10,58,0.16)" }}>
              <svg viewBox="0 0 226 78" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <polyline
                  points={speechStats.bars.map((height, index) => `${18 + index * 38},${70 - height * 0.55}`).join(" ")}
                  fill="none"
                  stroke="#ff66f2"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M202 18 L220 8 L216 28" fill="none" stroke="#ff66f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {speechStats.bars.map((height, index) => (
                <div
                  key={index}
                  style={{
                    width: 20,
                    height: `${height}%`,
                    position: "relative",
                    zIndex: 1,
                    background: index % 2 ? "linear-gradient(180deg, #ff6df0, #8f4dff)" : "linear-gradient(180deg, #00e5c0, #0388ff)",
                    boxShadow: "0 0 16px rgba(0,229,192,0.25)",
                    animation: `speechGraphWave ${1.8 + index * 0.13}s ease-in-out infinite`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", color: "rgba(220,235,255,0.46)", fontFamily: "var(--font-mono)", fontSize: "calc(9px * var(--text-scale-tight, 1))", marginTop: 5, textAlign: "center" }}>
              {[1, 2, 3, 4, 5, 6].map((week) => <span key={week}>{week}</span>)}
            </div>
            <div style={{ marginTop: 8, color: "rgba(220,235,255,0.52)", fontFamily: "var(--font-mono)", fontSize: "calc(10px * var(--text-scale-tight, 1))", letterSpacing: "0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Lv {speechStats.levelText} · {speechStats.stars} stars · {speechStats.totalAttempts} plays
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const stats = sceneStats[activeScene];
  if (!stats) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeScene}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="fixed right-4 md:right-10 top-20 md:top-24 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div
          className="stats-panel-bg rounded-xl border"
          style={{
            backgroundColor: "rgba(10, 10, 15, 0.75)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            padding: "calc(14px * var(--text-scale, 1)) calc(18px * var(--text-scale, 1))",
            minWidth: "calc(160px * var(--text-scale, 1))",
          }}
        >
          {/* Header label */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "rgba(0, 212, 170, 0.7)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "calc(10px * var(--text-scale, 1))",
              fontSize: "calc(11px * var(--text-scale, 1))",
              fontWeight: 600,
            }}
          >
            Key Statistics
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "calc(20px * var(--text-scale, 1))",
            }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                style={{ textAlign: "center", minWidth: "calc(52px * var(--text-scale, 1))" }}
              >
                {/* Value + unit */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: "calc(3px * var(--text-scale, 1))",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "#E8F2FF",
                      fontWeight: 700,
                      lineHeight: 1,
                      fontSize: "calc(26px * var(--text-scale, 1))",
                    }}
                  >
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "rgba(160, 180, 200, 0.7)",
                        fontSize: "calc(12px * var(--text-scale, 1))",
                      }}
                    >
                      {stat.unit}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "rgba(160, 180, 200, 0.6)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "calc(5px * var(--text-scale, 1))",
                    fontSize: "calc(11px * var(--text-scale, 1))",
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
