/**
 * useProfile.ts — v2
 *
 * แก้ bug: "cannot add postgres_changes callbacks after subscribe()"
 * สาเหตุ: Supabase Realtime ต้องการให้ .on() อยู่ก่อน .subscribe()
 *         แต่ version นี้มีปัญหา channel ซ้ำชื่อกัน
 *
 * Fix: ตัด realtime subscription ออก — ไม่จำเป็นเพราะ
 *      SetupProfile mode="edit" ใช้ window.location.href reload อยู่แล้ว
 *      ทำให้ hook fetch ใหม่โดยอัตโนมัติ
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Profile {
  id:         string;
  username:   string;
  full_name:  string;
  email:      string;
  birthday:   string | null;
  avatar_id:  string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

interface UseProfileReturn {
  profile:     Profile | null;
  loading:     boolean;
  refetch:     () => Promise<void>;
  avatarEmoji: string | null;
  avatarPhoto: string | null;
}

// ─── Avatar emoji map (sync กับ SetupProfile) ────────────────────────────────
const AVATAR_EMOJI: Record<string, string> = {
  bunny:   "🐰",
  bear:    "🐻",
  cat:     "🐱",
  panda:   "🐼",
  fox:     "🦊",
  penguin: "🐧",
  frog:    "🐸",
  duck:    "🐥",
  koala:   "🐨",
  unicorn: "🦄",
  hamster: "🐹",
  star:    "⭐",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProfile(): UseProfileReturn {
  const { user } = useAuth();

  // อ่าน localStorage cache ทันที → ไม่มี loading flicker
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window === "undefined" || !user?.id) return null;
    try {
      const raw = localStorage.getItem(`profile:${user.id}`);
      if (!raw) return null;
      return { id: user.id, updated_at: null, ...JSON.parse(raw) } as Profile;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ── Fetch จาก Supabase ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
        // อัพเดต cache ด้วย
        localStorage.setItem(`profile:${user.id}`, JSON.stringify({
          username:   data.username,
          full_name:  data.full_name,
          avatar_id:  data.avatar_id,
          avatar_url: data.avatar_url,
          birthday:   data.birthday,
          email:      data.email,
        }));
      }
    } catch (err) {
      console.warn("[useProfile] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // fetch ครั้งแรกตอน mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const avatarEmoji = profile?.avatar_id ? (AVATAR_EMOJI[profile.avatar_id] ?? null) : null;
  const avatarPhoto = profile?.avatar_url ?? null;

  return { profile, loading, refetch: fetchProfile, avatarEmoji, avatarPhoto };
}