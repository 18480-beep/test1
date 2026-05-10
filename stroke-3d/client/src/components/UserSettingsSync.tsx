/*
 * UserSettingsSync
 * - หลังล็อกอิน: ดึง user_settings จาก Supabase แล้ว sync เข้าสู่ ThemeContext (theme + textScale)
 * - เมื่อผู้ใช้เปลี่ยน theme/textScale: บันทึกกลับไป Supabase
 * - เมื่อล็อกเอาท์: ไม่ทำอะไร (ค่าจาก localStorage ยังคงไว้)
 *
 * Component นี้ไม่มี UI ของตัวเอง วางใน <App /> หลัง AuthProvider+ThemeProvider
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function UserSettingsSync() {
  const { user, isLoggedIn } = useAuth();
  const { theme, setTheme, textScale, setTextScale } = useTheme();
  const loadedRef = useRef<string | null>(null);

  // Pull from Supabase once per user
  useEffect(() => {
    if (!isLoggedIn || !user) {
      loadedRef.current = null;
      return;
    }
    if (loadedRef.current === user.id) return;
    loadedRef.current = user.id;

    (async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("theme,text_scale")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          if (data.theme && (data.theme === "light" || data.theme === "dark")) {
            setTheme(data.theme);
          }
          if (typeof data.text_scale !== "undefined" && data.text_scale !== null) {
            setTextScale(Number(data.text_scale));
          }
        }
      } catch (err) {
        console.warn("[UserSettingsSync] load failed:", err);
      }
    })();
  }, [isLoggedIn, user, setTheme, setTextScale]);

  // Push back to Supabase when changes occur (debounced)
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      try {
        await supabase.from("user_settings").upsert({
          user_id: user.id,
          theme,
          text_scale: textScale,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("[UserSettingsSync] save failed:", err);
      }
    }, 500);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [theme, textScale, isLoggedIn, user]);

  return null;
}
