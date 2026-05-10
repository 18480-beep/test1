import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GameResultSummary, { GameResult } from "./GameResultSummary";
import { saveGameSession } from "@/lib/supabase";

interface BeatSlashGameProps {
  onGameEnd?: () => void;
  onBackClick?: () => void;
}

export default function BeatSlashGame({
  onGameEnd,
  onBackClick,
}: BeatSlashGameProps) {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // ตรวจสอบ origin เพื่อความปลอดภัย
      if (!event.origin.includes(window.location.hostname)) return;

      const { type, payload } = event.data;

      if (type === "GAME_END") {
        // เมื่อเกมจบ
        const result: GameResult = {
          score: payload.score || 0,
          accuracy:
            payload.accuracy || (payload.hit / (payload.hit + payload.miss)) * 100 || 0,
          leftHandScore: payload.leftHandScore || 50,
          rightHandScore: payload.rightHandScore || 50,
          responseTimeMs: payload.responseTimeMs || 500,
          hitCount: payload.hit || 0,
          missCount: payload.miss || 0,
          combo: payload.combo || 0,
          durationSec: payload.duration || 0,
        };

        setGameResult(result);
        setShowResult(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSaveResult = async () => {
    if (!gameResult || !user) return;

    setIsSaving(true);
    try {
      await saveGameSession({
        gameType: "beat_slash",
        score: gameResult.score,
        durationSec: gameResult.durationSec,
        hitCount: gameResult.hitCount,
        missCount: gameResult.missCount,
        combo: gameResult.combo,
        accuracy: gameResult.accuracy,
        leftHandScore: gameResult.leftHandScore,
        rightHandScore: gameResult.rightHandScore,
        responseTimeMs: gameResult.responseTimeMs,
        rawData: {
          gameType: "beat_slash",
          timestamp: new Date().toISOString(),
        },
      });

      console.log("Game result saved successfully");

      // ปิด result modal
      setShowResult(false);
      setGameResult(null);

      // Trigger callback
      onGameEnd?.();
    } catch (error) {
      console.error("Failed to save game result:", error);
      alert("ไม่สามารถบันทึกผลเล่นได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "linear-gradient(135deg, #04060f, #071016)",
        overflow: "hidden",
      }}
    >
      {/* Back Button */}
      {onBackClick && (
        <button
          onClick={onBackClick}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
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

      {/* Game iframe */}
      <iframe
        ref={iframeRef}
        src="/game/index.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#04060f",
        }}
        allowFullScreen
      />

      {/* Result Summary */}
      {showResult && gameResult && (
        <GameResultSummary
          result={gameResult}
          gameType="beat_slash"
          onClose={() => {
            setShowResult(false);
            setGameResult(null);
          }}
          onSave={handleSaveResult}
        />
      )}

      {/* Saving Indicator */}
      {isSaving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(10,14,30,0.95)",
              padding: "2rem",
              borderRadius: "12px",
              textAlign: "center",
              color: "#00eeff",
              fontWeight: 600,
            }}
          >
            <div style={{ marginBottom: "1rem" }}>กำลังบันทึกผล...</div>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(0,238,255,0.2)",
                borderTopColor: "#00eeff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
