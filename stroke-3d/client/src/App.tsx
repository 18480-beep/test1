/*
 * App.tsx — updated
 * - เพิ่ม /setup-profile route
 * - ProtectedRoute เช็คว่า user มี username แล้วหรือยัง
 *   ถ้ายัง → redirect ไป /setup-profile ก่อน
 */
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TextToSpeechProvider } from "./contexts/TextToSpeechContext";
import { RehabProvider } from "./contexts/RehabContext";
import Home from "./pages/Home";
import RehabHome from "./pages/RehabHome";
import Login from "./pages/Login";
import AuthCallback from "./pages/authCallback";
import SetupProfile from "./pages/SetupProfile";
import SettingsPanel from "./components/SettingsPanel";
import UserSettingsSync from "./components/UserSettingsSync";
import { supabase } from "./lib/supabase";

// ─── Loading screen ────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--background, #06080d)", color: "var(--primary, #9fd)",
      display: "grid", placeItems: "center",
      fontFamily: "system-ui, sans-serif", letterSpacing: "0.2em", fontSize: 12,
    }}>
      LOADING…
    </div>
  );
}

// ─── ProtectedRoute ────────────────────────────────────────────────
// เช็ค 3 ชั้น: 1) login? 2) profile setup เสร็จ? 3) render component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoggedIn, loading, user } = useAuth();
  const [profileDone, setProfileDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !user) { 
      setProfileDone(null); 
      return; 
    }

    // เช็คจาก Supabase โดยตรง (ไม่ใช้ cache) เพื่อให้รองรับการลบบัญชีแล้วสมัครใหม่ทันที
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking profile:", error);
        setProfileDone(false);
      } else {
        // ถ้ามี username แสดงว่าตั้งโปรไฟล์แล้ว
        setProfileDone(!!(data?.username));
      }
    };

    checkProfile();
  }, [isLoggedIn, user]);

  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Redirect to="/login" />;
  if (profileDone === null) return <LoadingScreen />;
  if (!profileDone) return <Redirect to="/setup-profile" />;

  return <Component />;
}

// ─── Router ────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/login"          component={Login} />
      <Route path="/auth/callback"  component={AuthCallback} />
      <Route path="/setup-profile"  component={SetupProfile} />
      <Route path="/">{() => <ProtectedRoute component={Home} />}</Route>
      <Route path="/rehab">{() => <ProtectedRoute component={RehabHome} />}</Route>
      <Route path="/404"            component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── App ───────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <TextToSpeechProvider>
            <Toaster />
            <AuthProvider>
              <RehabProvider>
                <UserSettingsSync />
                <Router />
                <SettingsPanel />
              </RehabProvider>
            </AuthProvider>
          </TextToSpeechProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;