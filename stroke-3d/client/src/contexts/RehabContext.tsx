/*
 * RehabContext.tsx
 * Global state สำหรับระบบ rehabilitation report
 * - เก็บข้อมูลผู้ป่วย (profile)
 * - เก็บบันทึกรายวัน 7 วัน (dailyLogs)
 * - บันทึก/โหลดจาก Supabase
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id?: string;
  userId: string;
  // ข้อมูลส่วนตัว
  fullName: string;        // ชื่อจริง
  nickname: string;        // ชื่อเล่น
  age: number;             // อายุ
  gender: "male" | "female" | "other";
  // ประวัติโรค
  strokeType: "ischemic" | "hemorrhagic" | "unknown";
  strokeDate: string;      // YYYY-MM-DD
  affectedSide: "left" | "right" | "both";
  // อาการเริ่มต้น
  initialSymptoms: string[];
  // ผู้ดูแล
  caregiverName: string;
  caregiverPhone: string;
  caregiverRelation: string;
  // companion system
  companionType?: "baby" | "dog" | "cat";
  companionName?: string;
  // metadata
  createdAt?: string;
}

export interface DailyLog {
  id?: string;
  userId: string;
  profileId: string;
  day: number;             // 1–7
  date: string;            // YYYY-MM-DD
  // Barthel Index (ย่อ 6 items, 0=ต้องการช่วยเต็มที่, 2=ทำได้เอง)
  bathing: 0 | 1 | 2;
  dressing: 0 | 1 | 2;
  feeding: 0 | 1 | 2;
  mobility: 0 | 1 | 2;    // เดิน/เคลื่อนที่
  toileting: 0 | 1 | 2;
  stairs: 0 | 1 | 2;
  // Fugl-Meyer ย่อ (0=ทำไม่ได้, 1=ทำบางส่วน, 2=ทำได้เต็มที่)
  armLeft: 0 | 1 | 2;
  armRight: 0 | 1 | 2;
  legLeft: 0 | 1 | 2;
  legRight: 0 | 1 | 2;
  // Berg Balance Scale ย่อ (0–2)
  standingBalance: 0 | 1 | 2;
  walkingBalance: 0 | 1 | 2;
  // VAS Pain (0–10)
  painScore: number;
  // Fatigue (0–10)
  fatigueScore: number;
  // อารมณ์ (1=แย่มาก, 5=ดีมาก)
  moodScore: 1 | 2 | 3 | 4 | 5;
  // หมายเหตุ
  notes: string;
  createdAt?: string;
}

interface RehabContextType {
  profile: PatientProfile | null;
  dailyLogs: DailyLog[];
  hasProfile: boolean;
  loading: boolean;
  // actions
  saveProfile: (p: PatientProfile) => Promise<void>;
  saveDailyLog: (log: DailyLog) => Promise<void>;
  getTodayLog: () => DailyLog | undefined;
  getCurrentDay: () => number;
  refreshData: () => Promise<void>;
}

const RehabContext = createContext<RehabContextType | undefined>(undefined);

export function RehabProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // โหลด profile
      const { data: profileData } = await supabase
        .from("rehab_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profileData) {
        setProfile({
          id: profileData.id,
          userId: profileData.user_id,
          fullName: profileData.full_name,
          nickname: profileData.nickname,
          age: profileData.age,
          gender: profileData.gender,
          strokeType: profileData.stroke_type,
          strokeDate: profileData.stroke_date,
          affectedSide: profileData.affected_side,
          initialSymptoms: profileData.initial_symptoms || [],
          caregiverName: profileData.caregiver_name,
          caregiverPhone: profileData.caregiver_phone,
          caregiverRelation: profileData.caregiver_relation,
          companionType: profileData.companion_type,
          companionName: profileData.companion_name,
          createdAt: profileData.created_at,
        });

        // โหลด daily logs
        const { data: logsData } = await supabase
          .from("rehab_daily_logs")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("day", { ascending: true });

        if (logsData) {
          setDailyLogs(logsData.map(mapLogFromDb));
        }
      }
    } catch (err) {
      console.error("[RehabContext] loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveProfile = async (p: PatientProfile) => {
    if (!user) return;
    const dbRow = {
      user_id: user.id,
      full_name: p.fullName,
      nickname: p.nickname,
      age: p.age,
      gender: p.gender,
      stroke_type: p.strokeType,
      stroke_date: p.strokeDate,
      affected_side: p.affectedSide,
      initial_symptoms: p.initialSymptoms,
      caregiver_name: p.caregiverName,
      caregiver_phone: p.caregiverPhone,
      caregiver_relation: p.caregiverRelation,
      companion_type: p.companionType,
      companion_name: p.companionName,
    };

    let result;
    if (p.id) {
      result = await supabase
        .from("rehab_profiles")
        .update(dbRow)
        .eq("id", p.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("rehab_profiles")
        .insert(dbRow)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    setProfile({ ...p, id: result.data.id, createdAt: result.data.created_at });
  };

  const saveDailyLog = async (log: DailyLog) => {
    if (!profile?.id) throw new Error("No profile");
    const dbRow = {
      user_id: log.userId,
      profile_id: profile.id,
      day: log.day,
      date: log.date,
      bathing: log.bathing,
      dressing: log.dressing,
      feeding: log.feeding,
      mobility: log.mobility,
      toileting: log.toileting,
      stairs: log.stairs,
      arm_left: log.armLeft,
      arm_right: log.armRight,
      leg_left: log.legLeft,
      leg_right: log.legRight,
      standing_balance: log.standingBalance,
      walking_balance: log.walkingBalance,
      pain_score: log.painScore,
      fatigue_score: log.fatigueScore,
      mood_score: log.moodScore,
      notes: log.notes,
    };

    let result;
    if (log.id) {
      result = await supabase
        .from("rehab_daily_logs")
        .update(dbRow)
        .eq("id", log.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("rehab_daily_logs")
        .insert(dbRow)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    const saved = mapLogFromDb(result.data);
    setDailyLogs(prev => {
      const idx = prev.findIndex(l => l.day === saved.day);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [...prev, saved].sort((a, b) => a.day - b.day);
    });
  };

  const getTodayLog = () => {
    if (!profile) return undefined;
    const day = getCurrentDay();
    return dailyLogs.find(l => l.day === day);
  };

  const getCurrentDay = () => {
    if (!profile?.createdAt) return 1;
    const start = new Date(profile.createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), 7);
  };

  return (
    <RehabContext.Provider value={{
      profile, dailyLogs, hasProfile: !!profile,
      loading, saveProfile, saveDailyLog,
      getTodayLog, getCurrentDay, refreshData: loadData,
    }}>
      {children}
    </RehabContext.Provider>
  );
}

export function useRehab() {
  const ctx = useContext(RehabContext);
  if (!ctx) throw new Error("useRehab must be used within RehabProvider");
  return ctx;
}

// ─── DB mapper ───────────────────────────────────────────────────────────────
function mapLogFromDb(d: Record<string, unknown>): DailyLog {
  return {
    id: d.id as string,
    userId: d.user_id as string,
    profileId: d.profile_id as string,
    day: d.day as number,
    date: d.date as string,
    bathing: d.bathing as 0 | 1 | 2,
    dressing: d.dressing as 0 | 1 | 2,
    feeding: d.feeding as 0 | 1 | 2,
    mobility: d.mobility as 0 | 1 | 2,
    toileting: d.toileting as 0 | 1 | 2,
    stairs: d.stairs as 0 | 1 | 2,
    armLeft: d.arm_left as 0 | 1 | 2,
    armRight: d.arm_right as 0 | 1 | 2,
    legLeft: d.leg_left as 0 | 1 | 2,
    legRight: d.leg_right as 0 | 1 | 2,
    standingBalance: d.standing_balance as 0 | 1 | 2,
    walkingBalance: d.walking_balance as 0 | 1 | 2,
    painScore: d.pain_score as number,
    fatigueScore: d.fatigue_score as number,
    moodScore: d.mood_score as 1 | 2 | 3 | 4 | 5,
    notes: d.notes as string || "",
    createdAt: d.created_at as string,
  };
}