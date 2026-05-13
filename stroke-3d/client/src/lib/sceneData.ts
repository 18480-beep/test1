/*
 * Scene Data Configuration
 * Design: "Surgical Theater" — Dark Cinematic Medical Realism
 * Each scene represents a step in the anatomical journey from face to stroke
 *
 * ⚠️  BASE CANVAS: 1920 × 1080 px
 *     ค่า x, y, w, fontSize ทั้งหมดอิงกับ canvas นี้
 *     SceneContent.tsx จะ scale อัตโนมัติตามขนาดจอจริง
 *     ห้ามใส่ค่าที่คิดมาจากจอขนาดอื่น เพราะจะ offset ผิด
 *
 * textBoxes?: เพิ่มกล่องข้อความหลายกล่องได้ต่อ scene
 *   x, y     = ตำแหน่งจากมุมบนซ้าย (px บน 1920×1080)
 *   w        = ความกว้าง (px บน 1920×1080)
 *   fontSize = ขนาดตัวอักษร (px บน 1920×1080)
 *   title    = หัวข้อ (ไม่ใส่ก็ได้)
 *   body     = เนื้อหา (รองรับ \n ขึ้นบรรทัดใหม่)
 *
 * gameButton?: ปุ่มเริ่มเกม (label/subLabel/topLabel/x/y/fontSize/paddingX/paddingY/color/gameUrl)
 *   - x ไม่ใส่ = center กลางจอ
 *   - y = bottom offset (px) จากล่าง default 112
 *   - color ไม่ใส่ = ใช้ accentColor ของ scene
 *   ⚠️  x, y, fontSize ของ gameButton ก็อิง 1920×1080 เช่นกัน
 */
import { themeConfig } from "./themeConfig";

export interface TextBoxData {
  x: number;
  y: number;
  w?: number;
  fontSize?: number;
  title?: string;
  body: string;
}

export interface GameButtonConfig {
  label: string;
  subLabel?: string;
  topLabel?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  paddingX?: number;
  paddingY?: number;
  color?: string;
  gameUrl?: string;
}

export interface SceneData {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  accentColor: string;
  facts?: string[];
  textBoxes?: TextBoxData[];
  gameButton?: GameButtonConfig;
}

export const SCENES: SceneData[] = [
  {
    id: 0,
    slug: "แนะนำ",
    title: "ฟื้นฟูสโตรก",
    subtitle: "แอปนี้เพื่อ",
    description:
      "Every stroke begins beneath the surface. We start with the human head — a complex structure housing the most vital organ. Scroll down to begin your journey into the anatomy of stroke.",
    image:
      "https://img2.pic.in.th/impvest_one_pager.pdf-2.png",
    accentColor: themeConfig.scenes.scene0.accent,
    facts: [
      "The brain receives 20% of the body's blood supply",
      "15% of cardiac output goes directly to the brain",
      "The brain uses about 20% of the body's oxygen",
    ],
  },
  {
    id: 1,
    slug: "การฝึก",
    title: "เกมกายภาพ ส่วน แขน และ มือ",
    subtitle: "Skin → Skull Transition",
    description:
      "เกมนี้จะพาคุณผ่านการฝึกกายภาพบำบัดสำหรับแขนและมือ ซึ่งเป็นส่วนที่สำคัญในการฟื้นฟูสโตรก การฝึกนี้จะช่วยเพิ่มความแข็งแรงและความคล่องตัวของแขนและมือ เพื่อให้คุณสามารถกลับมาใช้ชีวิตประจำวันได้อย่างเต็มที่",
    image:
      "https://cdn.phototourl.com/free/2026-05-07-e47285f3-dae9-4d01-ac96-5cf044b78aa3.png",
    accentColor: themeConfig.scenes.scene1.accent,
    facts: [
      "สามารถเล่นเกมนี้ได้ทุกที่ทุกเวลา",
      "ช่วยในการออกกำลังกายแขนและมือ",
      "เกมนี้มีต้นแบบมาจาก เกม BEAT SABER ที่ได้รับความนิยมอย่างมาก",
    ],
    gameButton: {
      label: "▶  เริ่มเกม",
      topLabel: "● INTERACTIVE MODULE",
      subLabel: "แขน & มือ — Beat Saber Rehab",
      y: 112,
      fontSize: 30,
      paddingX: 56,
      paddingY: 18,
      gameUrl: "/game/index.html",
    },
  },
  {
    id: 2,
    slug: "brain",
    title: "The Brain Revealed",
    subtitle: "Command Center of Life",
    description:
      "The brain — weighing only 1.4 kg — controls every function of the human body.",
    image:
      "https://i.postimg.cc/4N72Q4vf/Chat-GPT-Image-May-10-2026-12-24-11-PM-(1).png",
    accentColor: themeConfig.scenes.scene2.accent,
    // ⚠️ ค่า x, y, w, fontSize ด้านล่างอิง canvas 1920×1080
    // SceneContent.tsx จะ scale ให้อัตโนมัติ
    textBoxes: [
      {
        x: 130, y: 98,
        w: 480, fontSize: 25,
        title: "รูปแบบออกกำลังกายการอ่าน",
        body: "Reading Workout Routine",
      },
      {
        x: 130, y: 228,
        w: 590, fontSize: 20,
        title: "1. วอร์มอัพ (Warm-up)",
        body: "• ค่อยๆอ่านตามที่กำหนด\n• อ่านออกเสียงให้ชัดเจนที่สุดเพื่อกระประเมิน",
      },
      {
        x: 130, y: 380,
        w: 590, fontSize: 20,
        title: "2. ฝึกออกเสียง (Pronunciation Drill)",
        body: "• ออกเสียงให้ชัดเจนที่สุด\n• อ่านคำ: บ้าน, เด็ก, ฟ้า, มาดี, รักกัน\n• ออกเสียงเน้น \"ชัด - ถูก - คล่อง\"",
      },
      {
        x: 130, y: 560,
        w: 590, fontSize: 20,
        title: "3. อ่านประโยค (Sentence Practice)",
        body: "• อ่านประโยคที่ยากขึ้นจะอยู่ในเลเวลท้าย\n• เน้นจังหวะ การเว้นวรรค และน้ำเสียง\n• มีคำกำกวมเพื่อให้ได้ฝึกการออกเสียง",
      },
      {
        x: 150, y: 770,
        w: 540, fontSize: 22,
        title: "⭐ เคล็ดลับสำคัญ",
        body: "✓ ออกเสียงทุกวัน แม้วันละ 10 นาที\n✓ บันทึกเสียงเพื่อฟังและพัฒนา\n✓ อย่ากลัวผิด ให้ฝึกอย่างสม่ำเสมอ",
      },
    ],
    gameButton: {
      label: "▶  ฝึกออกเสียง",
      topLabel: "● SPEECH MODULE",
      subLabel: "Reading & Pronunciation Workout",
      y: 88,
      x: 1020,
      fontSize: 24,
      paddingX: 46,
      paddingY: 15,
      color: "#00d4aa",
      gameUrl: "/game/NEW.html",
    },
  },
  {
    id: 3,
    slug: "vessels",
    title: "Vascular Network",
    subtitle: "Rivers of Life",
    description:
      "The cerebral vascular system delivers oxygen-rich blood to every region of the brain. The Circle of Willis acts as a critical junction, distributing blood through anterior, middle, and posterior cerebral arteries.",
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663606879672/MXVKFDVN9tF6BUuQHFXUDG/blood-vessels-network-Ti3FUDdfz6ZVpE9ovaLAJJ.webp",
    accentColor: themeConfig.scenes.scene3.accent,
    facts: [
      "~400 miles of blood vessels in the brain",
      "Blood flow: ~750 mL per minute",
      "Circle of Willis provides collateral circulation",
      "Neurons die within minutes without oxygen",
    ],
    gameButton: {
      label: "▶  เริ่มฝึก",
      topLabel: "● VASCULAR MODULE",
      subLabel: "Cerebral Blood Flow Training",
      y: 112,
      x: 950,
      fontSize: 30,
      paddingX: 56,
      paddingY: 18,
      color: "#ff2020",
      gameUrl: "/game/my-game/index.html",
    },
  },
  {
    id: 4,
    slug: "ischemic",
    title: "Ischemic Stroke",
    subtitle: "When Blood Flow Stops",
    description:
      "An ischemic stroke occurs when a blood clot blocks an artery supplying the brain. The affected region is starved of oxygen, and brain cells begin to die within minutes. This is the most common type, accounting for ~87% of all strokes.",
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663606879672/MXVKFDVN9tF6BUuQHFXUDG/ischemic-stroke-event-XgmhRoaQFfXnSZo5d4dWit.webp",
    accentColor: themeConfig.scenes.scene4.accent,
    facts: [
      "87% of all strokes are ischemic",
      "1.9 million neurons die every minute during stroke",
      "Tissue plasminogen activator (tPA) can dissolve clots",
      "Treatment window: within 4.5 hours of onset",
    ],
    gameButton: {
      label: "▶  ฝึกฟื้นฟู",
      topLabel: "● ISCHEMIC REHAB MODULE",
      subLabel: "Stroke Recovery Training",
      y: 112,
      fontSize: 14,
      paddingX: 56,
      paddingY: 18,
      color: "#ff6b00",
      gameUrl: "/game/index.html",
    },
  },
  {
    id: 5,
    slug: "hemorrhagic",
    title: "Hemorrhagic Stroke",
    subtitle: "When Vessels Rupture",
    description:
      "A hemorrhagic stroke occurs when a weakened blood vessel ruptures, leaking blood into the brain tissue. The expanding blood pool creates pressure that damages surrounding neurons. Though less common, it is often more severe.",
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663606879672/MXVKFDVN9tF6BUuQHFXUDG/hemorrhagic-stroke-event-XzV7xGQujWcG7qXczumg6S.webp",
    accentColor: themeConfig.scenes.scene5.accent,
    facts: [
      "13% of strokes are hemorrhagic",
      "Mortality rate: 40% within first month",
      "High blood pressure is the leading cause",
      "Surgery may be needed to relieve pressure",
    ],
  },
];

export const SCENE_COUNT = SCENES.length;