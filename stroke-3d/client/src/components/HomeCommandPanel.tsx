import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock3,
  HeartPulse,
  Radio,
  Sparkles,
  Waves,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import NearbyBrainHospitals from "@/components/NearbyBrainHospitals";

interface SessionData {
  id: string;
  date: string;
  completed: boolean;
  reps: number;
  score: number;
  accuracy: number;
  rank: string;
}

interface SpeechProgressData {
  stage_id: string;
  chapter_id: number | null;
  stage_level: number | null;
  stage_name: string | null;
  stars: number;
  best_accuracy: number;
  last_played_at: string | null;
}

const cyan = "#68f6ff";
const mint = "#21ffd0";
const glass = "linear-gradient(145deg,rgba(10,22,44,0.84),rgba(5,14,28,0.90))";
const bdr = "1px solid rgba(104,246,255,0.14)";

const sidebarWidth = 72;

const STATS_GAP = 8;
const STATS_CARD_MIN_HEIGHT = 74;
const MAIN_BLOCK_MIN_HEIGHT = 430;
const COMMAND_DESKTOP_CANVAS_WIDTH = 2600;
const COMMAND_DESKTOP_MIN_SCALE = 0.68;
const COMMAND_HERO_SHIFT_Y = -20;
const scaledPx = (px: number) => `calc(${px}px * var(--text-scale-tight, 1))`;
const scaledClampPx = (min: number, fluid: string, max: number) =>
  `clamp(${scaledPx(min)}, ${fluid}, ${scaledPx(max)})`;

export default function HomeCommandPanel() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [speechProgress, setSpeechProgress] = useState<SpeechProgressData[]>([]);
  const { isMobile, isTablet, isTabletLarge, width, height } = useBreakpoint();

  const loadGameSessions = useCallback(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        if (!data) return;
        setSessions(
          data.map((s: any) => ({
            id: s.id,
            date: s.played_at?.slice(0, 10) ?? s.session_date ?? s.created_at?.slice(0, 10) ?? "-",
            completed: s.completed,
            reps: s.reps ?? s.hit_count ?? s.raw_data?.attempted ?? 0,
            score: s.score ?? 0,
            accuracy: s.accuracy ?? 0,
            rank: s.rank ?? s.raw_data?.rank ?? "-",
          })),
        );
      });
  }, [user]);

  const loadSpeechProgress = useCallback(() => {
    if (!user) {
      setSpeechProgress([]);
      return;
    }

    supabase
      .from("speech_stage_progress")
      .select("stage_id,chapter_id,stage_level,stage_name,stars,best_accuracy,last_played_at")
      .eq("user_id", user.id)
      .then(({ data }) => setSpeechProgress((data ?? []) as SpeechProgressData[]));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setSpeechProgress([]);
      return;
    }

    loadGameSessions();
    loadSpeechProgress();
  }, [loadGameSessions, loadSpeechProgress, user]);

  useEffect(() => {
    const reloadDashboardData = () => {
      loadGameSessions();
      loadSpeechProgress();
    };
    window.addEventListener("game-session-saved", reloadDashboardData);
    window.addEventListener("speech-progress-saved", reloadDashboardData);
    return () => {
      window.removeEventListener("game-session-saved", reloadDashboardData);
      window.removeEventListener("speech-progress-saved", reloadDashboardData);
    };
  }, [loadGameSessions, loadSpeechProgress]);

  const total = sessions.length;
  const avgAcc = total > 0 ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / total) : 0;
  const completedSessions = sessions.filter((s) => s.completed).length;

  const latestSpeechStage = [...speechProgress].sort((a, b) => {
    const cA = a.chapter_id ?? 0;
    const cB = b.chapter_id ?? 0;
    const lA = a.stage_level ?? Number(a.stage_id.split("-")[1] ?? 0);
    const lB = b.stage_level ?? Number(b.stage_id.split("-")[1] ?? 0);
    return cB - cA || lB - lA;
  })[0];

  const speechChapter = latestSpeechStage?.chapter_id ?? 1;
  const speechLevel = latestSpeechStage
    ? latestSpeechStage.stage_level ?? Number(latestSpeechStage.stage_id.split("-")[1] ?? 0)
    : 1;
  const speechStars = speechProgress.reduce((sum, p) => sum + (p.stars ?? 0), 0);
  const latestSync = sessions[0]?.date.slice(5) ?? "--:--";

  const statCards = [
    { label: "Atmosphere", value: `${avgAcc}%`, sub: "Avg Accuracy", Icon: Waves, color: "#ff3b4f", variant: "atmosphere" },
    { label: "Speech Level", value: `Lv. ${speechChapter}-${speechLevel}`, sub: `${speechStars} stars`, Icon: Activity, color: "#d98cff", variant: "speech" },
    { label: "เกมSPIDERSTROKE", value: `${completedSessions}`, sub: "จำนวนครั้งที่เล่น", Icon: Sparkles, color: "#ff3b3b", variant: "spiderstroke" },
    { label: "Active Sensors", value: `${total}`, sub: "Online", Icon: Radio, color: mint },
    { label: "Signal Strength", value: avgAcc >= 70 ? "OK" : "LOW", sub: "Connection", Icon: HeartPulse, color: avgAcc >= 70 ? mint : "#ff7070" },
    { label: "Last Sync", value: latestSync, sub: sessions.length ? "Latest" : "No Data", Icon: Clock3, color: cyan },
  ];

  // ── Responsive layout variables ──────────────────────────────────────────
  const isTabletAny     = isTablet || isTabletLarge;   // phone landscape / iPad ทุกรุ่น
  const isDenseViewport = !isMobile && (width < 1500 || height < 820);
  const isShortViewport = !isMobile && height < 760;
  const isCompactDesktop = isTabletLarge || width < 1380 || isShortViewport;
  const isRoomyDesktop  = !isMobile && !isTabletAny && !isCompactDesktop;

  const mainCols = isMobile
    ? "1fr"
    : isTabletAny
      ? "1fr"
      : isCompactDesktop
        ? "minmax(250px, 310px) minmax(0, 1fr)"
        : "minmax(280px, 310px) minmax(0, 1fr) minmax(220px, 260px)";

  const mainMinHeight = isDenseViewport ? 340 : MAIN_BLOCK_MIN_HEIGHT;
  const panelGap      = isMobile ? 14 : isDenseViewport ? 12 : 18;

  const sidePad = isMobile
    ? 14
    : isTabletAny
      ? sidebarWidth + 18
      : isDenseViewport
        ? sidebarWidth + 22
        : sidebarWidth + 34;

  const topPad = isMobile ? 76 : isDenseViewport ? 72 : 86;

  const contentInset = isMobile || isTabletAny
    ? 0
    : isDenseViewport
      ? `clamp(72px, 5.4vw, 110px)`
      : `clamp(118px, 8vw, 152px)`;

  const headerMaxWidth = isMobile || isTabletAny
    ? "none"
    : isDenseViewport
      ? "min(760px, calc(100% - clamp(72px, 5.4vw, 110px)))"
      : "min(860px, calc(100% - clamp(118px, 8vw, 152px)))";

  const statsMinWidth = isMobile ? 140 : isDenseViewport ? 178 : 210;

  const commandScale = isMobile || isTabletAny
    ? 1
    : Math.min(1, Math.max(COMMAND_DESKTOP_MIN_SCALE, width / COMMAND_DESKTOP_CANVAS_WIDTH));

  const heroShiftX    = isMobile || isTabletAny ? 0 : -150;
  const heroTransform = heroShiftX !== 0
    ? `translate(${heroShiftX}px, ${COMMAND_HERO_SHIFT_Y}px)`
    : `translate(0px, ${COMMAND_HERO_SHIFT_Y}px)`;
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 15,
        pointerEvents: "auto",
        overflowY: "auto",
        overflowX: "hidden",
        padding: `${topPad}px ${sidePad}px 40px`,
        background:
          "radial-gradient(ellipse 70% 40% at 60% 0%,rgba(80,140,200,0.08),transparent 55%)," +
          "linear-gradient(160deg,rgba(3,9,20,0.58),rgba(5,14,28,0.46) 55%,rgba(2,8,18,0.64))",
      }}
    >
      <style>{`
        @keyframes hcp-pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes hcp-dash { to { stroke-dashoffset: -120 } }
        @keyframes hcp-purple-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,.18), inset 0 1px 0 rgba(255,255,255,.06); }
          50% { box-shadow: 0 0 34px rgba(217,140,255,.36), inset 0 1px 0 rgba(255,255,255,.1); }
        }
        @keyframes hcp-purple-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hglass {
          background: ${glass};
          border: ${bdr};
          box-shadow: 0 16px 40px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.04);
          backdrop-filter: blur(18px);
        }
        .hcp-card-btn {
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.04);
          color: #eaf6ff;
          border-radius: 12px;
          padding: 18px 14px;
          display: grid;
          place-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all .2s;
          font-size: calc(17px * var(--text-scale-tight, 1));
          font-family: monospace;
        }
        .hcp-card-btn:hover {
          background: rgba(104,246,255,.08);
          border-color: rgba(104,246,255,.25);
          color: ${cyan};
        }
      `}</style>

      <div
        style={{
          width: commandScale === 1 ? "100%" : `${100 / commandScale}%`,
          display: "grid",
          gap: panelGap,
          transform: commandScale === 1 ? undefined : `scale(${commandScale})`,
          transformOrigin: "top left",
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
            gap: panelGap,
            alignItems: "start",
            marginLeft: contentInset,
            maxWidth: headerMaxWidth,
            transform: heroTransform,
          }}
        >
          <div>
            <div
              style={{
                color: cyan,
                fontFamily: "monospace",
                fontSize: scaledPx(isDenseViewport ? 12 : 15),
                letterSpacing: ".1em",
                textTransform: "uppercase",
                marginBottom: isDenseViewport ? 6 : 8,
              }}
            >
              Stroke Rehab
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile
                    ? scaledClampPx(26, "8vw", 36)
                  : isDenseViewport
                    ? scaledClampPx(30, "4.8vw", 46)
                    : scaledClampPx(34, "7vw", 58),
                lineHeight: 1,
                fontWeight: 200,
                color: "#f0f8ff",
                letterSpacing: "-.01em",
                fontFamily: "var(--font-display, 'Syne', sans-serif)",
              }}
            >
              Command Center
            </h1>
            <p
              style={{
                margin: isDenseViewport ? "8px 0 0" : "12px 0 0",
                color: "rgba(210,235,255,.76)",
                fontSize: isMobile
                    ? scaledClampPx(12, "3.5vw", 14)
                  : isDenseViewport
                    ? scaledClampPx(12, "1.5vw", 14)
                    : scaledClampPx(14, "2vw", 17),
                lineHeight: isDenseViewport ? 1.45 : 1.65,
                maxWidth: width > 1600 ? 820 : 720,
              }}
            >
              Real-time monitoring, rehabilitation progress, and emergency route guidance.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginTop: isDenseViewport ? 10 : 16,
                color: "rgba(210,235,255,.65)",
                fontFamily: "monospace",
                fontSize: isMobile
                    ? scaledClampPx(11, "3vw", 13)
                  : isDenseViewport
                    ? scaledClampPx(11, "1.4vw", 13)
                    : scaledClampPx(13, "2vw", 17),
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: mint,
                  boxShadow: `0 0 16px ${mint}`,
                  animation: "hcp-pulse 2s infinite",
                }}
              />
              SYSTEM STATUS:
              <strong style={{ color: mint }}>OPTIMAL</strong>
              <span style={{ color: "rgba(210,235,255,.42)" }}>All streams synchronized.</span>
            </div>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${statsMinWidth}px), 1fr))`,
            gap: STATS_GAP,
          }}
        >
          {statCards.map(({ label, value, sub, Icon, color, variant }) => {
            const isSpiderstroke = variant === "spiderstroke";
            const isSpeech = variant === "speech";
            const isAtmosphere = variant === "atmosphere";
            return (
              <div
                key={label}
                className="hglass"
                style={{
                  borderRadius: 14,
                  padding: isDenseViewport ? "8px 10px" : "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "40px minmax(0, 1fr)",
                  gap: 12,
                  alignItems: "center",
                  minHeight: isDenseViewport ? 62 : STATS_CARD_MIN_HEIGHT,
                  background: isSpiderstroke
                    ? "linear-gradient(145deg,rgba(48,6,12,0.9),rgba(10,10,24,0.92))"
                    : isSpeech
                      ? "linear-gradient(145deg,rgba(36,13,64,0.92),rgba(8,12,32,0.94))"
                      : isAtmosphere
                        ? "linear-gradient(135deg,rgba(92,8,18,0.95) 0%,rgba(24,16,40,0.93) 48%,rgba(5,54,76,0.92) 100%)"
                        : undefined,
                  backgroundSize: isSpeech || isAtmosphere ? "180% 180%" : undefined,
                  border: isSpiderstroke
                    ? "1px solid rgba(255,59,59,0.46)"
                    : isSpeech
                      ? "1px solid rgba(217,140,255,0.52)"
                      : isAtmosphere
                        ? "1px solid rgba(98,232,255,0.62)"
                        : undefined,
                  boxShadow: isSpiderstroke
                    ? "0 0 24px rgba(255,0,45,0.18), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : isSpeech
                      ? "0 0 24px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"
                      : isAtmosphere
                        ? "0 0 26px rgba(255,59,79,0.28), 0 0 26px rgba(98,232,255,0.24), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : undefined,
                  animation: isSpeech ? "hcp-purple-glow 3.2s ease-in-out infinite" : undefined,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: isSpiderstroke
                      ? "rgba(255,59,59,.12)"
                      : isSpeech
                        ? "linear-gradient(135deg,rgba(217,140,255,.2),rgba(104,246,255,.08))"
                        : isAtmosphere
                          ? "linear-gradient(135deg,rgba(255,59,79,.26) 0%,rgba(98,232,255,.22) 100%)"
                          : "rgba(104,246,255,.08)",
                    border: isSpiderstroke
                      ? "1px solid rgba(255,59,59,.35)"
                      : isSpeech
                        ? "1px solid rgba(217,140,255,.42)"
                        : isAtmosphere
                          ? "1px solid rgba(98,232,255,.58)"
                          : "1px solid rgba(104,246,255,.14)",
                    boxShadow: isSpiderstroke
                      ? "0 0 18px rgba(255,59,59,.22)"
                      : isSpeech
                        ? "0 0 20px rgba(217,140,255,.32)"
                        : isAtmosphere
                          ? "0 0 16px rgba(255,59,79,.34), 0 0 18px rgba(98,232,255,.32), inset 0 0 14px rgba(98,232,255,.1)"
                          : undefined,
                  }}
                >
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div
                    style={{
                      color: isSpiderstroke
                        ? "rgba(255,198,198,.82)"
                        : isSpeech
                          ? "rgba(238,214,255,.9)"
                          : isAtmosphere
                            ? "rgba(255,205,210,.92)"
                            : "rgba(210,240,255,.55)",
                      fontFamily: "monospace",
                      fontSize: scaledPx(11),
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      fontWeight: isSpiderstroke || isSpeech || isAtmosphere ? 800 : undefined,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      color,
                      fontSize: isMobile ? scaledClampPx(18, "5vw", 24) : scaledClampPx(20, "2vw", 28),
                      fontWeight: 900,
                      lineHeight: 1.1,
                      marginTop: 6,
                      textShadow: isSpiderstroke
                        ? "0 0 16px rgba(255,59,59,.55)"
                        : isSpeech
                          ? "0 0 18px rgba(217,140,255,.72)"
                          : isAtmosphere
                            ? "0 0 14px rgba(255,59,79,.7), 0 0 18px rgba(98,232,255,.42)"
                            : undefined,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      color: isSpiderstroke
                        ? "rgba(255,230,230,.92)"
                        : isSpeech
                          ? "rgba(236,205,255,.92)"
                          : isAtmosphere
                            ? "rgba(255,226,229,.94)"
                            : "rgba(130,255,215,.8)",
                      fontSize: isMobile ? scaledClampPx(11, "3vw", 13) : scaledClampPx(12, "1.4vw", 16),
                      fontWeight: isSpiderstroke || isSpeech || isAtmosphere ? 700 : undefined,
                      marginTop: 6,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: mainCols,
            gap: panelGap,
            minHeight: isMobile ? "auto" : mainMinHeight,
            alignItems: "stretch",
            marginLeft: contentInset,
            minWidth: 0,
          }}
        >
          <MissionTrajectory distance="3.6 กม." accuracy={Math.max(92, avgAcc)} compact={isDenseViewport} />
          <NearbyBrainHospitals compact={isDenseViewport} />

          {isRoomyDesktop && (
            <aside style={{ display: "flex", minHeight: 0 }}>
              <div
                className="hglass"
                style={{
                  borderRadius: 14,
                  padding: "18px 18px",
                  flex: 1,
                  minHeight: isMobile ? 180 : "100%",
                }}
              />
            </aside>
          )}
        </section>

        <section
          className="hglass"
          style={{
            borderRadius: 14,
            padding: "20px 24px",
            marginLeft: contentInset,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTabletAny
                ? "1fr"
                : isDenseViewport
                  ? "repeat(2, minmax(0, 1fr))"
                  : "1.25fr 1fr 1fr 1fr",
              gap: panelGap,
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 6px",
                  color: cyan,
                  fontSize: scaledPx(isDenseViewport ? 15 : 18),
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  letterSpacing: ".06em",
                }}
              >
                Sector 7 Diagnostics
              </h2>
              <p style={{ margin: 0, color: "rgba(210,240,255,.55)", fontSize: scaledPx(isDenseViewport ? 13 : 17), lineHeight: isDenseViewport ? 1.45 : 1.65 }}>
                Recovery systems reporting peak filtration cycles.
                <br />
                Neural pathways show {avgAcc}% bio-performance increase.
              </p>
            </div>

            {[
              { label: "Neural Pathways", value: `${avgAcc}%`, sub: "Bio-performance", icon: "🧠" },
              { label: "Filtration Cycles", value: "Peak", sub: "Optimal", icon: "⚡", color: mint },
              { label: "Anomalies", value: "None", sub: "Detected", icon: "🧪", color: mint },
            ].map(({ label, value, sub, icon, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: isDenseViewport ? "10px 12px" : "14px 16px",
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(104,246,255,.07)",
                    border: "1px solid rgba(104,246,255,.12)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: scaledPx(22),
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: scaledPx(isDenseViewport ? 11 : 14),
                      color: "rgba(210,240,255,.5)",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: scaledPx(isDenseViewport ? 19 : 24), fontWeight: 800, color: color ?? cyan, lineHeight: 1.15 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: scaledPx(isDenseViewport ? 12 : 17), color: "rgba(210,240,255,.5)" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function MissionTrajectory({ distance, accuracy, compact = false }: { distance: string; accuracy: number; compact?: boolean }) {
  return (
    <div
      className="hglass"
      style={{
        borderRadius: 14,
        padding: compact ? "14px 14px" : "20px 20px",
        display: "flex",
        flexDirection: "column",
        minHeight: compact ? 340 : MAIN_BLOCK_MIN_HEIGHT,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h2
            style={{
              margin: 0,
              color: cyan,
              fontSize: scaledPx(compact ? 15 : 18),
              textTransform: "uppercase",
              fontFamily: "monospace",
              letterSpacing: ".06em",
            }}
          >
            Mission Trajectory
          </h2>
          <p style={{ margin: "8px 0 0", color: "rgba(210,240,255,.6)", fontSize: scaledPx(compact ? 13 : 17), lineHeight: 1.5 }}>
            Real-time vector analysis
          </p>
        </div>
        <span
          style={{
            color: mint,
            background: "rgba(33,255,208,.1)",
            border: "1px solid rgba(33,255,208,.25)",
            borderRadius: 8,
            padding: compact ? "5px 9px" : "6px 12px",
            fontSize: scaledPx(compact ? 12 : 15),
            fontFamily: "monospace",
          }}
        >
          ● LIVE
        </span>
      </div>

      <svg viewBox="0 0 300 200" style={{ width: "100%", flex: "0 0 auto", height: compact ? 154 : 220, marginTop: compact ? 2 : 8 }}>
        <defs>
          <linearGradient id="traj" x1="0" x2="1">
            <stop offset="0" stopColor={mint} />
            <stop offset="1" stopColor={cyan} />
          </linearGradient>
        </defs>
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="20" x2="280" y1={30 + i * 30} y2={30 + i * 30} stroke="rgba(104,246,255,.07)" strokeWidth="1" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 40} x2={20 + i * 40} y1="20" y2="185" stroke="rgba(104,246,255,.07)" strokeWidth="1" />
        ))}
        <path
          d="M40 170 C70 148 100 128 130 110 C165 88 150 55 200 40 C225 32 248 28 268 24"
          fill="none"
          stroke="url(#traj)"
          strokeWidth="2.5"
          strokeDasharray="10 7"
          style={{ animation: "hcp-dash 3.5s linear infinite" }}
        />
        <circle cx="40" cy="170" r="6" fill={mint} filter="drop-shadow(0 0 8px #21ffd0)" />
        <circle cx="268" cy="24" r="5" fill={cyan} filter="drop-shadow(0 0 8px #68f6ff)" />
      </svg>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.08)",
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          paddingTop: compact ? 12 : 18,
          marginTop: compact ? 6 : 10,
        }}
      >
        {[
          ["Distance", distance],
          ["Vector Accuracy", `${accuracy}%`],
          ["Status", "Tracking"],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ color: "rgba(210,240,255,.48)", fontSize: scaledPx(compact ? 12 : 15), marginBottom: 5 }}>{label}</div>
            <strong style={{ color: value === "Tracking" ? mint : "#fff", fontSize: scaledPx(compact ? 17 : 22) }}>{value}</strong>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: compact ? 10 : 16,
          borderRadius: 10,
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.06)",
          padding: compact ? "10px 12px" : "14px 15px",
          color: "rgba(210,240,255,.55)",
          fontSize: scaledPx(compact ? 12 : 17),
          lineHeight: compact ? 1.45 : 1.65,
        }}
      >
        Route locks onto the selected hospital. If none is selected, nearest facility is used automatically.
      </div>
    </div>
  );
}
