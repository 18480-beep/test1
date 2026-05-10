import { useState } from "react";
import { RehabProvider, useRehab } from "@/contexts/RehabContext";
import OnboardingPage from "@/pages/OnboardingPage";
import DailyLogPage from "@/pages/DailyLogPage";
import ReportPage from "@/pages/ReportPage";

function RehabContent() {
  const { hasProfile, loading } = useRehab();
  const [page, setPage] = useState<"daily" | "report">("daily");

  if (loading) return (
    <div style={{
      position: "fixed", inset: 0, background: "#06080d",
      color: "#9fd", display: "grid", placeItems: "center",
      fontFamily: "system-ui", fontSize: 12, letterSpacing: "0.2em"
    }}>LOADING…</div>
  );

  if (!hasProfile)
    return <OnboardingPage onDone={() => setPage("daily")} />;

  if (page === "report")
    return <ReportPage onClose={() => setPage("daily")} />;

  return <DailyLogPage onDone={() => setPage("report")} />;
}

export default function RehabHome() {
  return (
    <RehabProvider>
      <RehabContent />
    </RehabProvider>
  );
}