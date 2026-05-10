/**
 * Theme Configuration (Animated Gradients & Per-Scene Customization)
 * =====================================================================
 * 🎨 ปรับสีพื้นหลังแบบเฟดหลายสีได้ที่นี่ครับ
 *
 * แต่ละหน้ามี colors = array ของสีที่วนสลับกัน (ใส่ได้ไม่จำกัด)
 * ตัวอย่าง: ["#0a0e1a", "#0d1a10", "#100a1a"]
 *          → เฟดจาก dark-blue → dark-green → dark-purple แล้ววนซ้ำ
 *
 * duration = ความเร็วในการวนสี (วินาที) — ยิ่งมากยิ่งช้า
 * =====================================================================
 */
export const themeConfig = {
  // 1. ขนาดตัวอักษรเริ่มต้น (1.3 = ใหญ่กว่าปกติ 30% เหมาะกับผู้ใช้ accessibility)
  defaultTextScale: 1.3,

  // 2. การตั้งค่าสีพื้นหลังรายหน้า (แก้ไขได้เอง)
  pageBg: {
    // หน้า Command Center (หน้าหลักหลัง login)
    commandCenter: {
      // ใส่สีได้กี่สีก็ได้ — จะเฟดวนไปเรื่อยๆ
      colors: ["#f9201d", "#040d0a", "#080610", "#040a0f"],
      duration: 20, // วินาที
    },
    // หน้า Home (3D Brain)
    home: {
      // สีถูกควบคุมโดย scenes ด้านล่าง (ไม่ต้องแก้ที่นี่)
    },
    // หน้า Rehab Tracker
    rehab: {
      colors: ["#0057fa", "#ff7b00", "#0a060f", "#0d0805"],
      duration: 25,
    },
    // หน้า Login
    login: {
      colors: ["#77d800", "#0198f5", "#0e0a12"],
      duration: 18,
    },
  },

  // 3. การตั้งค่าสีรายหน้า (Page-Specific Colors — ยังคงใช้งานได้เหมือนเดิม)
  pages: {
    login: {
      background: "#ffffff",
      primary: "#00d4aa",
      text: "#1e293b",
    },
    home: {
      sidebar: "#e2e9fa",
    },
    rehab: {
      background: "#f8fafc",
      primary: "#0ea5e9",
      card: "#ffffff",
    },
    global: {
      primary: "#00d4aa",
      border: "#e2e8f0",
      muted: "#94a3b8",
    }
  },

  // 4. การตั้งค่าสีรายฉากพร้อมระบบเฟดสี (7 Scenes Colors with Animated Gradient)
  // แต่ละฉากสามารถเลือกสีเฟดสลับกันได้ 2 สี (color1 และ color2)
  // และสีเน้น (accent) แยกกันได้เลยครับ
  scenes: {
    scene0: { color1: "#fcf9f9", color2: "#f5f6ff", accent: "#0073ff" }, // ฉาก 1: แนะนำ
    scene1: { color1: "#1a1850", color2: "#f50000", accent: "#5900ff" }, // ฉาก 2: การฝึก
    scene2: { color1: "#050f0f", color2: "#0a2d2d", accent: "#00d4aa" }, // ฉาก 3: สมอง
    scene3: { color1: "#0f0505", color2: "#3d0000", accent: "#ff2020" }, // ฉาก 4: หลอดเลือด
    scene4: { color1: "#0f0a05", color2: "#3d1f00", accent: "#ff6b00" }, // ฉาก 5: ตีบ/ตัน
    scene5: { color1: "#0f0505", color2: "#2d0000", accent: "#ff2020" }, // ฉาก 6: แตก
    scene6: { color1: "#050f0a", color2: "#003d1f", accent: "#00d4aa" }, // ฉาก 7: การฟื้นฟู
  },

  // 5. สีพิเศษสำหรับหน้า 3D (Surgical Mode)
  surgical: {
    teal: "#9bd400",
    pink: "#f472b6",
    amber: "#fbbf24",
    red: "#ef4444",
  }
};