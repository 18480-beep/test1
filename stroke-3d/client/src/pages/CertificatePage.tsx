import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserCertification,
  checkAndIssueCertification,
  UserCertification,
} from "@/lib/supabase";

interface CertificatePageProps {
  onBack?: () => void;
}

export default function CertificatePage({ onBack }: CertificatePageProps) {
  const { user } = useAuth();
  const [cert, setCert] = useState<UserCertification | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadCertificate();
  }, [user?.id]);

  const loadCertificate = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const existingCert = await getUserCertification(user.id);
      setCert(existingCert);
    } catch (err) {
      console.error("Error loading certificate:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndIssue = async () => {
    if (!user?.id) return;

    setChecking(true);
    try {
      const result = await checkAndIssueCertification();

      if (result?.[0]?.certification_issued) {
        setMessage({
          type: "success",
          text: `✅ ${result[0].message}`,
        });
        // Reload certificate
        await loadCertificate();
      } else {
        setMessage({
          type: "info",
          text: `ℹ️ ${result?.[0]?.message || "ไม่สามารถออกใบรับรองได้"}`,
        });
      }
    } catch (err) {
      console.error("Error issuing certificate:", err);
      setMessage({
        type: "error",
        text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #04060f, #071016)",
          color: "#00eeff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "3px solid rgba(0,238,255,0.2)",
              borderTopColor: "#00eeff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <div>กำลังโหลด...</div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #04060f, #071016)",
        color: "#e0e8ff",
        padding: "2rem 1rem",
      }}
    >
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            top: "1.5rem",
            left: "1.5rem",
            zIndex: 100,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.15)";
            (e.target as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.1)";
            (e.target as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.7)";
          }}
        >
          ← ย้อนกลับ
        </button>
      )}

      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "3rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontFamily: "'Orbitron', sans-serif",
              color: "#00eeff",
              textShadow: "0 0 40px rgba(0,238,255,0.5)",
              margin: "0 0 0.5rem",
              letterSpacing: "0.1em",
            }}
          >
            🏆 CERTIFICATE
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.95rem",
              margin: 0,
            }}
          >
            ใบรับรองการออกกำลังกายและฟื้นฟูสมรรถภาพ
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "2rem",
              background:
                message.type === "success"
                  ? "rgba(0, 255, 136, 0.1)"
                  : message.type === "error"
                    ? "rgba(255, 32, 32, 0.1)"
                    : "rgba(0, 238, 255, 0.1)",
              border:
                message.type === "success"
                  ? "1px solid rgba(0, 255, 136, 0.3)"
                  : message.type === "error"
                    ? "1px solid rgba(255, 32, 32, 0.3)"
                    : "1px solid rgba(0, 238, 255, 0.3)",
              color:
                message.type === "success"
                  ? "#00ff88"
                  : message.type === "error"
                    ? "#ff2020"
                    : "#00eeff",
              fontSize: "0.9rem",
            }}
          >
            {message.text}
          </div>
        )}

        {cert ? (
          /* Certificate Display */
          <div
            style={{
              background: "linear-gradient(135deg, rgba(10,14,30,0.95), rgba(15,20,40,0.95))",
              border: "2px solid rgba(0, 212, 170, 0.4)",
              borderRadius: "16px",
              padding: "3rem 2rem",
              textAlign: "center",
              boxShadow: "0 20px 80px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,212,170,0.1)",
              marginBottom: "2rem",
            }}
          >
            {/* Decorative elements */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "3rem",
              }}
            >
              ✨
            </div>

            {/* Certificate Content */}
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#00d4aa",
                marginBottom: "0.5rem",
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              ยินดีด้วย!
            </h2>

            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "2rem",
              }}
            >
              คุณได้สำเร็จการออกกำลังกายและฟื้นฟูสมรรถภาพ
            </p>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <StatBox
                label="ช่วงเวลา"
                value={`${formatDate(cert.period_start)} ถึง ${formatDate(cert.period_end)}`}
              />
              <StatBox label="เกมทั้งหมด" value={`${cert.total_games} เกม`} />
              <StatBox label="คะแนนรวม" value={cert.total_score.toLocaleString()} />
              <StatBox
                label="ความถูกต้อง"
                value={`${Math.round(cert.avg_accuracy)}%`}
              />
            </div>

            {/* Performance Badge */}
            <div
              style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                background: getPerformanceBackground(cert.overall_performance),
                border: `2px solid ${getPerformanceColor(cert.overall_performance)}`,
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  color: getPerformanceColor(cert.overall_performance),
                  fontWeight: 700,
                  marginBottom: "0.3rem",
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                {getPerformanceLabel(cert.overall_performance)}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                ผลประเมินโดยรวม
              </div>
            </div>

            {/* Certificate Code */}
            <div
              style={{
                padding: "1rem",
                background: "rgba(0,238,255,0.08)",
                border: "1px dashed rgba(0,238,255,0.3)",
                borderRadius: "8px",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "0.3rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Certificate Code
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  color: "#00eeff",
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  userSelect: "all",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  navigator.clipboard.writeText(cert.cert_code);
                  alert("คัดลอกแล้ว!");
                }}
              >
                {cert.cert_code}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.3)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "1rem",
              }}
            >
              ออกให้เมื่อ {formatDate(cert.issued_at)}
            </div>
          </div>
        ) : (
          /* No Certificate Yet */
          <div
            style={{
              background: "rgba(0,212,170,0.05)",
              border: "1px solid rgba(0,212,170,0.2)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "1.5rem",
              }}
            >
              ยังไม่มีใบรับรองสำหรับบัญชีนี้
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "2rem",
                lineHeight: 1.6,
              }}
            >
              เมื่อคุณเล่นเกมครบ 7 วัน คลิกปุ่มด้านล่างเพื่อตรวจสอบและออกใบรับรอง
            </p>
            <button
              onClick={handleCheckAndIssue}
              disabled={checking}
              style={{
                padding: "1rem 2rem",
                background: "linear-gradient(135deg, #00d4aa, #00eeff)",
                border: "none",
                color: "#000",
                fontWeight: 700,
                borderRadius: "10px",
                cursor: checking ? "not-allowed" : "pointer",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                opacity: checking ? 0.7 : 1,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                if (!checking) {
                  (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.target as HTMLButtonElement).style.boxShadow =
                    "0 12px 35px rgba(0, 212, 170, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {checking ? "กำลังตรวจสอบ..." : "✓ ตรวจสอบและออกใบรับรอง"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: "1rem",
        background: "rgba(0,238,255,0.05)",
        border: "1px solid rgba(0,238,255,0.2)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "0.3rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1rem",
          color: "#00eeff",
          fontWeight: 700,
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPerformanceColor(performance: string): string {
  switch (performance) {
    case "excellent":
      return "#00ff88";
    case "very_good":
      return "#00eeff";
    case "good":
      return "#ffcc00";
    case "satisfactory":
      return "#ff9500";
    default:
      return "#ff2020";
  }
}

function getPerformanceBackground(performance: string): string {
  switch (performance) {
    case "excellent":
      return "rgba(0, 255, 136, 0.1)";
    case "very_good":
      return "rgba(0, 238, 255, 0.1)";
    case "good":
      return "rgba(255, 204, 0, 0.1)";
    case "satisfactory":
      return "rgba(255, 149, 0, 0.1)";
    default:
      return "rgba(255, 32, 32, 0.1)";
  }
}

function getPerformanceLabel(performance: string): string {
  switch (performance) {
    case "excellent":
      return "ดีเยี่ยม";
    case "very_good":
      return "ดีมาก";
    case "good":
      return "ดี";
    case "satisfactory":
      return "ตอบสนอง";
    default:
      return "ต้องปรับปรุง";
  }
}
