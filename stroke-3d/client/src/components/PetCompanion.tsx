/**
 * PetCompanion.tsx — v4 "3D Lifelong"
 *
 * ใช้ไฟล์ 3D (.glb) จาก /public/models/pets/
 *
 * ─── ชื่อไฟล์ที่ต้องเตรียม ───────────────────────────────────────
 *
 *  👶 ทารกผู้ชาย (baby_boy)
 *   baby_boy_0.glb   → แรกเกิด       (0 วัน)
 *   baby_boy_1.glb   → ทารกน้อย      (3 วัน)
 *   baby_boy_2.glb   → หัดคลาน       (7 วัน)
 *   baby_boy_3.glb   → หัดเดิน       (14 วัน)
 *   baby_boy_4.glb   → เด็กน้อย      (30 วัน)
 *   baby_boy_5.glb   → เด็กโต        (60 วัน)
 *   baby_boy_6.glb   → วัยรุ่น        (90 วัน)
 *   baby_boy_7.glb   → หนุ่มสาว      (180 วัน)
 *   baby_boy_8.glb   → ผู้ใหญ่        (365 วัน)
 *   baby_boy_9.glb   → ผู้อาวุโส     (730 วัน)
 *   baby_boy_10.glb  → ตำนาน         (1095 วัน)
 *
 *  👶 ทารกผู้หญิง (baby_girl)
 *   baby_girl_0.glb  → แรกเกิด
 *   baby_girl_1.glb  → ทารกน้อย
 *   baby_girl_2.glb  → หัดคลาน
 *   baby_girl_3.glb  → หัดเดิน
 *   baby_girl_4.glb  → เด็กน้อย
 *   baby_girl_5.glb  → เด็กโต
 *   baby_girl_6.glb  → วัยรุ่น
 *   baby_girl_7.glb  → สาว
 *   baby_girl_8.glb  → ผู้ใหญ่
 *   baby_girl_9.glb  → ผู้อาวุโส
 *   baby_girl_10.glb → ตำนาน
 *
 *  🐶 น้องหมา (dog)
 *   dog_0.glb   → ลูกหมาแรกเกิด    (0 วัน)
 *   dog_1.glb   → ลูกหมาน้อย       (3 วัน)
 *   dog_2.glb   → ลูกหมาขี้เล่น    (7 วัน)
 *   dog_3.glb   → หมาน้อย          (14 วัน)
 *   dog_4.glb   → หมาโตขึ้น        (30 วัน)
 *   dog_5.glb   → หมาวัยรุ่น       (60 วัน)
 *   dog_6.glb   → หมาผู้ใหญ่       (90 วัน)
 *   dog_7.glb   → หมาแก่           (180 วัน)
 *   dog_8.glb   → หมาตำนาน         (365 วัน)
 *   dog_9.glb   → หมาอาวุโส        (730 วัน)
 *   dog_10.glb  → หมาผู้ยิ่งใหญ่   (1095 วัน)
 *
 *  🐱 น้องแมว (cat)
 *   cat_0.glb   → ลูกแมวแรกเกิด    (0 วัน)
 *   cat_1.glb   → ลูกแมวน้อย       (3 วัน)
 *   cat_2.glb   → ลูกแมวขี้เล่น    (7 วัน)
 *   cat_3.glb   → แมวน้อย          (14 วัน)
 *   cat_4.glb   → แมวโตขึ้น        (30 วัน)
 *   cat_5.glb   → แมววัยรุ่น       (60 วัน)
 *   cat_6.glb   → แมวผู้ใหญ่       (90 วัน)
 *   cat_7.glb   → แมวแก่           (180 วัน)
 *   cat_8.glb   → แมวตำนาน         (365 วัน)
 *   cat_9.glb   → แมวอาวุโส        (730 วัน)
 *   cat_10.glb  → แมวผู้ยิ่งใหญ่   (1095 วัน)
 *
 * วางทุกไฟล์ที่: /client/public/models/pets/
 * ตัวอย่าง: /client/public/models/pets/dog_0.glb
 *
 * ─── ถ้าไม่มีไฟล์ .glb ─────────────────────────────────────────
 * จะแสดง Pixel Sprite fallback อัตโนมัติ (เหมือน v3)
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type PetType = "baby_boy" | "baby_girl" | "dog" | "cat";

interface GrowthStage {
  label: string;
  minDays: number;
  color: string;
  glow: string;
  modelScale: number;
  spriteScale: number;
}

// ─── Stage Definitions ────────────────────────────────────────────────────────
const BABY_STAGES: GrowthStage[] = [
  { label: "แรกเกิด",    minDays: 0,    color: "#ffd6a5", glow: "rgba(255,214,165,0.4)",  modelScale: 0.8,  spriteScale: 20 },
  { label: "ทารกน้อย",   minDays: 3,    color: "#ffd6a5", glow: "rgba(255,214,165,0.4)",  modelScale: 0.9,  spriteScale: 24 },
  { label: "หัดคลาน",   minDays: 7,    color: "#ffb347", glow: "rgba(255,179,71,0.4)",   modelScale: 1.0,  spriteScale: 28 },
  { label: "หัดเดิน",   minDays: 14,   color: "#ffb347", glow: "rgba(255,179,71,0.4)",   modelScale: 1.1,  spriteScale: 34 },
  { label: "เด็กน้อย",  minDays: 30,   color: "#ff9f1c", glow: "rgba(255,159,28,0.4)",   modelScale: 1.3,  spriteScale: 40 },
  { label: "เด็กโต",    minDays: 60,   color: "#ff9f1c", glow: "rgba(255,159,28,0.4)",   modelScale: 1.5,  spriteScale: 46 },
  { label: "วัยรุ่น",   minDays: 90,   color: "#f72585", glow: "rgba(247,37,133,0.4)",   modelScale: 1.7,  spriteScale: 52 },
  { label: "หนุ่มสาว",  minDays: 180,  color: "#7209b7", glow: "rgba(114,9,183,0.4)",    modelScale: 1.9,  spriteScale: 58 },
  { label: "ผู้ใหญ่",   minDays: 365,  color: "#3a0ca3", glow: "rgba(58,12,163,0.45)",   modelScale: 2.1,  spriteScale: 64 },
  { label: "ผู้อาวุโส", minDays: 730,  color: "#4361ee", glow: "rgba(67,97,238,0.45)",   modelScale: 2.3,  spriteScale: 72 },
  { label: "ตำนาน",     minDays: 1095, color: "#4cc9f0", glow: "rgba(76,201,240,0.5)",   modelScale: 2.6,  spriteScale: 82 },
];

const DOG_STAGES: GrowthStage[] = [
  { label: "ลูกหมาแรกเกิด",  minDays: 0,    color: "#f4a261", glow: "rgba(244,162,97,0.4)",   modelScale: 0.7,  spriteScale: 18 },
  { label: "ลูกหมาน้อย",      minDays: 3,    color: "#f4a261", glow: "rgba(244,162,97,0.4)",   modelScale: 0.85, spriteScale: 22 },
  { label: "ลูกหมาขี้เล่น",   minDays: 7,    color: "#e76f51", glow: "rgba(231,111,81,0.4)",   modelScale: 1.0,  spriteScale: 27 },
  { label: "หมาน้อย",         minDays: 14,   color: "#e76f51", glow: "rgba(231,111,81,0.4)",   modelScale: 1.15, spriteScale: 32 },
  { label: "หมาโตขึ้น",       minDays: 30,   color: "#e9c46a", glow: "rgba(233,196,106,0.4)",  modelScale: 1.3,  spriteScale: 38 },
  { label: "หมาวัยรุ่น",      minDays: 60,   color: "#e9c46a", glow: "rgba(233,196,106,0.4)",  modelScale: 1.5,  spriteScale: 44 },
  { label: "หมาผู้ใหญ่",      minDays: 90,   color: "#f77f00", glow: "rgba(247,127,0,0.4)",    modelScale: 1.7,  spriteScale: 50 },
  { label: "หมาแก่",          minDays: 180,  color: "#d62828", glow: "rgba(214,40,40,0.4)",    modelScale: 1.9,  spriteScale: 56 },
  { label: "หมาตำนาน",        minDays: 365,  color: "#fcbf49", glow: "rgba(252,191,73,0.45)",  modelScale: 2.1,  spriteScale: 64 },
  { label: "หมาอาวุโส",       minDays: 730,  color: "#eae2b7", glow: "rgba(234,226,183,0.45)", modelScale: 2.3,  spriteScale: 70 },
  { label: "หมาผู้ยิ่งใหญ่",  minDays: 1095, color: "#ffffff", glow: "rgba(255,255,255,0.5)",  modelScale: 2.6,  spriteScale: 80 },
];

const CAT_STAGES: GrowthStage[] = [
  { label: "ลูกแมวแรกเกิด",  minDays: 0,    color: "#c77dff", glow: "rgba(199,125,255,0.4)",  modelScale: 0.7,  spriteScale: 18 },
  { label: "ลูกแมวน้อย",      minDays: 3,    color: "#c77dff", glow: "rgba(199,125,255,0.4)",  modelScale: 0.85, spriteScale: 22 },
  { label: "ลูกแมวขี้เล่น",   minDays: 7,    color: "#9d4edd", glow: "rgba(157,78,221,0.4)",   modelScale: 1.0,  spriteScale: 27 },
  { label: "แมวน้อย",         minDays: 14,   color: "#9d4edd", glow: "rgba(157,78,221,0.4)",   modelScale: 1.15, spriteScale: 32 },
  { label: "แมวโตขึ้น",       minDays: 30,   color: "#7b2d8b", glow: "rgba(123,45,139,0.4)",   modelScale: 1.3,  spriteScale: 38 },
  { label: "แมววัยรุ่น",      minDays: 60,   color: "#e040fb", glow: "rgba(224,64,251,0.4)",   modelScale: 1.5,  spriteScale: 44 },
  { label: "แมวผู้ใหญ่",      minDays: 90,   color: "#ff80ab", glow: "rgba(255,128,171,0.4)",  modelScale: 1.7,  spriteScale: 50 },
  { label: "แมวแก่",          minDays: 180,  color: "#ff4081", glow: "rgba(255,64,129,0.4)",   modelScale: 1.9,  spriteScale: 56 },
  { label: "แมวตำนาน",        minDays: 365,  color: "#ff6ec7", glow: "rgba(255,110,199,0.45)", modelScale: 2.1,  spriteScale: 64 },
  { label: "แมวอาวุโส",       minDays: 730,  color: "#f8bbd9", glow: "rgba(248,187,217,0.45)", modelScale: 2.3,  spriteScale: 70 },
  { label: "แมวผู้ยิ่งใหญ่",  minDays: 1095, color: "#ffffff", glow: "rgba(255,255,255,0.5)",  modelScale: 2.6,  spriteScale: 80 },
];

function getStageList(type: PetType): GrowthStage[] {
  if (type === "dog") return DOG_STAGES;
  if (type === "cat") return CAT_STAGES;
  return BABY_STAGES;
}

function getStageIndex(days: number, list: GrowthStage[]): number {
  let idx = 0;
  for (let i = 0; i < list.length; i++) {
    if (days >= list[i].minDays) idx = i;
  }
  return idx;
}

function formatAge(days: number): string {
  if (days < 1)   return "เกิดวันนี้";
  if (days < 7)   return `${Math.floor(days)} วัน`;
  if (days < 30)  return `${Math.floor(days / 7)} สัปดาห์`;
  if (days < 365) return `${Math.floor(days / 30)} เดือน`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m > 0 ? `${y} ปี ${m} เดือน` : `${y} ปี`;
}

/** แปลง petType + stageIndex → path .glb */
function getModelPath(type: PetType, stageIdx: number): string {
  return `/models/pets/${type}_${stageIdx}.glb`;
}

// ─── Pixel Sprite Fallbacks ───────────────────────────────────────────────────
function BabyBoySprite({ size, color, s }: { size: number; color: string; s: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 24" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x="5" y="1" width="10" height="9" rx="2" fill={color} />
      {s >= 3 && <rect x="5" y="1" width="10" height="2" fill="#4a3728" />}
      {s >= 5 && <rect x="5" y="0" width="3" height="2" fill="#4a3728" />}
      {s >= 5 && <rect x="12" y="0" width="3" height="2" fill="#4a3728" />}
      <rect x="7"  y="4" width="2" height="2" fill="#1a1a2e" />
      <rect x="11" y="4" width="2" height="2" fill="#1a1a2e" />
      <rect x="7"  y="4" width="1" height="1" fill="rgba(255,255,255,0.6)" />
      <rect x="11" y="4" width="1" height="1" fill="rgba(255,255,255,0.6)" />
      {s >= 1 && <rect x="8" y="7" width="4" height="1" fill="#e07070" />}
      {s < 2  && <rect x="5" y="10" width="10" height="8" rx="2" fill={color} />}
      {s >= 2 && <rect x="5" y="10" width="10" height="6" rx="1" fill="#5b8dd9" />}
      {s >= 2 && <rect x="5" y="16" width="4" height="5" fill="#3a5a8a" />}
      {s >= 2 && <rect x="11" y="16" width="4" height="5" fill="#3a5a8a" />}
      {s < 2  && <rect x="2"  y="10" width="3" height="4" rx="1" fill={color} />}
      {s < 2  && <rect x="15" y="10" width="3" height="4" rx="1" fill={color} />}
      {s >= 2 && <rect x="2"  y="10" width="3" height="5" rx="1" fill="#5b8dd9" />}
      {s >= 2 && <rect x="15" y="10" width="3" height="5" rx="1" fill="#5b8dd9" />}
      {s < 2  && <rect x="6" y="18" width="8" height="4" rx="2" fill={color} />}
      {s >= 2 && <rect x="5"  y="21" width="4" height="2" rx="1" fill="#2a3a6a" />}
      {s >= 2 && <rect x="11" y="21" width="4" height="2" rx="1" fill="#2a3a6a" />}
      {s >= 6 && <rect x="7" y="0" width="6" height="1" fill="#e63946" />}
      {s >= 10 && <rect x="1" y="9" width="1" height="1" fill="#ffd700" />}
      {s >= 10 && <rect x="18" y="9" width="1" height="1" fill="#ffd700" />}
    </svg>
  );
}

function BabyGirlSprite({ size, color, s }: { size: number; color: string; s: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 24" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x="5" y="2" width="10" height="9" rx="2" fill={color} />
      {s >= 2 && <rect x="4" y="1" width="12" height="3" rx="1" fill="#8b4513" />}
      {s >= 3 && <rect x="3" y="4" width="2" height="7" rx="1" fill="#8b4513" />}
      {s >= 3 && <rect x="15" y="4" width="2" height="7" rx="1" fill="#8b4513" />}
      {s >= 5 && <rect x="4" y="0" width="3" height="2" fill="#ff69b4" />}
      {s >= 5 && <rect x="13" y="0" width="3" height="2" fill="#ff69b4" />}
      <rect x="7"  y="5" width="2" height="2" fill="#1a1a2e" />
      <rect x="11" y="5" width="2" height="2" fill="#1a1a2e" />
      <rect x="7"  y="5" width="1" height="1" fill="rgba(255,255,255,0.6)" />
      <rect x="11" y="5" width="1" height="1" fill="rgba(255,255,255,0.6)" />
      {s >= 1 && <rect x="8" y="8" width="4" height="1" fill="#e07070" />}
      {s >= 2 && <rect x="5" y="11" width="10" height="5" rx="1" fill="#ff80ab" />}
      {s >= 2 && <rect x="4" y="16" width="12" height="5" rx="1" fill="#f48fb1" />}
      {s >= 2 && <rect x="2"  y="11" width="3" height="5" rx="1" fill="#ff80ab" />}
      {s >= 2 && <rect x="15" y="11" width="3" height="5" rx="1" fill="#ff80ab" />}
      {s >= 2 && <rect x="5"  y="21" width="4" height="2" rx="1" fill="#e91e63" />}
      {s >= 2 && <rect x="11" y="21" width="4" height="2" rx="1" fill="#e91e63" />}
      {s >= 10 && <rect x="1" y="10" width="1" height="1" fill="#ff69b4" />}
      {s >= 10 && <rect x="18" y="10" width="1" height="1" fill="#ff69b4" />}
    </svg>
  );
}

function DogSprite({ size, color, s }: { size: number; color: string; s: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 22" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x="2"  y="1" width="4" height="5" rx="1" fill={color} />
      <rect x="14" y="1" width="4" height="5" rx="1" fill={color} />
      <rect x="3"  y="2" width="2" height="3" fill="rgba(180,80,80,0.5)" />
      <rect x="15" y="2" width="2" height="3" fill="rgba(180,80,80,0.5)" />
      <rect x="3" y="3" width="14" height="9" rx="2" fill={color} />
      <rect x="5"  y="5" width="3" height="3" rx="1" fill="#1a1a2e" />
      <rect x="12" y="5" width="3" height="3" rx="1" fill="#1a1a2e" />
      <rect x="5"  y="5" width="1" height="1" fill="rgba(255,255,255,0.7)" />
      <rect x="12" y="5" width="1" height="1" fill="rgba(255,255,255,0.7)" />
      <rect x="8" y="9" width="4" height="2" rx="1" fill="#1a1a2e" />
      {s >= 1 && <rect x="8" y="12" width="4" height="2" rx="1" fill="#e63946" />}
      <rect x="4" y="12" width="12" height="7" rx="1" fill={color} />
      <rect x="4"  y="19" width="3" height="3" rx="1" fill={color} />
      <rect x="8"  y="19" width="3" height="3" rx="1" fill={color} />
      <rect x="13" y="19" width="3" height="3" rx="1" fill={color} />
      {s >= 4  && <rect x="16" y="11" width="2" height="4" rx="1" fill={color} />}
      {s >= 2  && <rect x="4" y="12" width="12" height="2" fill="#e63946" />}
      {s >= 9  && <rect x="7" y="2" width="6" height="2" fill="#ffd700" />}
      {s >= 10 && <rect x="1" y="0" width="1" height="1" fill="#fff" />}
      {s >= 10 && <rect x="18" y="0" width="1" height="1" fill="#fff" />}
    </svg>
  );
}

function CatSprite({ size, color, s }: { size: number; color: string; s: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 22" style={{ imageRendering: "pixelated", display: "block" }}>
      <rect x="3"  y="0" width="3" height="4" fill={color} />
      <rect x="14" y="0" width="3" height="4" fill={color} />
      <rect x="4"  y="1" width="1" height="2" fill="rgba(255,150,200,0.6)" />
      <rect x="15" y="1" width="1" height="2" fill="rgba(255,150,200,0.6)" />
      <rect x="3" y="3" width="14" height="8" rx="2" fill={color} />
      <rect x="5"  y="5" width="3" height="3" rx="1" fill="#1a1a2e" />
      <rect x="12" y="5" width="3" height="3" rx="1" fill="#1a1a2e" />
      <rect x="5"  y="5" width="1" height="1" fill="rgba(255,255,255,0.7)" />
      <rect x="12" y="5" width="1" height="1" fill="rgba(255,255,255,0.7)" />
      <rect x="9" y="8" width="2" height="1" fill="#ff9999" />
      {s >= 1 && <rect x="0" y="7" width="5" height="1" fill="rgba(255,255,255,0.4)" />}
      {s >= 1 && <rect x="15" y="7" width="5" height="1" fill="rgba(255,255,255,0.4)" />}
      <rect x="4" y="11" width="12" height="7" rx="1" fill={color} />
      {s >= 3 && <rect x="16" y="12" width="2" height="5" rx="1" fill={color} />}
      {s >= 6 && <rect x="18" y="10" width="2" height="2" rx="1" fill={color} />}
      <rect x="4"  y="18" width="3" height="3" rx="1" fill={color} />
      <rect x="8"  y="18" width="3" height="3" rx="1" fill={color} />
      <rect x="13" y="18" width="3" height="3" rx="1" fill={color} />
      {s >= 2 && <rect x="4" y="11" width="12" height="2" fill="#c77dff" />}
      {s >= 9 && <rect x="7" y="1" width="6" height="2" fill="#ffd700" />}
      {s >= 10 && <rect x="1" y="1" width="1" height="1" fill="#fff" />}
      {s >= 10 && <rect x="18" y="1" width="1" height="1" fill="#fff" />}
    </svg>
  );
}

function FallbackSprite({ type, stageIdx, size, color }: {
  type: PetType; stageIdx: number; size: number; color: string;
}) {
  if (type === "baby_boy")  return <BabyBoySprite  size={size} color={color} s={stageIdx} />;
  if (type === "baby_girl") return <BabyGirlSprite size={size} color={color} s={stageIdx} />;
  if (type === "dog")       return <DogSprite       size={size} color={color} s={stageIdx} />;
  return                           <CatSprite       size={size} color={color} s={stageIdx} />;
}

// ─── 3D Viewer ────────────────────────────────────────────────────────────────
interface Model3DViewerProps {
  modelPath: string;
  scale: number;
  color: string;
  onFallback: () => void;
}

function Model3DViewer({ modelPath, scale, color, onFallback }: Model3DViewerProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef    = useRef<THREE.Group | null>(null);
  const rafRef      = useRef<number>(0);
  const mountedRef  = useRef(true);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(120, 120);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    camera.position.set(0, 0.5, 3.5);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 4, 3);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(new THREE.Color(color), 0.5);
    fill.position.set(-2, 1, -1);
    scene.add(fill);
    const rim = new THREE.PointLight(new THREE.Color(color), 0.8, 10);
    rim.position.set(0, 2, -2);
    scene.add(rim);

    // Load .glb
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        if (!mountedRef.current) return;
        const model = gltf.scene;

        // Auto-center + fit to view
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.scale.setScalar((scale * 1.5) / maxDim);
        model.position.y -= (size.y * scale * 1.5) / maxDim / 2;

        // Apply stage color as subtle emissive tint
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.emissive = new THREE.Color(color);
                mat.emissiveIntensity = 0.08;
              }
            });
          }
        });

        scene.add(model);
        modelRef.current = model;
      },
      undefined,
      () => {
        // ไฟล์ไม่มี → ใช้ pixel sprite แทน
        if (mountedRef.current) onFallback();
      }
    );

    // Render loop — gentle rotation + float
    const clock = new THREE.Clock();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (modelRef.current) {
        modelRef.current.rotation.y = t * 0.6;
        modelRef.current.position.y = Math.sin(t * 1.2) * 0.04;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [modelPath, scale, color]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      style={{ display: "block" }}
    />
  );
}

// ─── Selection Modal ──────────────────────────────────────────────────────────
const PET_OPTIONS: { type: PetType; emoji: string; label: string; desc: string }[] = [
  { type: "baby_boy",  emoji: "👶💙", label: "ทารกผู้ชาย",  desc: "โตขึ้นเรื่อยๆ ไปด้วยกัน" },
  { type: "baby_girl", emoji: "👶💗", label: "ทารกผู้หญิง", desc: "น่ารัก เติบโตพร้อมคุณ"   },
  { type: "dog",       emoji: "🐶",   label: "น้องหมา",      desc: "ซื่อสัตย์ พร้อมเดินทาง"  },
  { type: "cat",       emoji: "🐱",   label: "น้องแมว",      desc: "อิสระ แต่รักเจ้าของ"     },
];

function PetSelectionModal({ onSelect }: { onSelect: (t: PetType) => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(5,8,18,0.97)",
      borderRadius: 12, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "14px", gap: 8, zIndex: 20,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#00e5c0", fontFamily: "var(--font-mono)" }}>
        เลือกเพื่อนร่วมทาง
      </div>
      <div style={{ fontSize: 8, color: "rgba(150,170,200,0.5)", fontFamily: "var(--font-mono)", marginBottom: 2, textAlign: "center" }}>
        จะโตขึ้นทุกวัน — ยิ่งนานยิ่งใหญ่
      </div>
      {PET_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "9px 12px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            textAlign: "left", transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,192,0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#00e5c0";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          <div style={{ fontSize: 22, lineHeight: 1, minWidth: 28 }}>{opt.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#d8eaff", fontFamily: "var(--font-display)" }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 8, color: "rgba(150,170,200,0.5)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
              {opt.desc}
            </div>
          </div>
          <div style={{ color: "#00e5c0", fontSize: 14 }}>→</div>
        </button>
      ))}
    </div>
  );
}

// ─── Growth Bar ───────────────────────────────────────────────────────────────
function GrowthBar({ days, stageIdx, list }: { days: number; stageIdx: number; list: GrowthStage[] }) {
  if (stageIdx >= list.length - 1) {
    return (
      <div style={{ fontSize: 8, color: "#ffd700", fontFamily: "var(--font-mono)", textAlign: "center" }}>
        ✦ ถึงขั้นสูงสุดแล้ว ✦
      </div>
    );
  }
  const current  = list[stageIdx].minDays;
  const next     = list[stageIdx + 1].minDays;
  const pct      = Math.min(100, Math.round(((days - current) / (next - current)) * 100));
  const daysLeft = Math.ceil(next - days);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 7, color: "rgba(150,170,200,0.45)", fontFamily: "var(--font-mono)" }}>
          → {list[stageIdx + 1].label}
        </span>
        <span style={{ fontSize: 7, color: "rgba(150,170,200,0.45)", fontFamily: "var(--font-mono)" }}>
          อีก {daysLeft} วัน
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: list[stageIdx].color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${list[stageIdx].glow}`,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PetCompanion() {
  const { user } = useAuth();

  const [petType, setPetType]         = useState<PetType | null>(null);
  const [birthDate, setBirthDate]     = useState<Date | null>(null);
  const [ageDays, setAgeDays]         = useState(0);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [justEvolved, setJustEvolved] = useState(false);
  const [use3D, setUse3D]             = useState(true);
  const prevStageIdx                  = useRef<number>(-1);
  const prevModelPath                 = useRef<string>("");

  // bobbing (pixel sprite mode only)
  const rafRef = useRef<number>(0);
  const [bobY, setBobY] = useState(0);
  useEffect(() => {
    if (use3D) return;
    let t = 0;
    const tick = () => { t += 0.04; setBobY(Math.sin(t) * 2.5); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [use3D]);

  // age counter
  useEffect(() => {
    if (!birthDate) return;
    const calc = () => setAgeDays(Math.max(0, (Date.now() - birthDate.getTime()) / 86400000));
    calc();
    const iv = setInterval(calc, 60000);
    return () => clearInterval(iv);
  }, [birthDate]);

  // load from Supabase
  useEffect(() => {
    if (!user) { setLoading(false); setShowModal(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("pet_type, pet_chosen_at")
          .eq("id", user.id)
          .single();
        if (!cancelled) {
          const pt = (prof?.pet_type as PetType | null) ?? null;
          const bd = prof?.pet_chosen_at ? new Date(prof.pet_chosen_at) : null;
          setPetType(pt);
          setBirthDate(bd);
          setLoading(false);
          if (!pt) setShowModal(true);
        }
      } catch {
        if (!cancelled) { setLoading(false); setShowModal(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const stageList = getStageList(petType ?? "baby_boy");
  const stageIdx  = getStageIndex(ageDays, stageList);
  const stage     = stageList[stageIdx];
  const modelPath = petType ? getModelPath(petType, stageIdx) : "";

  // reset 3D flag when model changes (new stage / new pet)
  useEffect(() => {
    if (modelPath && modelPath !== prevModelPath.current) {
      prevModelPath.current = modelPath;
      setUse3D(true);
    }
  }, [modelPath]);

  // evolution detection
  useEffect(() => {
    if (prevStageIdx.current >= 0 && stageIdx > prevStageIdx.current) {
      setJustEvolved(true);
      setUse3D(true);
      const t = setTimeout(() => setJustEvolved(false), 3000);
      prevStageIdx.current = stageIdx;
      return () => clearTimeout(t);
    }
    prevStageIdx.current = stageIdx;
  }, [stageIdx]);

  async function handleSelect(t: PetType) {
    const now = new Date();
    setPetType(t);
    setBirthDate(now);
    setShowModal(false);
    setUse3D(true);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ pet_type: t, pet_chosen_at: now.toISOString() })
      .eq("id", user.id);
  }

  return (
    <div style={{
      background: "rgba(8,12,20,0.65)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: 16,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
      minHeight: 180,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#d8eaff", fontFamily: "var(--font-display)" }}>
          เพื่อนร่วมทาง
        </div>
        {petType && (
          <div style={{
            fontSize: 8, fontFamily: "var(--font-mono)", color: stage.color,
            border: `1px solid ${stage.color}44`, borderRadius: 4, padding: "2px 6px",
          }}>
            {formatAge(ageDays)}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <PetSelectionModal onSelect={handleSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 10, color: "rgba(150,170,200,0.3)", fontFamily: "var(--font-mono)" }}>
            กำลังโหลด...
          </div>
        </div>
      )}

      {/* Pet display */}
      {!loading && !showModal && petType && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>

          {/* Model / Sprite area */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 130 }}>
            {/* Glow */}
            <div style={{
              position: "absolute",
              width: 110, height: 110,
              background: `radial-gradient(circle, ${stage.glow} 0%, transparent 70%)`,
              filter: "blur(10px)", transition: "all 0.5s ease",
              pointerEvents: "none",
            }} />

            {/* Evolution ring burst */}
            <AnimatePresence>
              {justEvolved && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  style={{
                    position: "absolute", width: 50, height: 50, borderRadius: "50%",
                    border: `2px solid ${stage.color}`, pointerEvents: "none", zIndex: 2,
                  }}
                />
              )}
            </AnimatePresence>

            {/* 3D or Pixel */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {use3D ? (
                <Model3DViewer
                  key={modelPath}
                  modelPath={modelPath}
                  scale={stage.modelScale}
                  color={stage.color}
                  onFallback={() => setUse3D(false)}
                />
              ) : (
                <motion.div animate={{ y: bobY }} transition={{ duration: 0.05, ease: "linear" }}>
                  <FallbackSprite
                    type={petType}
                    stageIdx={stageIdx}
                    size={stage.spriteScale}
                    color={stage.color}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Stage name */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: stage.color,
            letterSpacing: 1, fontFamily: "var(--font-display)",
            textShadow: `0 0 8px ${stage.glow}`, transition: "color 0.5s ease",
          }}>
            {stage.label}
          </div>

          {/* Progress */}
          <GrowthBar days={ageDays} stageIdx={stageIdx} list={stageList} />

          <div style={{ fontSize: 8, color: "rgba(150,170,200,0.3)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
            โตขึ้นทุกวัน — ยิ่งนาน ยิ่งใหญ่
          </div>

          {/* 3D indicator */}
          <div style={{
            fontSize: 7, color: use3D ? stage.color : "rgba(100,120,150,0.3)",
            fontFamily: "var(--font-mono)", opacity: 0.6,
          }}>
            {use3D ? "◆ 3D" : "◇ pixel fallback"}
          </div>

          {/* Evolved banner */}
          <AnimatePresence>
            {justEvolved && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                  background: stage.color, color: "#0a0f1e", fontSize: 8, fontWeight: 800,
                  padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap", fontFamily: "var(--font-mono)",
                }}
              >
                ✦ {stage.label} แล้ว! ✦
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}