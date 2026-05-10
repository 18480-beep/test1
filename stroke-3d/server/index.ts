import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── AI Chat Mock Responses ────────────────────────────────────────────────
const aiResponses: Record<string, string[]> = {
  exercise: [
    "การออกกำลังกายเป็นสิ่งสำคัญมาก! แนะนำให้เริ่มจากท่าง่ายๆ เช่น ยืดแขน ขยับนิ้ว และเหยียดขาทีละนิด ทีละน้อย\n\nควร:\n✓ ออกกำลังกายเป็นประจำ 30 นาที ต่อวัน\n✓ หยุดพักระหว่างท่า\n✓ หลีกเลี่ยงความเจ็บปวด\n\nหากรู้สึกไม่สบาย ให้หยุดและติดต่อแพทย์",
    "การฟื้นฟูจากโรคหลอดเลือดสมองต้องอาศัยความอดทนค่ะ เริ่มจากการ:\n1. ยืดกล้ามเนื้อสำหรับแขนขา\n2. ทำแบบฝึกหัดสมดุล\n3. ฝึกเดินด้วยความระมัดระวัง\n\nหากมีแพทย์กำหนดแบบฝึกหัดมา ให้ทำตามนั้นเป็นหลัก",
  ],
  diet: [
    "อาหารที่ดีสำหรับผู้ป่วยหลอดเลือดสมอง:\n✓ ปลา (โอเมก้า-3)\n✓ ผักใบเขียว\n✓ ธัญพืช\n✓ น้อยเกลือ น้อยน้ำตาล\n\nหลีกเลี่ยง:\n✗ อาหารมันแบบเนื้อแดง\n✗ เค็ม มาก\n✗ น้ำหวาน เครื่องดื่มจำหน่าย",
    "สำหรับการกินอาหาร ให้คุณ:\n1. กินให้ครบหมู่อาหาร 5 หมู่\n2. หลีกเลี่ยงอาหารจำหน่าย\n3. ดื่มน้ำให้เพียงพอ 6-8 แก้ว/วัน\n4. รับประทานหลายหลาก เป็นปกติ\n\nคุณควรปรึกษาแพทย์หรือโภคนวิทยาศาสตร์ก่อนเปลี่ยนแปลงอาหาร",
  ],
  mood: [
    "เป็นเรื่องปกติที่จะรู้สึกเศร้าหรือท้อใจหลังเป็นโรค การจัดการจิตใจ:\n✓ พูดคุยกับครอบครัว\n✓ ติดตามการฟื้นฟู\n✓ ยอมรับความช้า\n✓ ติดต่อจิตแพทย์หากต้อง\n\nอย่าลังเลที่จะขอความช่วยเหลือ",
    "การดูแลสุขภาพจิตใจเท่าสำคัญกับการฟื้นฟูร่างกาย:\n- เข้าร่วมสังคม\n- ทำความสุข\n- ตั้งเป้าหมายเล็กๆ\n- ศ่วนแบ่งปัญหากับคนอื่น\n\nหากรู้สึกซึมเศร้ามากเกินไป ลองติดต่อแพทย์ของคุณ",
  ],
  warning: [
    "สำคัญ! หากคุณเห็นอาการ FAST:\nF - Face: ใบหน้าแหลก\nA - Arm: แขนอ่อนแรง\nS - Speech: พูดไม่ชัด\nT - Time: ถึงเวลาเรียก救หนึ่ง\n\nกรณีนี้เรียกรถพยาบาลทันที!",
    "ระวัง! อาการเตือนการจี้หลอดเลือดสมองครั้งที่ 2:\n⚠ หัวเจ็บอย่างไม่คาดคิด\n⚠ บอด/ลิมโลดอย่างฉับพลัน\n⚠ ปัญหาการพูด\n⚠ สูญเสียสายตา\n\nเรียกแพทย์ทันที! เซเวนทีคือดังฟร. โอเอ 1669",
  ],
  greeting: [
    "สวัสดีค่ะ! ผมชื่อ Dr. Brain — ผู้ช่วยด้านการฟื้นฟูสมองของคุณ\nมีอะไรให้ช่วยวันนี้? เช่น:\n• คำแนะนำการออกกำลังกาย\n• ปรึกษาอาหาร\n• จัดการอารมณ์\n• ข้อมูลเตือนภัย",
    "สวัสดี! ฉันที่นี่เพื่อช่วยคุณในการฟื้นฟูจากการจี้หลอดเลือดสมอง คุณต้องการช่วยเหลือในเรื่องอะไรครับ?",
  ],
};

function generateAIResponse(message: string): string {
  const lower = message.toLowerCase();

  // ตรวจสอบคีย์เวิร์ด
  if (
    lower.includes("ออกกำลังกาย") ||
    lower.includes("exercise") ||
    lower.includes("ยืด") ||
    lower.includes("ท่า")
  ) {
    return aiResponses.exercise[
      Math.floor(Math.random() * aiResponses.exercise.length)
    ];
  }

  if (
    lower.includes("อาหาร") ||
    lower.includes("กิน") ||
    lower.includes("diet") ||
    lower.includes("ปลา") ||
    lower.includes("น้ำหวาน")
  ) {
    return aiResponses.diet[Math.floor(Math.random() * aiResponses.diet.length)];
  }

  if (
    lower.includes("จิตใจ") ||
    lower.includes("เศร้า") ||
    lower.includes("ท้อใจ") ||
    lower.includes("mood") ||
    lower.includes("ซึมเศร้า")
  ) {
    return aiResponses.mood[Math.floor(Math.random() * aiResponses.mood.length)];
  }

  if (
    lower.includes("fast") ||
    lower.includes("หน้าแหลก") ||
    lower.includes("แขนอ่อน") ||
    lower.includes("พูดไม่ชัด") ||
    lower.includes("เตือน") ||
    lower.includes("อาการ")
  ) {
    return aiResponses.warning[
      Math.floor(Math.random() * aiResponses.warning.length)
    ];
  }

  // Default greeting
  return aiResponses.greeting[
    Math.floor(Math.random() * aiResponses.greeting.length)
  ];
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── API Routes ────────────────────────────────────────────────────────

  // Delete Account endpoint — ใช้ service role key เพื่อลบ auth user จริงๆ
  app.post("/api/delete-account", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://cugjecldmbxxofzbbtbj.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return res.status(500).json({ error: "Server not configured for account deletion (missing SUPABASE_SERVICE_ROLE_KEY)" });
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");

      // ใช้ anon client ตรวจสอบ token และดึง user id
      const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || "", {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data: { user }, error: userError } = await anonClient.auth.getUser();
      if (userError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // ใช้ admin client (service role) ลบ data และ auth user
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      // 1. ลบ game_sessions ของ user
      await adminClient.from("game_sessions").delete().eq("user_id", user.id);

      // 2. ลบ avatar ใน storage (ถ้ามี)
      const avatarPath = `${user.id}/avatar`;
      await adminClient.storage.from("avatars").remove([avatarPath]);

      // 3. ลบ profile
      await adminClient.from("profiles").delete().eq("id", user.id);

      // 4. ลบ auth user จริงๆ
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        return res.status(500).json({ error: deleteError.message });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete account error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Chat endpoint
  app.post("/api/chat", (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    const reply = generateAIResponse(message);
    res.json({ reply });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3001;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);