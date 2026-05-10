import React from "react";
import { useRehab } from "@/contexts/RehabContext";

export default function CompanionDisplay() {
  const { profile, dailyLogs } = useRehab();
  
  if (!profile || !profile.companionType) return null;

  // คำนวณระดับการเติบโต (Growth Level)
  // สมมติว่า:
  // Level 1 (ทารก/ลูกสัตว์): ฝึก 0-2 วัน
  // Level 2 (เด็ก/วัยรุ่น): ฝึก 3-5 วัน
  // Level 3 (ผู้ใหญ่): ฝึก 6 วันขึ้นไป
  const trainingDays = dailyLogs.length;
  let level = 1;
  if (trainingDays >= 6) level = 3;
  else if (trainingDays >= 3) level = 2;

  const getVisual = () => {
    const type = profile.companionType;
    if (type === "baby") {
      if (level === 1) return { img: "https://img5.pic.in.th/file/secure-sv1/baby-level1.png", label: "ทารก" };
      if (level === 2) return { img: "https://img5.pic.in.th/file/secure-sv1/baby-level2.png", label: "เด็กน้อย" };
      return { img: "https://img5.pic.in.th/file/secure-sv1/baby-level3.png", label: "ผู้ใหญ่" };
    }
    if (type === "dog") {
      if (level === 1) return { img: "https://img5.pic.in.th/file/secure-sv1/dog-level1.png", label: "ลูกหมา" };
      if (level === 2) return { img: "https://img5.pic.in.th/file/secure-sv1/dog-level2.png", label: "สุนัขวัยรุ่น" };
      return { img: "https://img5.pic.in.th/file/secure-sv1/dog-level3.png", label: "สุนัขโตเต็มวัย" };
    }
    if (type === "cat") {
      if (level === 1) return { img: "https://img5.pic.in.th/file/secure-sv1/cat-level1.png", label: "ลูกแมว" };
      if (level === 2) return { img: "https://img5.pic.in.th/file/secure-sv1/cat-level2.png", label: "แมววัยรุ่น" };
      return { img: "https://img5.pic.in.th/file/secure-sv1/cat-level3.png", label: "แมวโตเต็มวัย" };
    }
    return { img: "", label: "Unknown" };
  };

  const visual = getVisual();
  const progress = (trainingDays / 7) * 100;

  return (
    <div style={{
      background: "rgba(10,14,22,0.8)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "24px",
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", overflow: "hidden"
    }}>
      {/* Background Glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 120, height: 120, background: "rgba(0, 229, 192, 0.1)",
        filter: "blur(40px)", borderRadius: "50%", transform: "translate(-50%, -50%)",
        zIndex: 0
      }} />

      <div style={{ 
        display: "flex", justifyContent: "space-between", width: "100%", 
        marginBottom: 20, zIndex: 1 
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#d8eaff" }}>Companion</div>
        <div style={{ 
          fontSize: 11, color: "#00e5c0", background: "rgba(0,229,192,0.1)", 
          padding: "2px 8px", borderRadius: 10, fontWeight: 600 
        }}>
          LV.{level}
        </div>
      </div>

      <div style={{ 
        width: 120, height: 120, marginBottom: 16, zIndex: 1,
        filter: "drop-shadow(0 0 20px rgba(0,229,192,0.3))",
        animation: "float 3s ease-in-out infinite",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {visual.img ? (
          <img src={visual.img} alt={visual.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 60 }}>❓</span>
        )}
      </div>

      <div style={{ textAlign: "center", zIndex: 1, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
          {profile.companionName}
        </div>
        <div style={{ fontSize: 12, color: "rgba(150,170,200,0.6)" }}>
          สถานะ: {visual.label}
        </div>
      </div>

      <div style={{ width: "100%", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(150,170,200,0.5)" }}>Growth Progress</span>
          <span style={{ fontSize: 11, color: "#00e5c0" }}>{trainingDays}/7 Days</span>
        </div>
        <div style={{ 
          width: "100%", height: 6, background: "rgba(255,255,255,0.05)", 
          borderRadius: 3, overflow: "hidden" 
        }}>
          <div style={{ 
            width: `${progress}%`, height: "100%", 
            background: "linear-gradient(90deg, #00c4a8, #00e5c0)",
            boxShadow: "0 0 10px rgba(0,229,192,0.5)",
            transition: "width 1s ease-out"
          }} />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
