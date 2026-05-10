import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      // PKCE flow: Supabase ต้องการ exchangeCodeForSession ก่อน
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // exchange code → session (PKCE)
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error("[AuthCallback] exchange error:", error.message);
          navigate("/login");
          return;
        }
      }

      // ตรวจ session หลัง exchange
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      } else {
        // fallback: รอ event SIGNED_IN อีกนิด
        const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && s) {
            sub.subscription.unsubscribe();
            navigate("/");
          }
        });

        // timeout 5 วิ ถ้ายังไม่ได้ให้ไป login
        setTimeout(() => {
          sub.subscription.unsubscribe();
          navigate("/login");
        }, 5000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#06080d",
        color: "#9fd",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.2em",
        fontSize: 12,
      }}
    >
      AUTHENTICATING…
    </div>
  );
}