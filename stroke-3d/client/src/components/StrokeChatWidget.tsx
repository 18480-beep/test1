/*
 * StrokeChatWidget.tsx
 * AI Chat สำหรับผู้ป่วย Stroke — ตอบเรื่องการแพทย์โดยเฉพาะ
 * - ถามชื่อผู้ใช้ก่อน แล้วพูดชื่อทุกข้อความ
 * - ใช้ Claude API โดยตรง
 * - สไตล์เข้ากับ Surgical Theater dark theme
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `คุณคือ "หมอน้อย" — ผู้ช่วย AI ด้านการฟื้นฟูจากโรคหลอดเลือดสมอง (Stroke) ที่พูดคุยแบบเพื่อนสนิท ไม่เป็นทางการ อบอุ่น และเข้าใจง่าย

กฎสำคัญ:
1. พูดชื่อผู้ใช้ทุกข้อความ เช่น "เฮ้ [ชื่อ]!" หรือ "นั่นดีมากเลยนะ [ชื่อ]" 
2. ใช้ภาษาไทยที่เป็นกันเอง ไม่ใช้ศัพท์แพทย์ยากๆ ถ้าจำเป็นต้องใช้ให้อธิบายด้วย
3. ตอบตรงประเด็น ไม่อ้อมค้อม ไม่ยืดยาวเกินไป
4. ให้กำลังใจเสมอ แต่ต้องตรงไปตรงมา
5. ถ้าคำถามเกินขอบเขต (เช่น ต้องพบแพทย์จริงๆ) บอกตรงๆ และแนะนำให้ไปพบแพทย์
6. เชี่ยวชาญเรื่อง: กายภาพบำบัด, โภชนาการสำหรับผู้ป่วย stroke, ยา anticoagulant, การดูแลผู้ป่วยที่บ้าน, อาการเตือน, การป้องกัน stroke ซ้ำ, การฝึกพูด, การฝึกเดิน

ห้าม: วินิจฉัยโรค, สั่งยา, บอกขนาดยาที่เฉพาะเจาะจง`;

export default function StrokeChatWidget({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string | null>(user?.user_metadata?.full_name || null);
  const [nameInput, setNameInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: user ? `สวัสดีครับคุณ ${user?.user_metadata?.full_name || 'คนไข้'}! 👋 ผมคือหมอน้อย ยินดีที่ได้พบอีกครั้งครับ มีอะไรให้ผมช่วยดูแลวันนี้ไหม?` : "สวัสดีครับ! 👋 ผมคือหมอน้อย ผู้ช่วย AI ด้านการฟื้นฟูจาก Stroke\n\nก่อนเริ่มคุยกัน... จะให้ผมเรียกคุณว่าอะไรดีครับ? 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetName = () => {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    setMessages(prev => [
      ...prev,
      { role: "user", content: name },
      {
        role: "assistant",
        content: `ยินดีที่ได้รู้จักเลยนะ ${name}! 🤝\n\nผมพร้อมช่วยคุณเรื่องการฟื้นฟูจาก Stroke แล้วครับ ถามได้เลย ไม่ว่าจะเป็นเรื่องกายภาพบำบัด โภชนาการ ยา หรืออาการต่างๆ 💪`,
      },
    ]);
    setNameInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !userName) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      
      if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error("ยังไม่ได้ตั้งค่า API Key\n\nสำหรับใช้งาน:\n1. ไปที่ console.anthropic.com/account/keys\n2. สร้าง API Key\n3. เพิ่มลงในไฟล์ .env.local\nVITE_ANTHROPIC_API_KEY=your_key");
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 1000,
          system: `${SYSTEM_PROMPT}\n\nข้อมูลผู้ใช้ปัจจุบัน: ${userName} (Email: ${user?.email || 'N/A'})`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: { message: "API error" } }));
        throw new Error(error.error?.message || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      const reply = data.content?.[0]?.text || "ขอโทษครับ ตอบไม่ได้ตอนนี้ ลองใหม่อีกทีนะครับ";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = error instanceof Error ? error.message : "Error";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `โอ๊ะ ${userName} ขอโทษครับ\n${errMsg}\n\nลองถามใหม่ได้เลยครับ 🙏`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <style>{`
        .sc-wrap {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 24px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .sc-card {
          width: 380px; height: 580px;
          background: rgba(8, 10, 18, 0.98);
          border: 1px solid rgba(20, 220, 180, 0.2);
          border-radius: 16px;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 0 60px rgba(20,220,180,0.08);
        }
        .sc-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(20,220,180,0.05);
          flex-shrink: 0;
        }
        .sc-header-left { display: flex; align-items: center; gap: 10px; }
        .sc-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #14dcb4, #0eb89a);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .sc-name { font-size: 14px; font-weight: 600; color: #14dcb4; }
        .sc-status { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1px; }
        .sc-close {
          background: none; border: none; color: rgba(255,255,255,0.3);
          font-size: 20px; cursor: pointer; padding: 4px; line-height: 1;
          transition: color 0.2s;
        }
        .sc-close:hover { color: rgba(255,255,255,0.7); }
        .sc-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .sc-messages::-webkit-scrollbar { width: 4px; }
        .sc-messages::-webkit-scrollbar-track { background: transparent; }
        .sc-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .sc-bubble {
          max-width: 85%; padding: 10px 14px; border-radius: 12px;
          font-size: 14px; line-height: 1.6; white-space: pre-wrap;
        }
        .sc-bubble-ai {
          background: rgba(20,220,180,0.08);
          border: 1px solid rgba(20,220,180,0.15);
          color: rgba(255,255,255,0.85);
          border-bottom-left-radius: 4px;
        }
        .sc-bubble-user {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
          border-bottom-right-radius: 4px;
        }
        .sc-typing {
          display: flex; gap: 4px; align-items: center; padding: 4px 0;
        }
        .sc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #14dcb4; opacity: 0.4;
          animation: scDot 1.2s ease-in-out infinite;
        }
        .sc-dot:nth-child(2) { animation-delay: 0.2s; }
        .sc-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes scDot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .sc-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sc-name-row { display: flex; gap: 8px; }
        .sc-input-row { display: flex; gap: 8px; }
        .sc-input {
          flex: 1; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 10px 14px;
          color: #fff; font-size: 14px; outline: none;
          font-family: inherit; transition: border-color 0.2s;
        }
        .sc-input:focus { border-color: rgba(20,220,180,0.4); }
        .sc-input::placeholder { color: rgba(255,255,255,0.25); }
        .sc-send {
          width: 40px; height: 40px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #14dcb4, #0eb89a);
          color: #04120e; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s; flex-shrink: 0;
        }
        .sc-send:hover { opacity: 0.85; }
        .sc-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .sc-suggestions {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
        }
        .sc-chip {
          padding: 5px 10px; border-radius: 20px; font-size: 11px;
          border: 1px solid rgba(20,220,180,0.25);
          background: rgba(20,220,180,0.06);
          color: rgba(20,220,180,0.7); cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .sc-chip:hover { background: rgba(20,220,180,0.15); color: #14dcb4; }
      `}</style>

      <div className="sc-wrap" onClick={onClose}>
        <div className="sc-card" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sc-header">
            <div className="sc-header-left">
              <div className="sc-avatar">🩺</div>
              <div>
                <div className="sc-name">หมอน้อย AI</div>
                <div className="sc-status">ผู้ช่วยด้าน Stroke Rehabilitation</div>
              </div>
            </div>
            <button className="sc-close" onClick={onClose}>✕</button>
          </div>

          {/* Messages */}
          <div className="sc-messages">
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={`sc-bubble ${m.role === "assistant" ? "sc-bubble-ai" : "sc-bubble-user"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="sc-bubble sc-bubble-ai">
                <div className="sc-typing">
                  <div className="sc-dot" />
                  <div className="sc-dot" />
                  <div className="sc-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          <div className="sc-footer">
            {userName && (
              <div className="sc-suggestions">
                {["กายภาพบำบัดวันนี้", "อาหารที่ควรกิน", "อาการเตือนที่ต้องรีบไปหาหมอ"].map(s => (
                  <button key={s} className="sc-chip" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {!userName ? (
              <div className="sc-name-row">
                <input
                  className="sc-input"
                  placeholder="พิมพ์ชื่อของคุณ..."
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleSetName();
                  }}
                  autoFocus
                />
                <button className="sc-send" onClick={handleSetName} disabled={!nameInput.trim()}>
                  →
                </button>
              </div>
            ) : (
              <div className="sc-input-row">
                <input
                  ref={inputRef}
                  className="sc-input"
                  placeholder="ถามหมอน้อยได้เลย..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                  autoFocus
                />
                <button className="sc-send" onClick={sendMessage} disabled={!input.trim() || loading}>
                  ↑
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}