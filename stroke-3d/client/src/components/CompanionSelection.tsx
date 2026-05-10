import React, { useState } from "react";
import { useRehab } from "@/contexts/RehabContext";

export default function CompanionSelection() {
  const { profile, saveProfile } = useRehab();
  const [selected, setSelected] = useState<"baby" | "dog" | "cat" | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const options = [
    { id: "baby", label: "เด็กทารก", icon: "👶", color: "#FFD700" },
    { id: "dog", label: "น้องหมา", icon: "🐶", color: "#FF8C00" },
    { id: "cat", label: "น้องแมว", icon: "🐱", color: "#FF69B4" },
  ] as const;

  const handleConfirm = async () => {
    if (!selected || !profile) return;
    setSaving(true);
    try {
      await saveProfile({
        ...profile,
        companionType: selected,
        companionName: name || options.find(o => o.id === selected)?.label,
      });
    } catch (err) {
      console.error("Failed to save companion:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(4, 8, 18, 0.95)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(10px)"
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "rgba(15, 20, 30, 0.98)",
        border: "1px solid rgba(0, 229, 192, 0.3)",
        borderRadius: 24, padding: 40,
        textAlign: "center",
        boxShadow: "0 0 40px rgba(0, 229, 192, 0.15)"
      }}>
        <h2 style={{ color: "#00e5c0", fontSize: 24, marginBottom: 8, fontWeight: 800 }}>
          เลือกเพื่อนร่วมทางของคุณ
        </h2>
        <p style={{ color: "rgba(150, 170, 200, 0.6)", fontSize: 14, marginBottom: 32 }}>
          เพื่อนคนนี้จะเติบโตไปพร้อมกับการฝึกกายภาพของคุณทุกวัน
        </p>

        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              style={{
                flex: 1, padding: "24px 12px", borderRadius: 16,
                background: selected === opt.id ? `${opt.color}22` : "rgba(255,255,255,0.03)",
                border: `2px solid ${selected === opt.id ? opt.color : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12
              }}
            >
              <span style={{ fontSize: 40 }}>{opt.icon}</span>
              <span style={{ 
                fontSize: 14, fontWeight: 600, 
                color: selected === opt.id ? opt.color : "rgba(255,255,255,0.5)" 
              }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{ marginBottom: 32 }}>
            <label style={{ 
              display: "block", textAlign: "left", fontSize: 12, 
              color: "rgba(150, 170, 200, 0.5)", marginBottom: 8, marginLeft: 4 
            }}>
              ตั้งชื่อให้เพื่อนของคุณ
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="เช่น น้องนำโชค..."
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 16, outline: "none"
              }}
            />
          </div>
        )}

        <button
          disabled={!selected || saving}
          onClick={handleConfirm}
          style={{
            width: "100%", padding: "16px", borderRadius: 12,
            background: selected ? "linear-gradient(135deg, #00c4a8, #00e5c0)" : "rgba(255,255,255,0.05)",
            border: "none", color: "#0a1520", fontWeight: 700,
            fontSize: 16, cursor: selected ? "pointer" : "not-allowed",
            opacity: selected ? 1 : 0.5, transition: "all 0.2s"
          }}
        >
          {saving ? "กำลังบันทึก..." : "เริ่มต้นการเดินทาง"}
        </button>
        
        <p style={{ color: "rgba(255, 100, 100, 0.5)", fontSize: 11, marginTop: 16 }}>
          * เมื่อเลือกแล้วจะไม่สามารถเปลี่ยนได้
        </p>
      </div>
    </div>
  );
}
