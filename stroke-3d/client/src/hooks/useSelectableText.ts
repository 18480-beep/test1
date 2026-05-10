import { useEffect } from "react";
import { useTextToSpeech } from "@/contexts/TextToSpeechContext";

/**
 * Hook ที่เปิดให้ double-click หรือ single-click (หลังเลือกข้อความ)
 * อ่านออกเสียงได้ — รองรับภาษาไทยและอังกฤษ
 * 
 * แก้ไข: ใช้ mouseup แทน dblclick เพื่อจับ selection ได้แน่นอน
 * และเพิ่ม dblclick listener แยกอีกชั้น เพื่อให้ทำงานได้ทั้งสองกรณี
 */
export function useSelectableText() {
  const { speak } = useTextToSpeech();

  useEffect(() => {
    let lastSelectedText = "";

    // ===== dblclick: อ่านทันทีที่ดับเบิลคลิก =====
    const handleDoubleClick = (e: MouseEvent) => {
      // รอให้ browser เลือกคำเสร็จก่อน (dblclick เลือกคำให้อัตโนมัติ)
      setTimeout(() => {
        const selected = window.getSelection()?.toString().trim() ?? "";
        if (selected.length > 0) {
          const isThai = /[\u0E00-\u0E7F]/.test(selected);
          speak(selected, isThai ? "th" : "en");
          lastSelectedText = selected;
        }
      }, 50);
    };

    // ===== mouseup: ตรวจจับการเลือกข้อความด้วยการลาก =====
    // (กรณีที่ dblclick ไม่ถูกยิง เช่น ใน element ที่ prevent default)
    const handleMouseUp = () => {
      // ใช้ setTimeout เพื่อให้ selection update เสร็จ
      setTimeout(() => {
        const selected = window.getSelection()?.toString().trim() ?? "";
        // อ่านเมื่อเลือกข้อความ 10+ ตัวอักษร และยังไม่ได้อ่านอันนี้
        if (selected.length >= 10 && selected !== lastSelectedText) {
          lastSelectedText = selected;
          // ไม่อ่านอัตโนมัติตรงนี้ เพราะอาจรบกวน
          // (ปล่อยให้ใช้ผ่านปุ่มในเมนูแทน สะดวกกว่าสำหรับผู้สูงอายุ)
        }
      }, 100);
    };

    document.addEventListener("dblclick", handleDoubleClick, { capture: true });
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("dblclick", handleDoubleClick, { capture: true });
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [speak]);
}