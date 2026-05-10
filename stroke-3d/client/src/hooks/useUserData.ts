/*
 * useUserData
 * - โหลด/บันทึก progress, streak, settings ของผู้ใช้คนปัจจุบัน
 * - log activity (scene_view / game_play / login / setting_change)
 * - ใช้ optimistic update + persist ไป Supabase อัตโนมัติ
 *   ทำให้เปิดอุปกรณ์อื่นด้วยบัญชีเดียวกันก็เห็นข้อมูลตรงกัน
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, DEFAULT_USER_SETTINGS, type AppUserSettings } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProgress {
  last_scene: number;
  max_scene: number;
  total_completed: number;
  last_seen_at: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

const FALLBACK_PROGRESS: UserProgress = {
  last_scene: 0,
  max_scene: 0,
  total_completed: 0,
  last_seen_at: new Date().toISOString(),
};

const FALLBACK_STREAK: UserStreak = {
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
};

export function useUserData() {
  const { user, isLoggedIn } = useAuth();
  const [settings, setSettings] = useState<AppUserSettings>(DEFAULT_USER_SETTINGS);
  const [progress, setProgress] = useState<UserProgress>(FALLBACK_PROGRESS);
  const [streak, setStreak] = useState<UserStreak>(FALLBACK_STREAK);
  const [ready, setReady] = useState(false);
  const touchedRef = useRef(false);

  // Initial load + touch streak
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setReady(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        // settings (auto-created by trigger; tolerate missing)
        const { data: sData } = await supabase
          .from("user_settings")
          .select("theme,text_scale,audio_enabled,reduced_motion")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled && sData) {
          setSettings({
            theme: (sData.theme as "light" | "dark") || "dark",
            text_scale: Number(sData.text_scale) || 1,
            audio_enabled: !!sData.audio_enabled,
            reduced_motion: !!sData.reduced_motion,
          });
        }

        const { data: pData } = await supabase
          .from("user_progress")
          .select("last_scene,max_scene,total_completed,last_seen_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && pData) setProgress(pData as UserProgress);

        // bump streak (RPC defined in migration)
        if (!touchedRef.current) {
          touchedRef.current = true;
          const { data: stData } = await supabase.rpc("touch_streak");
          if (!cancelled && stData) {
            const r = Array.isArray(stData) ? stData[0] : stData;
            setStreak({
              current_streak: r.current_streak ?? 0,
              longest_streak: r.longest_streak ?? 0,
              last_active_date: r.last_active_date ?? null,
            });
          }
          // log login activity (best-effort)
          await supabase.from("user_activities").insert({
            user_id: user.id,
            type: "login",
            payload: { ua: navigator.userAgent },
          });
        }
      } catch (err) {
        console.warn("[useUserData] initial load failed (DB may not be initialized):", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user]);

  // ---------------- Public mutations ----------------
  const saveSettings = useCallback(
    async (patch: Partial<AppUserSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      if (!user) return;
      try {
        await supabase.from("user_settings").upsert({
          user_id: user.id,
          ...next,
          updated_at: new Date().toISOString(),
        });
        await supabase.from("user_activities").insert({
          user_id: user.id,
          type: "setting_change",
          payload: patch,
        });
      } catch (err) {
        console.warn("[useUserData] saveSettings failed:", err);
      }
    },
    [settings, user]
  );

  const updateProgress = useCallback(
    async (sceneIndex: number) => {
      const next: UserProgress = {
        last_scene: sceneIndex,
        max_scene: Math.max(progress.max_scene, sceneIndex),
        total_completed: progress.total_completed + (sceneIndex > progress.max_scene ? 1 : 0),
        last_seen_at: new Date().toISOString(),
      };
      setProgress(next);
      if (!user) return;
      try {
        await supabase.from("user_progress").upsert({
          user_id: user.id,
          ...next,
          updated_at: new Date().toISOString(),
        });
        await supabase.from("user_activities").insert({
          user_id: user.id,
          type: "scene_view",
          payload: { scene: sceneIndex },
        });
      } catch (err) {
        console.warn("[useUserData] updateProgress failed:", err);
      }
    },
    [progress, user]
  );

  const logEvent = useCallback(
    async (type: string, payload: Record<string, unknown> = {}) => {
      if (!user) return;
      try {
        await supabase.from("user_activities").insert({
          user_id: user.id,
          type,
          payload,
        });
      } catch (err) {
        console.warn("[useUserData] logEvent failed:", err);
      }
    },
    [user]
  );

  return {
    ready,
    settings,
    progress,
    streak,
    saveSettings,
    updateProgress,
    logEvent,
  };
}
