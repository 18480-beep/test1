# Design Brainstorm: Stroke 3D Interactive Education

## Context
สร้าง 3D Interactive Web Application เกี่ยวกับ Stroke (โรคหลอดเลือดสมอง) ที่มี cinematic transitions จากใบหน้า → กะโหลก → สมอง → หลอดเลือด → จำลอง Stroke โดยใช้ Three.js, GSAP และ WebGL พร้อม scroll-driven animations ตามสไตล์ในวิดีโอ reference

---

<response>
<text>

## Idea 1: "Surgical Theater" — Dark Cinematic Medical Realism

**Design Movement:** Cinematic Medical Visualization ผสม Film Noir

**Core Principles:**
1. ความมืดเป็นพื้นหลังหลัก เพื่อให้ 3D model เป็นจุดสนใจเดียว
2. แสง Rim Light สีฟ้าอมเขียว (Surgical Green) เป็น accent หลัก
3. ข้อมูลทางการแพทย์ปรากฏเหมือน HUD ของห้องผ่าตัด
4. ทุก transition เหมือนกล้องจุลทรรศน์ zoom เข้าไปในร่างกาย

**Color Philosophy:**
- พื้นหลัง: Nearly black (#0A0A0F) — ความมืดของห้องผ่าตัด
- Primary accent: Surgical teal (#00D4AA) — แสงจากเครื่องมือแพทย์
- Blood vessels: Deep crimson (#8B0000) → Bright red (#FF2020) สำหรับ active flow
- Brain tissue: Muted pink (#C4A0A0) with subtle subsurface scattering
- Warning/Stroke: Pulsating amber (#FF6B00) → Deep purple (#4A0028)

**Layout Paradigm:**
- Full-viewport 3D canvas เป็น center stage
- Text content ปรากฏเป็น floating panels ด้านซ้าย เหมือน surgical monitor
- Progress indicator เป็น vertical timeline ด้านขวา เหมือน vital signs monitor
- Scroll-driven: ทั้งหน้าเป็น continuous scroll experience

**Signature Elements:**
1. "Pulse Line" — เส้น ECG ที่วิ่งอยู่ด้านล่างตลอด sync กับ animation
2. "Depth Scanner" — วงแหวนแสงที่ scan ผ่าน 3D model ขณะ transition
3. Particle blood flow — อนุภาคเลือดที่ไหลตาม vessel paths

**Interaction Philosophy:**
- Mouse hover บน 3D model = แสง spotlight ตามตำแหน่ง cursor
- Scroll = ควบคุม timeline ของ anatomical journey
- Click บน brain regions = zoom in พร้อม info panel

**Animation:**
- GSAP ScrollTrigger ควบคุมทุก transition
- Shader-based dissolve: skin → skull (opacity + noise displacement)
- Camera dolly zoom เข้าไปในกะโหลก
- Blood flow particles ใช้ GPU instancing
- Stroke event: screen vignette + chromatic aberration + shake

**Typography System:**
- Display: "Space Grotesk" — geometric, modern, medical feel
- Body: "IBM Plex Sans" — clean, readable, technical
- Data labels: "JetBrains Mono" — monospace สำหรับ medical data

</text>
<probability>0.08</probability>
</response>

---

<response>
<text>

## Idea 2: "Living Atlas" — Luminous Anatomical Illustration

**Design Movement:** Neo-Anatomical Illustration ผสม Bioluminescence Art

**Core Principles:**
1. ร่างกายมนุษย์เป็นงานศิลปะที่มีชีวิต — ทุกส่วนเรืองแสงจากภายใน
2. พื้นหลังสีกรมท่าลึก เหมือนมหาสมุทรลึก — สมองเป็นสิ่งมีชีวิตใต้น้ำ
3. ข้อมูลไหลเหมือนกระแสน้ำ — text ปรากฏและหายไปอย่างเป็นธรรมชาติ
4. แต่ละ layer ของร่างกายมี "ชีวิต" ของตัวเอง

**Color Philosophy:**
- พื้นหลัง: Deep ocean navy (#0B1426) — ความลึกลับของร่างกาย
- Bioluminescent glow: Cyan (#00E5FF) + Magenta (#FF00E5) — neural signals
- Skin: Warm amber glow (#FFB347) — ความอบอุ่นของชีวิต
- Brain: Soft violet (#9B72CF) with internal glow
- Stroke danger: Neon red (#FF0040) — สัญญาณอันตราย

**Layout Paradigm:**
- Asymmetric split: 3D model ขยับตำแหน่งตาม scroll (ซ้าย → กลาง → ขวา)
- Text blocks ลอยอยู่ในตำแหน่งต่างๆ เหมือน specimens ใน museum
- Parallax depth layers — foreground particles, midground model, background nebula
- No fixed grid — organic, flowing layout

**Signature Elements:**
1. "Neural Sparks" — จุดแสงเล็กๆ วิ่งตาม neural pathways บน 3D model
2. "Breath Ripple" — คลื่นแสงที่กระเพื่อมจาก model ออกมาทุกจังหวะหายใจ
3. Glowing wireframe overlay ที่ปรากฏขณะ transition ระหว่าง layers

**Interaction Philosophy:**
- Scroll = journey ลงไปในร่างกาย (เหมือนดำน้ำลึก)
- Mouse proximity = bioluminescent reaction (model สว่างขึ้นใกล้ cursor)
- Hover บน regions = neural spark animation + label reveal

**Animation:**
- Scroll-driven morphing ด้วย custom shaders
- Bioluminescent pulse: sine wave glow intensity
- Transition: wireframe reveal → fill → next layer
- Blood flow: flowing light trails ตาม bezier curves
- Stroke: bioluminescence dies out in affected area — darkness spreads

**Typography System:**
- Display: "Playfair Display" — elegant, authoritative, like medical textbook titles
- Body: "Source Sans 3" — highly readable, neutral
- Annotations: "Fira Code" — technical labels on 3D model

</text>
<probability>0.06</probability>
</response>

---

<response>
<text>

## Idea 3: "Clinical Scrollytelling" — Modern Medical Dashboard Narrative

**Design Movement:** Scrollytelling + Medical Data Visualization ตามสไตล์ในวิดีโอ reference

**Core Principles:**
1. Light, clean canvas เป็นพื้นหลัง — 3D model เป็น hero element
2. Scroll ควบคุม narrative ทั้งหมด — เหมือนเล่าเรื่องทีละบท
3. ข้อมูลทางการแพทย์ปรากฏเป็น elegant cards/panels ด้านข้าง
4. ทุก transition เป็น smooth morphing — ไม่มี hard cuts

**Color Philosophy:**
- พื้นหลัง: Off-white (#F5F5F0) — สะอาด เป็นมืออาชีพ
- 3D model: Realistic tones with subtle warm lighting
- Accent: Deep medical blue (#1A3A5C) — ความน่าเชื่อถือ
- Blood: Vivid red (#DC2626) — contrast สูงบนพื้นขาว
- Stroke highlight: Warning orange (#F59E0B) → Danger red (#EF4444)
- Text: Charcoal (#1F2937) — อ่านง่าย

**Layout Paradigm:**
- Split-screen narrative: Text ซ้าย, 3D model ขวา (sticky)
- 3D model คงที่ขณะ scroll — text sections เลื่อนผ่าน
- Progress dots ด้านขวาสุด แสดงตำแหน่งใน journey
- Responsive: mobile = stacked (text above, 3D below)

**Signature Elements:**
1. "Anatomy Breadcrumb" — แถบด้านบนแสดง: Face → Skull → Brain → Vessels → Stroke
2. "Morphing Counter" — ตัวเลขแสดง depth level ขณะ zoom เข้า
3. Subtle grid pattern บนพื้นหลัง เหมือนกระดาษกราฟทางการแพทย์

**Interaction Philosophy:**
- Scroll = เลื่อน narrative + trigger 3D transitions
- Click บน breadcrumb = jump ไปยัง section
- Hover บน 3D = highlight + tooltip
- Mouse drag บน 3D = orbit control (เมื่ออยู่ใน interactive mode)

**Animation:**
- GSAP ScrollTrigger pin 3D canvas
- Smooth opacity/displacement shader transitions
- Text: slide-up + fade-in ตาม scroll position
- Blood flow: particle system with directional movement
- Stroke: area darkening + subtle camera shake + vignette

**Typography System:**
- Display: "Space Grotesk" — bold, modern, technical
- Body: "Inter" — clean, universal readability
- Medical labels: "Roboto Mono" — precise, data-like

</text>
<probability>0.04</probability>
</response>

---

## Selected Approach: Idea 1 — "Surgical Theater" (Dark Cinematic Medical Realism)

เลือก Idea 1 เพราะ:
1. Dark background ทำให้ 3D anatomical models โดดเด่นที่สุด — เหมาะกับ medical visualization
2. Cinematic feel ตรงกับ requirement "visually cinematic, medically accurate, emotionally engaging"
3. Surgical teal accent สร้างบรรยากาศทางการแพทย์ที่แตกต่างจากเว็บทั่วไป
4. Full-viewport 3D canvas ให้ immersive experience สูงสุด
5. ECG pulse line และ depth scanner เป็น signature elements ที่ unique
