import React, { useRef, useState } from "react";
import { useTextToSpeech } from "@/contexts/TextToSpeechContext";

interface SelectableTextProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Selectable Text Component
 * - Allows double-click to speak text
 * - Shows visual feedback
 * - Auto-detects language (Thai or English)
 */
export default function SelectableText({
  children,
  onClick,
  className = "",
  style = {},
}: SelectableTextProps) {
  const { speak, stop } = useTextToSpeech();
  const textRef = useRef<HTMLSpanElement>(null);
  const [activeRange, setActiveRange] = useState<{ start: number; end: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // หยุดไม่ให้คลิกทะลุไปถึงพื้นหลังหรือระบบเลื่อนหน้า
    const text = textRef.current?.innerText;
    
    if (text) {
      // หยุดเสียงเดิมที่เล่นอยู่
      window.speechSynthesis.cancel();
      stop();

      // ตรวจสอบภาษา (ประเมินจากตัวอักษรแรก)
      const isThaiText = /[\u0E00-\u0E7F]/.test(text);
      
      // สร้าง Utterance ใหม่เพื่อดักจับ Boundary
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isThaiText ? "th-TH" : "en-US";

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.lang === utterance.lang);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else if (isThaiText) {
        alert("ไม่พบเสียงภาษาไทยในระบบของคุณ กรุณาติดตั้งเสียงภาษาไทยในการตั้งค่าของเบราว์เซอร์/ระบบปฏิบัติการ");
      }
      utterance.rate = 0.85; // ปรับช้าลงนิดนึงเพื่อให้อ่านง่าย

      // ฟังก์ชัน Real-time Highlighting
      utterance.onboundary = (event) => {
        const start = event.charIndex;
        const end = event.charIndex + (event.charLength || 1);
        setActiveRange({ start, end });
      };

      utterance.onend = () => setActiveRange(null);
      utterance.onerror = () => setActiveRange(null);

      window.speechSynthesis.speak(utterance);
    }
    onClick?.();
  };

  // ฟังก์ชันสำหรับ Render ข้อความที่มีการแยกส่วนเพื่อทำ Highlight
  const renderContent = () => {
    const text = textRef.current?.innerText || (typeof children === "string" ? children : "");
    if (!activeRange || !text) return children;

    const before = text.substring(0, activeRange.start);
    const highlighted = text.substring(activeRange.start, activeRange.end);
    const after = text.substring(activeRange.end);

    return (
      <>
        {before}
        <span className="bg-[#14dcb4] text-[#000] rounded-sm px-0.5 shadow-[0_0_10px_rgba(20,220,180,0.5)] transition-all">
          {highlighted}
        </span>
        {after}
      </>
    );
  };

  return (
    <span
      ref={textRef}
      onClick={handleClick}
      className={`cursor-help select-text transition-all duration-200 hover:bg-blue-500/20 hover:text-white rounded-sm px-1 inline-block ${className}`}
      style={{
        ...style,
        userSelect: "text",
        WebkitUserSelect: "text",
        position: "relative",
        zIndex: 10, // มั่นใจว่าตัวหนังสืออยู่เหนือเลเยอร์เอฟเฟกต์
      }}
    >
      {renderContent()}
    </span>
  );
}
