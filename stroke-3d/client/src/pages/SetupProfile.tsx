/*
 * SetupProfile.tsx — v5
 *
 * ══════════════════════════════════════════════
 *  🎨 ปรับแต่งได้ที่นี่:
 * ══════════════════════════════════════════════
 */
const HERO_VIDEO_SRC    = "/videos/hero-bg.mp4";   // path วิดีโอ
const HERO_IMAGE_SRC    = "/images/hero-char.png"; // path รูป PNG (ลบพื้นหลังแล้ว)
const HERO_IMAGE_H      = "250%";                  // ความสูงรูป — % หรือ px
const HERO_IMAGE_ALIGN  = "center";                // "left" | "center" | "right"
/*
 * ══════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Avatar list ────────────────────────────────────────────────────────────
const AVATARS = [
  { id: "bunny",   emoji: "🐰", label: "กระต่าย",   bg: "#FFE4F0" },
  { id: "bear",    emoji: "🐻", label: "หมี",        bg: "#FFE4C4" },
  { id: "cat",     emoji: "🐱", label: "แมว",        bg: "#E4F0FF" },
  { id: "panda",   emoji: "🐼", label: "แพนด้า",    bg: "#E4FFE4" },
  { id: "fox",     emoji: "🦊", label: "จิ้งจอก",   bg: "#FFE4D4" },
  { id: "penguin", emoji: "🐧", label: "เพนกวิน",   bg: "#D4E4FF" },
  { id: "frog",    emoji: "🐸", label: "กบ",         bg: "#D4FFD4" },
  { id: "duck",    emoji: "🐥", label: "ลูกเป็ด",   bg: "#FFFFD4" },
  { id: "koala",   emoji: "🐨", label: "โคอาล่า",   bg: "#EDD4FF" },
  { id: "unicorn", emoji: "🦄", label: "ยูนิคอร์น", bg: "#FFD4F4" },
  { id: "hamster", emoji: "🐹", label: "แฮมสเตอร์", bg: "#FFD4D4" },
  { id: "star",    emoji: "⭐", label: "ดาว",        bg: "#FFFFF0" },
];

const STEPS = ["ตั้งชื่อบัญชี", "ข้อมูลส่วนตัว", "เลือก Avatar", "พร้อมเริ่มต้น"];

// ─── Validation helpers ──────────────────────────────────────────────────────
const VALID_NAME_RE  = /^[ก-๙็่้๊๋์a-zA-Z\s]+$/;
const REPEAT_CHAR_RE = /(.)\1{4,}/;

function validateName(raw: string, label: string): string {
  const v = raw.trim();
  if (!v)                          return `กรุณากรอก${label}`;
  if (v.length < 2)                return `${label} ต้องมีอย่างน้อย 2 ตัวอักษร`;
  if (v.length > 80)               return `${label} ยาวเกินไป`;
  if (!VALID_NAME_RE.test(v))      return `${label} มีตัวเลขหรืออักขระพิเศษที่ไม่อนุญาต`;
  if (REPEAT_CHAR_RE.test(v))      return `${label} ดูผิดปกติ (มีตัวอักษรซ้ำกันมากเกินไป)`;
  if (/\s{2,}/.test(v))            return `${label} มีช่องว่างซ้อนกัน`;
  return "";
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Mitr:wght@300;400;500;600&family=Sarabun:ital,wght@0,300;0,400;0,600;0,700;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Root ── */
.sp-root {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  font-family: 'Sarabun', sans-serif;
  background: #f0eeff;
}

/* ══════════════ HERO ══════════════ */
.sp-hero {
  flex: 0 0 44%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding: 36px 44px;
}
.sp-hero-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; z-index: 0;
}
.sp-hero-overlay {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(
    160deg,
    rgba(138, 92, 246, 0.88) 0%,
    rgba(168, 85, 247, 0.70) 40%,
    rgba(217, 70, 239, 0.60) 100%
  );
}
.sp-hero::before {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(160deg, #6d28d9 0%, #7c3aed 50%, #a21caf 100%);
}

/* Logo */
.sp-logo {
  position: relative; z-index: 3;
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.sp-logo-icon {
  width: 42px; height: 42px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(8px);
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  border: 1px solid rgba(255,255,255,.25);
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
}
.sp-logo-txt {
  font-family: 'Mitr', sans-serif;
  font-size: 18px; font-weight: 600;
  color: #fff;
  letter-spacing: .3px;
}

/* Hero body */
.sp-hero-body {
  position: relative; z-index: 3;
  flex-shrink: 0;
  padding-top: 28px;
}
.sp-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(6px);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 12.5px; color: #fff;
  margin-bottom: 18px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,.22);
  letter-spacing: .2px;
}
.sp-h1 {
  font-family: 'Mitr', sans-serif;
  font-size: 32px; font-weight: 600;
  color: #fff;
  line-height: 1.35;
  margin-bottom: 10px;
  text-shadow: 0 2px 12px rgba(0,0,0,.15);
}
.sp-h1 span { color: #fde68a; display: block; }
.sp-herop {
  font-size: 13.5px;
  color: rgba(255,255,255,.82);
  line-height: 1.75;
  font-weight: 300;
}

/* รูปภาพ */
.sp-hero-img-area {
  position: relative; z-index: 2;
  flex: 1;
  display: flex;
  align-items: flex-end;
  min-height: 0;
}
.sp-hero-img {
  display: block;
  max-width: 100%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 10px 40px rgba(0,0,0,.35));
}

/* Stats badge */
.sp-badge {
  position: relative; z-index: 3;
  flex-shrink: 0;
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.13);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(255,255,255,.2);
  margin-top: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,.1);
}
.sp-badge-icon { font-size: 22px; flex-shrink: 0; }
.sp-badge-t { font-size: 13px; color: #fff; font-weight: 600; }
.sp-badge-s { font-size: 11px; color: rgba(255,255,255,.65); font-weight: 300; margin-top: 1px; }

/* Decorative dots */
.sp-dots {
  position: absolute; z-index: 2;
  right: -20px; bottom: 120px;
  width: 120px; height: 120px;
  background-image: radial-gradient(circle, rgba(255,255,255,.25) 1.5px, transparent 1.5px);
  background-size: 14px 14px;
  opacity: .6;
}

/* ══════════════ FORM ══════════════ */
.sp-fw {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 56px;
  background: #fff;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .sp-root { flex-direction: column; }
  .sp-hero { flex: none; min-height: 220px; padding: 28px 28px; }
  .sp-hero-img-area { display: none; }
  .sp-fw { padding: 32px 24px; }
}

/* ── Steps ── */
.sp-steps {
  display: flex;
  align-items: flex-start;
  margin-bottom: 40px;
}
.sp-s {
  display: flex; flex-direction: column; align-items: center;
  flex: 1;
  position: relative;
}
.sp-s:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 15px;
  left: calc(50% + 17px);
  right: calc(-50% + 17px);
  height: 2px;
  background: #e9e6ff;
  z-index: 0;
  transition: background .4s;
}
.sp-s.done:not(:last-child)::after,
.sp-s.active:not(:last-child)::after { background: #7c3aed; }

.sp-sn {
  width: 36px; height: 36px;           /* ใหญ่ขึ้นจาก 32px */
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;   /* ใหญ่ขึ้นจาก 12px */
  font-family: 'Mitr', sans-serif;
  background: #f3f0ff;
  color: #a78bfa;
  border: 2px solid #e9e6ff;
  position: relative; z-index: 1;
  transition: all .35s cubic-bezier(.34,1.56,.64,1);
}
.sp-s.active .sp-sn {
  background: #7c3aed; color: #fff;
  border-color: #7c3aed;
  box-shadow: 0 0 0 5px rgba(124,58,237,.15), 0 4px 12px rgba(124,58,237,.35);
  transform: scale(1.1);
}
.sp-s.done .sp-sn {
  background: #7c3aed; color: #fff;
  border-color: #7c3aed;
}
.sp-sl {
  font-size: 12px; color: #c4b5fd;    /* ใหญ่ขึ้นจาก 10px */
  margin-top: 7px;
  font-weight: 600; white-space: nowrap;
  letter-spacing: .3px;
  transition: color .3s;
}
.sp-s.active .sp-sl, .sp-s.done .sp-sl { color: #7c3aed; }

/* ── Section heading ── */
.sp-h2 {
  font-family: 'Mitr', sans-serif;
  font-size: 32px; font-weight: 600;   /* ใหญ่ขึ้นจาก 26px */
  color: #1e1b4b;
  margin-bottom: 6px;
}
.sp-desc {
  font-size: 16px; color: #9ca3af;    /* ใหญ่ขึ้นจาก 14px */
  margin-bottom: 28px;
  font-weight: 300; line-height: 1.6;
}

/* ── Field ── */
.sp-lbl {
  display: block;
  font-size: 15px; font-weight: 700;  /* ใหญ่ขึ้นจาก 12.5px */
  color: #4c1d95;
  margin-bottom: 8px;
  font-family: 'Mitr', sans-serif;
  letter-spacing: .2px;
}
.sp-hint {
  font-size: 13px; color: #a78bfa;   /* ใหญ่ขึ้นจาก 11px */
  font-weight: 400; margin-left: 4px;
}
.sp-iw { position: relative; margin-bottom: 14px; }
.sp-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 18px; pointer-events: none; opacity: .45;  /* ใหญ่ขึ้นจาก 16px */
}
.sp-input {
  width: 100%;
  padding: 15px 48px 15px 48px;       /* padding ใหญ่ขึ้น */
  border-radius: 13px;
  border: 1.5px solid #ede9fe;
  background: #faf9ff;
  font-size: 17px; color: #1e1b4b;   /* ใหญ่ขึ้นจาก 15px */
  outline: none;
  transition: border .2s, box-shadow .2s, background .2s;
  font-family: 'Sarabun', sans-serif;
}
.sp-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3.5px rgba(124,58,237,.13);
  background: #fff;
}
.sp-input::placeholder { color: #c4b5fd; }
.sp-input:disabled { color: #a78bfa; cursor: not-allowed; }
.sp-char {
  position: absolute; right: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 13px; color: #c4b5fd;   /* ใหญ่ขึ้นจาก 11px */
}

/* input validation state */
.sp-input.valid   { border-color: #10b981; background: #f0fdf4; }
.sp-input.invalid { border-color: #ef4444; background: #fff5f5; }
.sp-field-err {
  font-size: 13px; color: #ef4444;   /* ใหญ่ขึ้นจาก 11.5px */
  margin-top: -10px; margin-bottom: 12px;
  padding-left: 4px;
  display: flex; align-items: center; gap: 4px;
  animation: fadeIn .2s ease;
}
.sp-field-ok {
  font-size: 13px; color: #10b981;   /* ใหญ่ขึ้นจาก 11.5px */
  margin-top: -10px; margin-bottom: 12px;
  padding-left: 4px;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

/* Gender */
.sp-gd { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
.sp-gb {
  padding: 15px 8px;                  /* ใหญ่ขึ้น */
  border-radius: 13px;
  border: 1.5px solid #ede9fe;
  background: #faf9ff;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer;
  transition: all .2s;
  font-family: 'Mitr', sans-serif;
}
.sp-gb:hover { border-color: #7c3aed; background: #f5f3ff; transform: translateY(-1px); }
.sp-gb.sel {
  border-color: #7c3aed; background: #f5f3ff;
  box-shadow: 0 0 0 3px rgba(124,58,237,.12);
}
.sp-gi { font-size: 26px; }           /* ใหญ่ขึ้นจาก 22px */
.sp-gl { font-size: 15px; color: #4c1d95; font-weight: 600; }  /* ใหญ่ขึ้นจาก 13px */

/* Avatar grid */
.sp-avg {
  display: grid;
  grid-template-columns: repeat(6,1fr);
  gap: 8px;
  margin-bottom: 16px;
}
@media (max-width: 500px) { .sp-avg { grid-template-columns: repeat(4,1fr); } }

.sp-av {
  cursor: pointer;
  border-radius: 13px;
  padding: 9px 4px;
  text-align: center;
  border: 2px solid transparent;
  background: #faf9ff;
  transition: all .2s cubic-bezier(.34,1.56,.64,1);
}
.sp-av:hover { transform: scale(1.1); background: #f5f3ff; }
.sp-av.sel {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,.18);
  background: #f5f3ff;
  transform: scale(1.08);
}
.sp-ae { font-size: 28px; display: block; line-height: 1.2; }  /* ใหญ่ขึ้นจาก 26px */
.sp-al { font-size: 11px; color: #7c3aed; margin-top: 3px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Upload zone */
.sp-ua {
  border: 2px dashed #ddd6fe;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  background: #faf9ff;
  margin-bottom: 4px;
}
.sp-ua:hover { border-color: #7c3aed; background: #f5f3ff; }
.sp-ua.has { border-style: solid; border-color: #7c3aed; background: #f5f3ff; }
.sp-uprev {
  width: 66px; height: 66px;
  border-radius: 50%; object-fit: cover;
  margin: 0 auto 10px; display: block;
  border: 3px solid #7c3aed;
  box-shadow: 0 4px 16px rgba(124,58,237,.25);
}
.sp-ut { font-size: 15px; color: #7c3aed; font-weight: 600; }  /* ใหญ่ขึ้นจาก 13px */
.sp-usub { font-size: 13px; color: #a78bfa; margin-top: 3px; font-weight: 300; }  /* ใหญ่ขึ้นจาก 11px */
.sp-uprg { height: 4px; border-radius: 2px; background: linear-gradient(90deg,#7c3aed,#a855f7); margin-top: 10px; transition: width .3s; }

/* Nav */
.sp-nav { display: flex; gap: 12px; margin-top: 20px; }
.sp-next {
  flex: 1;
  padding: 16px;                       /* ใหญ่ขึ้นจาก 14px */
  border-radius: 14px; border: none;
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%);
  color: #fff;
  font-size: 18px; font-weight: 600;  /* ใหญ่ขึ้นจาก 16px */
  font-family: 'Mitr', sans-serif;
  cursor: pointer;
  transition: transform .18s, box-shadow .18s, opacity .18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  letter-spacing: .3px;
  box-shadow: 0 4px 20px rgba(109,40,217,.3);
}
.sp-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(109,40,217,.45);
}
.sp-next:active:not(:disabled) { transform: translateY(0); }
.sp-next:disabled { opacity: .55; cursor: not-allowed; }

.sp-back {
  padding: 16px 24px;                  /* ใหญ่ขึ้น */
  border-radius: 14px;
  border: 1.5px solid #ede9fe;
  background: #fff; color: #7c3aed;
  font-size: 16px; font-weight: 600;  /* ใหญ่ขึ้นจาก 14px */
  font-family: 'Mitr', sans-serif;
  cursor: pointer;
  transition: all .18s;
}
.sp-back:hover { border-color: #7c3aed; background: #f5f3ff; }

/* Error banner */
.sp-err {
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px; color: #dc2626;   /* ใหญ่ขึ้นจาก 13px */
  margin-bottom: 16px;
  display: flex; align-items: flex-start; gap: 8px;
  animation: fadeIn .25s ease;
}
.sp-err-icon { flex-shrink: 0; font-size: 17px; margin-top: 1px; }

/* ── Success ── */
.sp-ok { text-align: center; padding: 12px 0; }
.sp-ok-ic {
  font-size: 84px; display: block;
  margin-bottom: 16px;
  animation: popIn .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes popIn {
  from { transform: scale(0.4) rotate(-10deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
.sp-ok-h {
  font-family: 'Mitr', sans-serif;
  font-size: 30px; color: #1e1b4b; margin-bottom: 8px;  /* ใหญ่ขึ้นจาก 26px */
}
.sp-ok-p {
  font-size: 16px; color: #6b7280;   /* ใหญ่ขึ้นจาก 14px */
  margin-bottom: 26px;
  font-weight: 300; line-height: 1.75;
}
.sp-pc {
  display: flex; align-items: center; gap: 16px;
  background: linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%);
  border-radius: 18px;
  padding: 16px 20px;
  margin-bottom: 26px;
  border: 1.5px solid #ddd6fe;
  box-shadow: 0 4px 24px rgba(124,58,237,.08);
}
.sp-pa {
  width: 54px; height: 54px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.sp-pn { font-family: 'Mitr', sans-serif; font-size: 18px; color: #1e1b4b; font-weight: 600; }  /* ใหญ่ขึ้น */
.sp-pu { font-size: 15px; color: #7c3aed; margin-top: 2px; }  /* ใหญ่ขึ้น */

/* ── Animation ── */
.sp-sc { animation: slideIn .32s cubic-bezier(.22,1,.36,1); }
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }
.sp-spin {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2.5px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .65s linear infinite;
}

/* ── Delete account button (edit mode only) ── */
.sp-delete-zone {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1.5px dashed #fecaca;
}
.sp-delete-lbl {
  font-size: 12px; color: #fca5a5;
  font-weight: 600; letter-spacing: .4px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.sp-delete-btn {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  border: 1.5px solid #fecaca;
  background: #fff5f5;
  color: #ef4444;
  font-size: 15px; font-weight: 600;
  font-family: 'Mitr', sans-serif;
  cursor: pointer;
  transition: all .18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.sp-delete-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  box-shadow: 0 4px 14px rgba(239,68,68,.15);
}

/* ── Modal overlay ── */
.sp-modal-bg {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15,5,30,.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: fadeIn .2s ease;
}
.sp-modal {
  background: #fff;
  border-radius: 22px;
  padding: 32px 28px;
  width: 100%; max-width: 400px;
  box-shadow: 0 24px 80px rgba(0,0,0,.2);
  animation: popIn .3s cubic-bezier(.34,1.56,.64,1);
  text-align: center;
}
.sp-modal-ic { font-size: 52px; display: block; margin-bottom: 14px; }
.sp-modal-h {
  font-family: 'Mitr', sans-serif;
  font-size: 22px; font-weight: 600;
  color: #1e1b4b; margin-bottom: 8px;
}
.sp-modal-p {
  font-size: 15px; color: #6b7280;
  line-height: 1.7; margin-bottom: 22px;
  font-weight: 300;
}
.sp-modal-p strong { color: #ef4444; font-weight: 700; }

.sp-confirm-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid #fecaca;
  background: #fff5f5;
  font-size: 16px; color: #dc2626;
  font-family: 'Sarabun', sans-serif;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition: border .2s, box-shadow .2s;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.sp-confirm-input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,.12);
  background: #fff;
}
.sp-confirm-input::placeholder { color: #fca5a5; font-weight: 400; letter-spacing: 0; }
.sp-confirm-hint {
  font-size: 13px; color: #9ca3af;
  margin-bottom: 20px;
}
.sp-confirm-hint span { color: #ef4444; font-weight: 700; }

.sp-modal-btns { display: flex; gap: 10px; }
.sp-modal-cancel {
  flex: 1; padding: 13px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background: #fff; color: #6b7280;
  font-size: 15px; font-weight: 600;
  font-family: 'Mitr', sans-serif;
  cursor: pointer;
  transition: all .15s;
}
.sp-modal-cancel:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
.sp-modal-confirm-del {
  flex: 1; padding: 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff;
  font-size: 15px; font-weight: 600;
  font-family: 'Mitr', sans-serif;
  cursor: pointer;
  transition: all .18s;
  box-shadow: 0 4px 14px rgba(239,68,68,.3);
}
.sp-modal-confirm-del:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(239,68,68,.4);
}
.sp-modal-confirm-del:disabled { opacity: .4; cursor: not-allowed; }
`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props { mode?: "setup" | "edit"; onClose?: () => void; }

interface FieldState { touched: boolean; error: string; }
function initField(): FieldState { return { touched: false, error: "" }; }

// ─── Component ───────────────────────────────────────────────────────────────
export default function SetupProfile({ mode = "setup", onClose }: Props) {
  const { user }     = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep]           = useState(0);
  const [error, setError]         = useState("");
  const [username, setUsername]   = useState("");
  const [fullName, setFullName]   = useState("");
  const [lastName, setLastName]   = useState("");
  const [gender, setGender]       = useState<"male" | "female" | "other" | "">("");
  const [birthday, setBirthday]   = useState("");
  const [avatarId, setAvatarId]   = useState("bunny");
  const [avMode, setAvMode]       = useState<"emoji" | "photo">("emoji");
  const [photoUrl, setPhotoUrl]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [deleteStep, setDeleteStep] = useState<0|1|2|3>(0);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting]   = useState(false);

  const [fnState, setFnState] = useState<FieldState>(initField());
  const [lnState, setLnState] = useState<FieldState>(initField());

  const fileRef = useRef<HTMLInputElement>(null);
  const cssRef  = useRef(false);

  useEffect(() => {
    if (cssRef.current) return;
    cssRef.current = true;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (mode === "edit") {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (!data) return;
        const parts = (data.full_name ?? "").split(" ");
        setUsername(data.username ?? "");
        setFullName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
        setBirthday(data.birthday ?? "");
        if (data.avatar_id)  { setAvatarId(data.avatar_id); setAvMode("emoji"); }
        if (data.avatar_url) { setPhotoUrl(data.avatar_url); setAvMode("photo"); }
      });
    } else {
      const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").split(" ");
      setFullName(name[0] ?? "");
      setLastName(name.slice(1).join(" ") ?? "");
    }
  }, [user, mode]);

  function handleFullNameChange(v: string) {
    setFullName(v);
    if (fnState.touched) setFnState({ touched: true, error: validateName(v, "ชื่อจริง") });
  }
  function handleLastNameChange(v: string) {
    setLastName(v);
    if (lnState.touched) {
      const err = v.trim() ? validateName(v, "นามสกุล") : "";
      setLnState({ touched: true, error: err });
    }
  }
  function blurFullName() { setFnState({ touched: true, error: validateName(fullName, "ชื่อจริง") }); }
  function blurLastName() {
    const err = lastName.trim() ? validateName(lastName, "นามสกุล") : "";
    setLnState({ touched: true, error: err });
  }

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError("ไฟล์ใหญ่เกิน 5MB"); return; }
    setUploading(true); setUploadPct(10); setError("");
    const ext  = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const t = setInterval(() => setUploadPct(p => Math.min(p + 20, 85)), 300);
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    clearInterval(t); setUploadPct(100);
    if (upErr) { setError("อัปโหลดไม่สำเร็จ: " + upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhotoUrl(data.publicUrl + "?t=" + Date.now());
    setAvMode("photo");
    setUploading(false); setUploadPct(0);
  }, [user]);

  function nextStep() {
    setError("");
    if (step === 0) {
      if (!username.trim()) { setError("กรุณากรอกชื่อเล่นก่อนนะคะ"); return; }
      const fnErr = validateName(fullName, "ชื่อจริง");
      setFnState({ touched: true, error: fnErr });
      if (fnErr) { setError(fnErr); return; }
      if (lastName.trim()) {
        const lnErr = validateName(lastName, "นามสกุล");
        setLnState({ touched: true, error: lnErr });
        if (lnErr) { setError(lnErr); return; }
      }
    }
    if (step === 1) {
      if (!birthday) { setError("กรุณาเลือกวันเกิดก่อนนะคะ 🎂"); return; }
      if (new Date(birthday) > new Date()) { setError("วันเกิดต้องไม่เป็นวันในอนาคต"); return; }
    }
    setStep(s => s + 1);
  }

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true); setError("");
    try {
      const { error: e } = await supabase.from("profiles").upsert({
        id:         user.id,
        email:      user.email ?? "",
        username:   username.trim(),
        full_name:  `${fullName.trim()} ${lastName.trim()}`.trim(),
        birthday:   birthday || null,
        avatar_id:  avMode === "emoji"  ? avatarId  : null,
        avatar_url: avMode === "photo"  ? photoUrl  : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (e) throw e;
      const cachedProfile = {
        username:   username.trim(),
        full_name:  `${fullName.trim()} ${lastName.trim()}`.trim(),
        avatar_id:  avMode === "emoji" ? avatarId : null,
        avatar_url: avMode === "photo" ? photoUrl : null,
        birthday:   birthday || null,
        email:      user.email ?? "",
      };
      localStorage.setItem(`profile:${user.id}`, JSON.stringify(cachedProfile));
      setStep(3);
    } catch (e: any) {
      setError(e?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user?.id || confirmText !== "ลบบัญชี") return;
    setDeleting(true);
    try {
      if (photoUrl) {
        const path = `${user.id}/avatar`;
        await supabase.storage.from("avatars").remove([
          `${path}.jpg`, `${path}.jpeg`, `${path}.png`, `${path}.webp`,
        ]);
      }
      const userId = user.id;
      const tablesToDelete = [
        { name: "rehab_daily_logs", key: "user_id" },
        { name: "rehab_profiles", key: "user_id" },
        { name: "game_sessions", key: "user_id" },
        { name: "user_settings", key: "user_id" },
        { name: "user_progress", key: "user_id" },
        { name: "user_activities", key: "user_id" },
        { name: "profiles", key: "id" }
      ];
      for (const table of tablesToDelete) {
        try {
          await supabase.from(table.name).delete().eq(table.key, userId);
        } catch (e) {}
      }
      localStorage.removeItem(`profile:${userId}`);
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e: any) {
      setError(e?.message ?? "ลบบัญชีไม่สำเร็จ กรุณาลองใหม่");
      setDeleting(false);
      setDeleteStep(0);
    }
  }

  const curAv = AVATARS.find(a => a.id === avatarId)!;

  function inputCls(fieldState: FieldState, value: string) {
    if (!fieldState.touched) return "sp-input";
    if (fieldState.error)    return "sp-input invalid";
    if (value.trim().length >= 2) return "sp-input valid";
    return "sp-input";
  }

  const content = () => {
    if (step === 0) return (
      <div className="sp-sc">
        <h2 className="sp-h2">ตั้งชื่อบัญชีของคุณ</h2>
        <p className="sp-desc">เริ่มต้นการเดินทางเพื่อสุขภาพที่ดีกว่า 💜</p>

        {error && (
          <div className="sp-err">
            <span className="sp-err-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <label className="sp-lbl">ชื่อเล่น <span className="sp-hint">(แสดงในแอป)</span></label>
        <div className="sp-iw">
          <span className="sp-icon">👤</span>
          <input className="sp-input" placeholder="เช่น คุณสมชาย" value={username} maxLength={24} onChange={e => setUsername(e.target.value)} />
          <span className="sp-char">{username.length}/24</span>
        </div>

        <label className="sp-lbl">ชื่อจริง *</label>
        <div className="sp-iw">
          <span className="sp-icon">📝</span>
          <input className={inputCls(fnState, fullName)} placeholder="เช่น สมชาย" value={fullName} onChange={e => handleFullNameChange(e.target.value)} onBlur={blurFullName} />
          {fnState.touched && !fnState.error && fullName.trim().length >= 2 && <span className="sp-char" style={{ color: "#10b981" }}>✓</span>}
        </div>
        {fnState.touched && fnState.error  && <div className="sp-field-err">⚠ {fnState.error}</div>}
        {fnState.touched && !fnState.error && fullName.trim().length >= 2 && <div className="sp-field-ok">✓ ชื่อจริงถูกต้อง</div>}

        <label className="sp-lbl">นามสกุล <span className="sp-hint">(ไม่บังคับ)</span></label>
        <div className="sp-iw">
          <span className="sp-icon">📝</span>
          <input className={lastName.trim() ? inputCls(lnState, lastName) : "sp-input"} placeholder="เช่น ใจดี" value={lastName} onChange={e => handleLastNameChange(e.target.value)} onBlur={blurLastName} />
          {lnState.touched && !lnState.error && lastName.trim().length >= 2 && <span className="sp-char" style={{ color: "#10b981" }}>✓</span>}
        </div>
        {lnState.touched && lnState.error && <div className="sp-field-err">⚠ {lnState.error}</div>}

        <label className="sp-lbl">เพศ <span className="sp-hint">(ไม่บังคับ)</span></label>
        <div className="sp-gd">
          {([["male","♂️","ชาย"],["female","♀️","หญิง"],["other","😊","ไม่ระบุ"]] as const).map(([v,ic,lb]) => (
            <div key={v} className={`sp-gb${gender === v ? " sel" : ""}`} onClick={() => setGender(v)}>
              <span className="sp-gi">{ic}</span>
              <span className="sp-gl">{lb}</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 1) return (
      <div className="sp-sc">
        <h2 className="sp-h2">ข้อมูลส่วนตัว</h2>
        <p className="sp-desc">ข้อมูลนี้จะไม่แสดงต่อสาธารณะ 🔒</p>
        {error && <div className="sp-err"><span className="sp-err-icon">⚠️</span><span>{error}</span></div>}
        <label className="sp-lbl">วันเกิด <span className="sp-hint">(ไม่บังคับ)</span></label>
        <div className="sp-iw">
          <span className="sp-icon">🎂</span>
          <input className="sp-input" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} max={new Date().toISOString().split("T")[0]} />
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="sp-sc">
        <h2 className="sp-h2">เลือกรูปโปรไฟล์</h2>
        <p className="sp-desc">เลือก Avatar น่ารัก หรืออัปโหลดรูปตัวเองได้เลย 🎨</p>
        {error && <div className="sp-err"><span className="sp-err-icon">⚠️</span><span>{error}</span></div>}

        <label className="sp-lbl" style={{ marginBottom: 8 }}>Avatar การ์ตูน</label>
        <div className="sp-avg">
          {AVATARS.map(av => (
            <div key={av.id} className={`sp-av${avatarId === av.id && avMode === "emoji" ? " sel" : ""}`} style={{ background: av.bg + "99" }} onClick={() => { setAvatarId(av.id); setAvMode("emoji"); }}>
              <span className="sp-ae">{av.emoji}</span>
              <div className="sp-al">{av.label}</div>
            </div>
          ))}
        </div>

        <label className="sp-lbl" style={{ marginBottom: 8 }}>หรืออัปโหลดรูปตัวเอง</label>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
        <div className={`sp-ua${avMode === "photo" && photoUrl ? " has" : ""}`} onClick={() => fileRef.current?.click()}>
          {avMode === "photo" && photoUrl
            ? <img src={photoUrl} className="sp-uprev" alt="preview" />
            : <div style={{ fontSize: 34, marginBottom: 8 }}>📷</div>
          }
          <div className="sp-ut">
            {uploading ? "กำลังอัปโหลด..." : avMode === "photo" && photoUrl ? "✅ อัปโหลดแล้ว — คลิกเพื่อเปลี่ยน" : "คลิกเพื่ออัปโหลดรูปภาพ"}
          </div>
          <div className="sp-usub">{!uploading && !(avMode === "photo" && photoUrl) && "JPG, PNG — ขนาดไม่เกิน 5MB"}</div>
          {uploading && <div className="sp-uprg" style={{ width: `${uploadPct}%` }} />}
        </div>
      </div>
    );

    return (
      <div className="sp-ok">
        <span className="sp-ok-ic">🎉</span>
        <h2 className="sp-ok-h">ยินดีต้อนรับสู่ Stroke 3D!</h2>
        <p className="sp-ok-p">โปรไฟล์ของคุณพร้อมแล้ว<br />เริ่มต้นการฝึกฟื้นฟูวันนี้เลยค่า 💪</p>
        <div className="sp-pc">
          <div className="sp-pa" style={{ background: avMode === "photo" ? "#f3f4f6" : curAv.bg }}>
            {avMode === "photo" && photoUrl
              ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="av" />
              : curAv.emoji
            }
          </div>
          <div>
            <div className="sp-pn">{fullName} {lastName}</div>
            <div className="sp-pu">@{username}</div>
          </div>
        </div>
        <button className="sp-next" style={{ maxWidth: 300, margin: "0 auto" }} onClick={() => { if (mode === "edit" && onClose) { onClose(); } else { window.location.href = "/"; } }}>
          เริ่มต้นเลย! →
        </button>
      </div>
    );
  };

  const imgJustify = HERO_IMAGE_ALIGN === "left" ? "flex-start" : HERO_IMAGE_ALIGN === "right" ? "flex-end" : "center";

  return (
    <div className="sp-root">
      <div className="sp-hero">
        <video className="sp-hero-video" src={HERO_VIDEO_SRC} autoPlay muted loop playsInline />
        <div className="sp-hero-overlay" />
        <div className="sp-dots" />
        <div className="sp-logo">
          <div className="sp-logo-icon">🧠</div>
          <span className="sp-logo-txt">Stroke 3D</span>
        </div>
        <div className="sp-hero-body">
          <div className="sp-tag">✨ ฟื้นฟูสมอง ฟื้นฟูชีวิต</div>
          <h1 className="sp-h1">ก้าวเล็กๆ ทุกวันนี้<span>คือความสำเร็จ<br />ในวันพรุ่งนี้</span></h1>
          <p className="sp-herop">แอปฝึกฟื้นฟูสำหรับผู้ป่วยโรคหลอดเลือดสมอง<br />ที่ช่วยติดตามพัฒนาการได้ทุกวัน</p>
        </div>
        <div className="sp-hero-img-area" style={{ justifyContent: imgJustify }}>
          <img className="sp-hero-img" src={HERO_IMAGE_SRC} alt="hero character" style={{ height: HERO_IMAGE_H, width: "auto" }} />
        </div>
        <div className="sp-badge">
          <span className="sp-badge-icon">🔒</span>
          <div>
            <div className="sp-badge-t">ปลอดภัย เป็นส่วนตัว</div>
            <div className="sp-badge-s">ข้อมูลของคุณจะถูกเก็บไว้อย่างปลอดภัย</div>
          </div>
        </div>
      </div>

      <div className="sp-fw">
        <div className="sp-steps">
          {STEPS.map((lbl, i) => (
            <div key={i} className={`sp-s${step === i ? " active" : i < step ? " done" : ""}`}>
              <div className="sp-sn">{i < step ? "✓" : i + 1}</div>
              <div className="sp-sl">{lbl}</div>
            </div>
          ))}
        </div>

        {content()}

        {step < 3 && (
          <div className="sp-nav">
            {step > 0 && (
              <button className="sp-back" onClick={() => { setError(""); setStep(s => s - 1); }}>← ย้อนกลับ</button>
            )}
            {step < 2
              ? <button className="sp-next" onClick={nextStep}>ถัดไป →</button>
              : (
                <button className="sp-next" onClick={handleSave} disabled={saving || uploading}>
                  {saving ? <><span className="sp-spin" /> กำลังบันทึก...</> : "บันทึกโปรไฟล์ ✅"}
                </button>
              )
            }
          </div>
        )}

        {mode === "edit" && step < 3 && (
          <div className="sp-delete-zone">
            <div className="sp-delete-lbl">⚠ โซนอันตราย</div>
            <button className="sp-delete-btn" onClick={() => { setDeleteStep(1); setConfirmText(""); }}>🗑️ ลบบัญชีนี้ถาวร</button>
          </div>
        )}
      </div>

      {deleteStep > 0 && (
        <div className="sp-modal-bg" onClick={e => { if (e.target === e.currentTarget && !deleting) { setDeleteStep(0); setConfirmText(""); } }}>
          <div className="sp-modal">
            {deleteStep === 1 && (
              <>
                <span className="sp-modal-ic">⚠️</span>
                <h3 className="sp-modal-h">ลบบัญชีนี้?</h3>
                <p className="sp-modal-p">ข้อมูลทั้งหมดของคุณจะถูกลบออกจากระบบ<br /><strong>กระทำนี้ไม่สามารถย้อนกลับได้</strong></p>
                <div className="sp-modal-btns">
                  <button className="sp-modal-cancel" onClick={() => setDeleteStep(0)}>ยกเลิก</button>
                  <button className="sp-modal-confirm-del" onClick={() => setDeleteStep(2)}>ต้องการลบจริงๆ →</button>
                </div>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <span className="sp-modal-ic">🗑️</span>
                <h3 className="sp-modal-h">ยืนยันการลบบัญชี</h3>
                <p className="sp-modal-p">พิมพ์ <strong>ลบบัญชี</strong> เพื่อยืนยัน<br />ข้อมูลโปรไฟล์และรูปภาพจะถูกลบทั้งหมด</p>
                <input className="sp-confirm-input" placeholder="พิมพ์ที่นี่..." value={confirmText} onChange={e => setConfirmText(e.target.value)} autoFocus />
                <div className="sp-confirm-hint">พิมพ์: <span>ลบบัญชี</span></div>
                <div className="sp-modal-btns">
                  <button className="sp-modal-cancel" onClick={() => { setDeleteStep(0); setConfirmText(""); }}>ยกเลิก</button>
                  <button className="sp-modal-confirm-del" disabled={confirmText !== "ลบบัญชี" || deleting} onClick={handleDelete}>
                    {deleting ? <><span className="sp-spin" style={{ borderTopColor:"#fff" }} /> กำลังลบ...</> : "🗑️ ลบบัญชีถาวร"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}