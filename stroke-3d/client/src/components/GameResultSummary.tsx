import { useState, useEffect } from "react";
import { DailySummary } from "@/lib/supabase";

export type GameResult = {
  score: number;
  accuracy: number;
  leftHandScore: number;
  rightHandScore: number;
  responseTimeMs: number;
  hitCount: number;
  missCount: number;
  combo: number;
  durationSec: number;
};

interface GameResultSummaryProps {
  result: GameResult;
  gameType: "beat_slash" | "brain_game";
  onClose?: () => void;
  onSave?: () => void;
}

// ฟังก์ชันประเมินคุณภาพ
function getQualityLabel(
  score: number
): "excellent" | "good" | "normal" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "normal";
  return "poor";
}

function getQualityColor(quality: string) {
  switch (quality) {
    case "excellent":
      return "#00ff88"; // green
    case "good":
      return "#00eeff"; // cyan
    case "normal":
      return "#ffcc00"; // gold
    case "poor":
      return "#ff2020"; // red
    default:
      return "#e0e8ff";
  }
}

function getQualityIcon(quality: string) {
  switch (quality) {
    case "excellent":
      return "🟢";
    case "good":
      return "🔵";
    case "normal":
      return "🟡";
    case "poor":
      return "🔴";
    default:
      return "⚪";
  }
}

const labels = {
  th: {
    title: "สรุปผลเล่นเกม",
    score: "คะแนน",
    accuracy: "ความถูกต้อง",
    responseTime: "ความตอบสนอง",
    leftArm: "แขนซ้าย",
    rightArm: "แขนขวา",
    excellent: "ดีเยี่ยม",
    good: "ดี",
    normal: "ปกติ",
    poor: "ต้องปรับปรุง",
    hitCount: "ตีโดนครั้ง",
    missCount: "พลาดครั้ง",
    combo: "Combo สูงสุด",
    duration: "ระยะเวลา",
    close: "ปิด",
    continueGame: "เล่นต่อ",
  },
  en: {
    title: "Game Summary",
    score: "Score",
    accuracy: "Accuracy",
    responseTime: "Responsiveness",
    leftArm: "Left Arm",
    rightArm: "Right Arm",
    excellent: "Excellent",
    good: "Good",
    normal: "Normal",
    poor: "Needs Improvement",
    hitCount: "Hits",
    missCount: "Misses",
    combo: "Max Combo",
    duration: "Duration",
    close: "Close",
    continueGame: "Continue",
  },
};

export default function GameResultSummary({
  result,
  gameType,
  onClose,
  onSave,
}: GameResultSummaryProps) {
  const lang = "th"; // TODO: get from context
  const t = labels[lang];

  const leftQuality = getQualityLabel(result.leftHandScore);
  const rightQuality = getQualityLabel(result.rightHandScore);
  const responsiveness = Math.round(
    100 - Math.min(result.responseTimeMs / 10, 100)
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(4, 6, 15, 0.96)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background:
            "linear-gradient(180deg, rgba(10,14,30,0.95), rgba(15,20,40,0.95))",
          border: "1px solid rgba(0, 238, 255, 0.3)",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
          animation: "slideUp 0.4s ease",
        }}
      >
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .metric-label {
            font-size: 0.95rem;
            color: rgba(255,255,255,0.6);
            font-weight: 500;
          }
          .metric-value {
            font-size: 1.4rem;
            font-weight: 700;
            font-family: 'Orbitron', monospace;
            color: #00eeff;
            text-shadow: 0 0 20px rgba(0,238,255,0.5);
          }
          .quality-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 0.9rem;
            font-weight: 600;
          }
          .arm-section {
            margin: 1.5rem 0;
            padding: 1rem;
            border-radius: 12px;
            background: rgba(0, 238, 255, 0.05);
            border: 1px solid rgba(0, 238, 255, 0.15);
          }
          .progress-bar {
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00eeff);
            border-radius: 4px;
            transition: width 0.6s ease;
          }
          .action-row {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }
          .btn {
            flex: 1;
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .btn-primary {
            background: linear-gradient(135deg, #00d4aa, #00eeff);
            color: #000;
            box-shadow: 0 8px 25px rgba(0, 212, 170, 0.4);
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(0, 212, 170, 0.6);
          }
          .btn-secondary {
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.7);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .btn-secondary:hover {
            background: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.4);
            color: #fff;
          }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontFamily: "'Orbitron', sans-serif",
              color: "#00eeff",
              margin: "0 0 0.5rem",
              textShadow: "0 0 30px rgba(0,238,255,0.5)",
              letterSpacing: "0.1em",
            }}
          >
            {t.title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            {gameType === "beat_slash" ? "🎮 BEAT SLASH" : "🧠 Brain Game"}
          </p>
        </div>

        {/* Score */}
        <div className="metric-row">
          <span className="metric-label">{t.score}</span>
          <span className="metric-value">{result.score}</span>
        </div>

        {/* Accuracy */}
        <div className="metric-row">
          <span className="metric-label">{t.accuracy}</span>
          <span className="metric-value">{Math.round(result.accuracy)}%</span>
        </div>

        {/* Response Time */}
        <div className="metric-row">
          <span className="metric-label">{t.responseTime}</span>
          <span className="metric-value">{responsiveness}%</span>
        </div>

        {/* Left Arm */}
        <div className="arm-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
              {t.leftArm}
            </span>
            <div
              className="quality-badge"
              style={{
                color: getQualityColor(leftQuality),
                borderColor: getQualityColor(leftQuality),
                background: `rgba(${getQualityColor(leftQuality)}, 0.1)`,
              }}
            >
              <span>{getQualityIcon(leftQuality)}</span>
              <span>
                {leftQuality === "excellent"
                  ? t.excellent
                  : leftQuality === "good"
                    ? t.good
                    : leftQuality === "normal"
                      ? t.normal
                      : t.poor}
              </span>
            </div>
          </div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
            {Math.round(result.leftHandScore)}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${result.leftHandScore}%` }}
            />
          </div>
        </div>

        {/* Right Arm */}
        <div className="arm-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
              {t.rightArm}
            </span>
            <div
              className="quality-badge"
              style={{
                color: getQualityColor(rightQuality),
                borderColor: getQualityColor(rightQuality),
                background: `rgba(${getQualityColor(rightQuality)}, 0.1)`,
              }}
            >
              <span>{getQualityIcon(rightQuality)}</span>
              <span>
                {rightQuality === "excellent"
                  ? t.excellent
                  : rightQuality === "good"
                    ? t.good
                    : rightQuality === "normal"
                      ? t.normal
                      : t.poor}
              </span>
            </div>
          </div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
            {Math.round(result.rightHandScore)}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${result.rightHandScore}%` }}
            />
          </div>
        </div>

        {/* Extra Stats */}
        <div className="metric-row">
          <span className="metric-label">{t.hitCount}</span>
          <span className="metric-value" style={{ fontSize: "1.2rem" }}>
            {result.hitCount}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">{t.missCount}</span>
          <span
            className="metric-value"
            style={{ fontSize: "1.2rem", color: "#ff2020" }}
          >
            {result.missCount}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">{t.combo}</span>
          <span className="metric-value" style={{ fontSize: "1.2rem" }}>
            {result.combo}x
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">{t.duration}</span>
          <span className="metric-value" style={{ fontSize: "1.2rem" }}>
            {formatTime(result.durationSec)}
          </span>
        </div>

        {/* Actions */}
        <div className="action-row">
          <button className="btn btn-primary" onClick={onSave}>
            💾 บันทึก
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
