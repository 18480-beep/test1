import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDailySummaries, DailySummary } from "@/lib/supabase";

interface GameStats7DayProps {
  onCertificationReady?: (isReady: boolean) => void;
}

export default function GameStats7Day({ onCertificationReady }: GameStats7DayProps) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, [user?.id]);

  const loadSummaries = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await getDailySummaries(user.id, 7);
      setSummaries(data);

      // ตรวจสอบว่าครบ 7 วันหรือไม่
      onCertificationReady?.(data.length >= 7);
    } catch (err) {
      console.error("Error loading summaries:", err);
      setError("ไม่สามารถโหลดสถิติได้");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#00eeff" }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#ff2020" }}>
        {error}
      </div>
    );
  }

  const daysComplete = summaries.length;
  const daysRemaining = Math.max(0, 7 - daysComplete);
  const totalScore = summaries.reduce((sum, s) => sum + s.total_score, 0);
  const avgAccuracy =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.avg_accuracy, 0) / summaries.length
      : 0;
  const avgResponsiveness =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.avg_responsiveness, 0) / summaries.length
      : 0;

  const qualityThreshold = {
    excellent: avgAccuracy >= 85 && avgResponsiveness >= 85,
    veryGood: avgAccuracy >= 80 && avgResponsiveness >= 80,
    good: avgAccuracy >= 75 && avgResponsiveness >= 75,
  };

  let performanceLevel = "needs_improvement";
  let performanceColor = "#ff2020";
  let performanceLabel = "ต้องปรับปรุง";

  if (qualityThreshold.excellent) {
    performanceLevel = "excellent";
    performanceColor = "#00ff88";
    performanceLabel = "ดีเยี่ยม";
  } else if (qualityThreshold.veryGood) {
    performanceLevel = "veryGood";
    performanceColor = "#00eeff";
    performanceLabel = "ดีมาก";
  } else if (qualityThreshold.good) {
    performanceLevel = "good";
    performanceColor = "#ffcc00";
    performanceLabel = "ดี";
  }

  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "2rem",
        background: "rgba(0, 212, 170, 0.05)",
        border: "1px solid rgba(0, 212, 170, 0.2)",
        marginTop: "2rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          color: "#00eeff",
          marginBottom: "1.5rem",
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        🎮 สถิติเกม 7 วัน
      </h2>

      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <span>ความก้าวหน้า</span>
          <span
            style={{
              color: "#00eeff",
              fontWeight: 600,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {daysComplete}/7 วัน
          </span>
        </div>
        <div
          style={{
            height: "8px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(daysComplete / 7) * 100}%`,
              background: "linear-gradient(90deg, #00d4aa, #00eeff)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Status */}
      {daysComplete < 7 && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(255, 204, 0, 0.1)",
            border: "1px solid rgba(255, 204, 0, 0.3)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#ffcc00",
            fontSize: "0.9rem",
          }}
        >
          ⏳ ยังต้องเล่นต่ออีก {daysRemaining} วัน เพื่อได้ใบรับรอง
        </div>
      )}

      {daysComplete >= 7 && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(0, 255, 136, 0.1)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#00ff88",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          ✅ ครบ 7 วัน! คุณพร้อมสำหรับใบรับรอง
        </div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label="คะแนนรวม"
          value={totalScore.toLocaleString()}
          color="#00eeff"
        />
        <StatCard
          label="ความถูกต้อง"
          value={`${Math.round(avgAccuracy)}%`}
          color="#00ff88"
        />
        <StatCard
          label="ความตอบสนอง"
          value={`${Math.round(avgResponsiveness)}%`}
          color="#ffcc00"
        />
        <StatCard
          label="ประสิทธิภาพ"
          value={performanceLabel}
          color={performanceColor}
        />
      </div>

      {/* Daily Breakdown */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: "var(--font-mono)",
          }}
        >
          รายวัน
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "0.8rem",
          }}
        >
          {summaries.map((summary) => (
            <DayCard key={summary.summary_date} summary={summary} />
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div
        style={{
          padding: "1rem",
          background: "rgba(200, 150, 50, 0.05)",
          border: "1px solid rgba(200, 150, 50, 0.2)",
          borderRadius: "8px",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <p style={{ margin: "0 0 0.5rem 0" }}>
          💡 <strong>ข้อเสนอแนะ:</strong>
        </p>
        <p style={{ margin: 0 }}>
          {avgAccuracy >= 85 && avgResponsiveness >= 85
            ? "ยอดเยี่ยม! คุณแสดงความก้าวหน้าอย่างมีนัยสำคัญ ให้ช่วยเหลือและสนับสนุนอย่างต่อเนื่อง"
            : avgAccuracy >= 70 && avgResponsiveness >= 70
              ? "ดี! ให้ฝึกต่อเพื่อปรับปรุงความตอบสนองและความแม่นยำ"
              : "ให้ลองฝึกอย่างสม่ำเสมอ ความคงเส้นคงวาจะช่วยปรับปรุง"}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${color}44`,
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: color,
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DayCard({ summary }: { summary: DailySummary }) {
  const date = new Date(summary.summary_date);
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getDay()
  ];
  const dateStr = date.getDate();

  return (
    <div
      style={{
        padding: "1rem",
        background: "rgba(0, 238, 255, 0.05)",
        border: "1px solid rgba(0, 238, 255, 0.2)",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "0.3rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        {dayOfWeek}
      </div>
      <div
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#00eeff",
          marginBottom: "0.5rem",
        }}
      >
        {dateStr}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0.3rem",
        }}
      >
        {summary.games_played} เกม
      </div>
      <div
        style={{
          fontSize: "0.9rem",
          color: "#ffcc00",
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
        }}
      >
        {Math.round(summary.avg_accuracy)}%
      </div>
    </div>
  );
}
