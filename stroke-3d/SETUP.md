# Stroke3D — คู่มือเชื่อมต่อระบบ (Supabase + Google + 3D Brain)

โปรเจกต์นี้ถูกอัปเกรดให้:
- บันทึกข้อมูลผู้ใช้จริงแยกต่อบัญชี (Google OAuth ผ่าน Supabase)
- คงประวัติการเล่น / ความต่อเนื่อง (streak) / กิจกรรมในแอป
- Sync ข้ามอุปกรณ์ (คอม / iPad / มือถือ) เมื่อเข้าด้วยบัญชีเดียวกัน
- เพิ่มปรับโหมด **สว่าง/มืด** และ **ขนาดตัวอักษร** ที่บันทึกไว้ต่อบัญชี
- รองรับทุกอุปกรณ์อย่างลื่นไหล (safe-area, dvh, prefers-reduced-motion ฯลฯ)
- 3D สมองสมจริงขึ้น (PBR + environment + rim lights + neural pulse aura)

หน้าหลัก / หน้า 2 / หน้า 3 ของคุณ และอนิเมชัน scroll-driven เดิม ยังคงเหมือนเดิม
ไม่ได้แก้ไขโครงสร้างของฉาก (Home.tsx ไม่ถูกแตะ)

---

## 1) ติดตั้ง dependencies

```bash
pnpm install
```

ระบบเพิ่มแพ็กเกจใหม่ให้แล้ว: `@supabase/supabase-js`

---

## 2) ตั้งค่าตัวแปรแวดล้อม

ผมเขียน `.env` ไว้ให้แล้ว แต่ถ้าจะแก้ดูที่ `.env.example`:

```env
VITE_SUPABASE_URL=https://cugjecldmbxxofzbbtbj.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key ของคุณ>
VITE_GOOGLE_CLIENT_ID=1018634017815-1ek98ajviqghl738trngh7sfol12u3pj.apps.googleusercontent.com

# ตัวเลือก: ถ้าจะเปลี่ยนโมเดลสมอง 3D เป็นไฟล์อื่น (แนะนำ .glb)
# VITE_BRAIN_MODEL_URL=https://your-cdn.com/brain-realistic.glb
```

> ⚠️ **อย่า** ใส่ `service_role` key ในฝั่ง client เด็ดขาด ใช้เฉพาะใน Dashboard/Server เท่านั้น

---

## 3) สร้างตารางใน Supabase (ทำครั้งเดียว)

1. เปิด **Supabase Dashboard → SQL Editor → New query**
2. คัดลอกเนื้อหาทั้งหมดจาก `supabase/migrations/0001_init.sql` ในโปรเจกต์นี้
3. กด **Run**

สคริปต์นี้จะสร้าง:
- `profiles`, `user_settings`, `user_progress`, `user_streaks`, `user_activities`
- เปิด **Row Level Security** + policy ให้ผู้ใช้เห็นเฉพาะข้อมูลของตัวเอง
- Trigger สร้าง row เริ่มต้นให้ผู้ใช้ใหม่อัตโนมัติ
- Function `touch_streak()` สำหรับนับ streak แบบ atomic

---

## 4) เปิดใช้ Google OAuth ใน Supabase

ใน Supabase Dashboard:

1. **Authentication → Providers → Google → Enable**
2. ใส่ **Client ID** และ **Client Secret** จาก Google Cloud Console
   - Client ID ที่คุณส่งมา: `1018634017815-1ek98ajviqghl738trngh7sfol12u3pj.apps.googleusercontent.com`
3. ไป **Authentication → URL Configuration**
   - **Site URL**: `https://your-domain.com` (หรือ `http://localhost:3000` ตอน dev)
   - **Additional Redirect URLs** เพิ่มทั้งหมดที่จะใช้ เช่น
     - `http://localhost:3000`
     - `https://your-prod-domain.com`
4. ใน Google Cloud Console (OAuth client เดิม) เพิ่ม Authorized redirect URI:
   ```
   https://cugjecldmbxxofzbbtbj.supabase.co/auth/v1/callback
   ```

---

## 5) รัน dev / build

```bash
pnpm dev      # โหมดพัฒนา (port 3000)
pnpm build    # build production -> dist/
pnpm start    # รัน server static หลัง build
```

---

## 6) โมเดล 3D สมอง (สวย ๆ สมจริง)

ตอนนี้แอปอ่านโมเดลจาก:
1. ตัวแปรแวดล้อม `VITE_BRAIN_MODEL_URL` (ถ้าตั้ง)
2. ค่า default: `client/public/models/brain.glb` (มีอยู่แล้วในโปรเจกต์)

### โมเดลแบบที่แนะนำ

| คุณสมบัติ | แนะนำ |
| --- | --- |
| ฟอร์แมต | **glTF 2.0 (.glb)** บีบอัดด้วย Draco หรือ Meshopt |
| ขนาด | < 25 MB (เพื่อโหลดเร็วบนมือถือ) |
| Material | PBR (`MeshStandardMaterial` / `MeshPhysicalMaterial`) มี normal + roughness map |
| Topology | สมองชิ้นเดียว / กลีบสมองแยก mesh ก็ได้ |
| Up axis | Y-up (มาตรฐาน glTF) |
| Animation | ไม่จำเป็น (BrainScene เพิ่ม pulse/rotation ให้เอง) |

### แหล่งโมเดลฟรี/เสียเงินที่นิยม

- **Sketchfab** — ค้น `realistic human brain` (กรองเป็น glTF, license CC)
  - ตัวอย่างฟรี: <https://sketchfab.com/3d-models/anatomy-of-the-human-brain-c08ea527b8ad4f10b3b6982ec57d6cdf>
- **TurboSquid / CGTrader** — มีโมเดล medical-grade ที่ texture สมจริงระดับสูง
- **NIH 3D Print Exchange** — มีโมเดลทางการแพทย์ที่นำมาใช้ได้

วิธีใส่ลิงก์ของคุณเอง:

```env
VITE_BRAIN_MODEL_URL=https://your-cdn.com/brain.glb
```

หรือดาวน์โหลดไฟล์มาวางที่ `client/public/models/brain.glb` (ทับของเดิม)

> หมายเหตุ: ถ้าโหลดไม่สำเร็จ ระบบจะ fallback เป็น procedural neural sphere
> ที่สวยพอใช้งานได้ทันที ไม่ทำให้แอปพัง

---

## 7) ส่วนใหม่ที่เพิ่มเข้ามา

- `client/src/lib/supabase.ts` — Supabase client
- `client/src/contexts/AuthContext.tsx` — เปลี่ยนเป็น Supabase Auth
- `client/src/contexts/ThemeContext.tsx` — รองรับ theme + textScale
- `client/src/hooks/useUserData.ts` — settings/progress/streak/activity logging
- `client/src/components/UserSettingsSync.tsx` — sync settings ↔ Supabase
- `client/src/components/SettingsPanel.tsx` — แผงปรับ theme + ขนาดตัวอักษร + streak
- `client/src/components/BrainScene.tsx` — เวอร์ชันสมจริงขึ้น (PBR + envMap)

ส่วนเดิมที่ **ไม่** แก้:
- `client/src/pages/Home.tsx` (โครง scroll/scene ทั้งหมด)
- `client/src/components/SceneContent.tsx`, `Navigation.tsx`, `StatsPanel.tsx` ฯลฯ
- ฉากต่าง ๆ ใน `client/src/lib/sceneData.ts`

---

## 8) ตรวจสอบว่าใช้งานได้

1. รัน `pnpm dev` แล้วเปิด `http://localhost:3000`
2. กดปุ่ม **เข้าสู่ระบบด้วย Google** → เลือกบัญชี
3. ระบบจะเปลี่ยน redirect กลับมา และเข้าหน้าหลักโดยอัตโนมัติ
4. ปุ่มเฟือง (มุมล่างขวา) → เปลี่ยน Dark/Light, A−/A+ → ลองรีเฟรชหรือเข้าจากอุปกรณ์อื่น ค่าจะตามไป
5. เปิด Supabase Dashboard → Table Editor → ดู `user_settings`, `user_progress`, `user_streaks`, `user_activities` จะมีข้อมูลของผู้ใช้แต่ละคน

---

ถ้าต้องการให้ผมเพิ่มฟีเจอร์อื่น (เช่น dashboard ประวัติผู้ใช้, leaderboard, sync ค่าเสียงระหว่างอุปกรณ์) แจ้งได้เลยครับ
