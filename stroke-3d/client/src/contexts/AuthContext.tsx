/*
 * AuthContext (Supabase-backed)
 * - บันทึก session จริงต่อบัญชี (Google OAuth ผ่าน Supabase)
 * - Sync ข้ามอุปกรณ์: ผู้ใช้ล็อกอินด้วย Google บัญชีเดียวกัน
 *   จะเห็นข้อมูล/ความคืบหน้า/streak/setting เหมือนกัน
 * - คงเมธอด login()/logout() ไว้ให้โค้ดเดิมเรียกได้ และเพิ่ม loginWithGoogle()
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useLocation } from "wouter";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminBypass: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  /** สำหรับโค้ดเดิม: ถ้าเรียกจะ trigger Google OAuth */
  login: () => void;
  /** Admin local bypass — เข้าหน้าหลักทันทีโดยไม่ต้องผ่าน Google (dev only) */
  loginAsAdmin: () => void;
  logout: () => Promise<void>;
}

const ADMIN_BYPASS_KEY = "stroke3d.adminBypass";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminBypass, setIsAdminBypass] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(ADMIN_BYPASS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mounted = true;

    // 1) ถ้ากลับมาจาก OAuth callback Supabase จะ parse URL ให้เอง
    //    เราต้องรอ getSession() resolve ก่อน ถึงจะปิด loading
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);

      // ลบ ?code= / #access_token ออกจาก URL หลังจัดการเสร็จ เพื่อ URL สะอาด
      if (
        typeof window !== "undefined" &&
        (window.location.hash.includes("access_token") ||
          window.location.search.includes("code="))
      ) {
        const cleanUrl =
          window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    });

    // 2) รับ event SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null);
      setLoading(false);
      if (event === "SIGNED_IN" && s) {
        // ล็อกอินสำเร็จ → ออกจากหน้า /login ไปหน้าหลัก
        if (
          typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/login") ||
          window.location.pathname.startsWith("/auth/callback"))
        ) {
          navigate("/");
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const loginWithGoogle = useCallback(async (redirectTo?: string) => {
    const target =
       redirectTo ||
       (typeof window !== "undefined" ? window.location.origin + "/auth/callback" : "/auth/callback");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: target,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      console.error("[Auth] Google OAuth error:", error.message);
      throw error;
    }
  }, []);

  const loginAsAdmin = useCallback(() => {
    try {
      window.localStorage.setItem(ADMIN_BYPASS_KEY, "1");
    } catch {}
    setIsAdminBypass(true);
    navigate("/");
  }, [navigate]);

  const login = useCallback(() => {
    void loginWithGoogle();
  }, [loginWithGoogle]);

  const logout = useCallback(async () => {
    try {
      window.localStorage.removeItem(ADMIN_BYPASS_KEY);
    } catch {}
    setIsAdminBypass(false);
    await supabase.auth.signOut();
    setSession(null);
    navigate("/login");
  }, [navigate]);

  const value = useMemo<AuthContextType>(
    () => ({
      isLoggedIn: !!session?.user || isAdminBypass,
      user: session?.user ?? null,
      session,
      loading,
      isAdminBypass,
      loginWithGoogle,
      login,
      loginAsAdmin,
      logout,
    }),
    [session, loading, isAdminBypass, loginWithGoogle, login, loginAsAdmin, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
