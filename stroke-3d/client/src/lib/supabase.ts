/*
 * Supabase Client
 * - ใช้ persistSession + autoRefreshToken เพื่อให้ผู้ใช้คงสถานะล็อกอิน
 *   ข้ามการเปิดเบราว์เซอร์ใหม่และ sync ข้ามอุปกรณ์ (เมื่อใช้บัญชีเดียวกัน)
 * - ใช้ detectSessionInUrl เพื่อจัดการ Google OAuth callback อัตโนมัติ
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://cugjecldmbxxofzbbtbj.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Z2plY2xkbWJ4eG9memJidGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjEzMjEsImV4cCI6MjA5MzAzNzMyMX0._Mp5qZpXeWVO8atSrpKeFvndGvMpkkk5mAEJiIqBKmQ";

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "stroke3d.auth.session",
      flowType: "pkce",
    },
    global: {
      headers: { "x-client-info": "stroke-3d-web" },
    },
  }
);

export type AppUserSettings = {
  theme: "light" | "dark";
  text_scale: number; // 0.85 - 1.5
  audio_enabled: boolean;
  reduced_motion: boolean;
};

export const DEFAULT_USER_SETTINGS: AppUserSettings = {
  theme: "dark",
  text_scale: 1,
  audio_enabled: true,
  reduced_motion: false,
};

// =====================================================================
// Game Sessions & Results
// =====================================================================
export type GameSession = {
  id: number;
  user_id: string;
  game_type: "beat_slash" | "brain_game";
  session_date: string;
  score: number;
  duration_sec: number;
  completed: boolean;
  hit_count: number;
  miss_count: number;
  combo: number;
  accuracy: number;
  left_hand_score: number;
  right_hand_score: number;
  response_time_ms: number;
  responsiveness: number;
  left_arm_quality: "excellent" | "good" | "normal" | "poor";
  right_arm_quality: "excellent" | "good" | "normal" | "poor";
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DailySummary = {
  id: number;
  user_id: string;
  summary_date: string;
  games_played: number;
  total_score: number;
  avg_accuracy: number;
  avg_left_score: number;
  avg_right_score: number;
  avg_responsiveness: number;
  left_arm_status: "excellent" | "good" | "normal" | "poor";
  right_arm_status: "excellent" | "good" | "normal" | "poor";
  is_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type UserCertification = {
  id: number;
  user_id: string;
  period_start: string;
  period_end: string;
  total_games: number;
  total_score: number;
  avg_accuracy: number;
  avg_responsiveness: number;
  overall_performance:
    | "excellent"
    | "very_good"
    | "good"
    | "satisfactory"
    | "needs_improvement";
  cert_code: string;
  issued_at: string;
};

export type GameResultInput = {
  gameType: "beat_slash" | "brain_game";
  score: number;
  durationSec: number;
  hitCount?: number;
  missCount?: number;
  combo?: number;
  accuracy?: number;
  leftHandScore?: number;
  rightHandScore?: number;
  responseTimeMs?: number;
  rawData?: Record<string, unknown>;
};

// =====================================================================
// API Functions: Game Results
// =====================================================================

/**
 * บันทึกผลเล่นเกม
 */
export async function saveGameSession(data: GameResultInput) {
  const { data: result, error } = await supabase.rpc("save_game_session", {
    p_game_type: data.gameType,
    p_score: data.score,
    p_duration_sec: data.durationSec,
    p_hit_count: data.hitCount ?? 0,
    p_miss_count: data.missCount ?? 0,
    p_combo: data.combo ?? 0,
    p_accuracy: data.accuracy ?? 0,
    p_left_hand_score: data.leftHandScore ?? 0,
    p_right_hand_score: data.rightHandScore ?? 0,
    p_response_time_ms: data.responseTimeMs ?? 0,
    p_raw_data: data.rawData ?? {},
  });

  if (error) {
    console.error("Error saving game session:", error);
    throw error;
  }

  return result;
}

/**
 * ดึงข้อมูล game sessions ของผู้ใช้
 */
export async function getGameSessions(userId: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching game sessions:", error);
    throw error;
  }

  return data as GameSession[];
}

/**
 * ดึงข้อมูล daily summaries ของผู้ใช้
 */
export async function getDailySummaries(userId: string, days: number = 7) {
  const nDaysAgo = new Date();
  nDaysAgo.setDate(nDaysAgo.getDate() - days);

  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", userId)
    .gte("summary_date", nDaysAgo.toISOString().split("T")[0])
    .order("summary_date", { ascending: true });

  if (error) {
    console.error("Error fetching daily summaries:", error);
    throw error;
  }

  return data as DailySummary[];
}

/**
 * ดึงใบรับรองของผู้ใช้ (ถ้ามี)
 */
export async function getUserCertification(userId: string) {
  const { data, error } = await supabase
    .from("user_certifications")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (not an error)
    console.error("Error fetching certification:", error);
    throw error;
  }

  return data as UserCertification | null;
}

/**
 * ตรวจสอบ 7 วันและออกใบรับรอง
 */
export async function checkAndIssueCertification() {
  const { data, error } = await supabase.rpc(
    "check_and_issue_certification"
  );

  if (error) {
    console.error("Error checking certification:", error);
    throw error;
  }

  return data;
}
