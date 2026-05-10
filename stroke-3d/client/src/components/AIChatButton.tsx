import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatButton() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // สร้าง conversation history สำหรับ API
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: currentInput },
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "", // ใส่ key ผ่าน env หรือ backend
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          system: `คุณคือผู้ช่วยด้านการฟื้นฟูจากโรคหลอดเลือดสมอง (Stroke Rehabilitation Assistant) 
ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เข้าใจง่าย อบอุ่น และให้กำลังใจ
ช่วยเรื่อง: การออกกำลังกายฟื้นฟู, คำแนะนำสุขภาพ, การจัดการอาการ, ปัจจัยเสี่ยงโรคหลอดเลือดสมอง
ผู้ใช้ชื่อ: ${profile?.username || profile?.full_name || user?.user_metadata?.full_name || user?.email || "ผู้ใช้งาน"}`,
          messages: apiMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.content?.[0]?.text || "ขอโทษค่ะ ไม่สามารถตอบได้ในขณะนี้";
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (response.status === 401) {
        // ยังไม่ได้ตั้ง API key — ใช้ fallback
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "สวัสดีค่ะ! ยังไม่ได้เชื่อมต่อ AI จริงๆ กรุณาตั้งค่า API Key ในระบบก่อนนะคะ\n\nสิ่งที่ AI ช่วยได้:\n• เคล็ดลับการออกกำลังกายฟื้นฟู\n• คำแนะนำการดูแลสุขภาพ\n• การจัดการอาการหลังโรคหลอดเลือดสมอง\n• ตรวจสอบปัจจัยเสี่ยง",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("[AIChatButton] Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "ขอโทษค่ะ มีปัญหาในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ai-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(79, 142, 247, 0.4), inset 0 0 20px rgba(79, 142, 247, 0.08); }
          50% { box-shadow: 0 0 40px rgba(79, 142, 247, 0.6), inset 0 0 30px rgba(79, 142, 247, 0.12); }
        }
        @keyframes chat-slide-in {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .ai-chat-btn {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(79, 142, 247, 0.15), rgba(100, 180, 255, 0.1));
          border: 2px solid rgba(79, 142, 247, 0.4); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
          animation: ai-float 4s ease-in-out infinite, ai-glow 3s ease-in-out infinite;
          position: relative;
          box-shadow: 0 0 20px rgba(79, 142, 247, 0.4), inset 0 0 20px rgba(79, 142, 247, 0.08);
        }
        .ai-chat-btn:hover {
          transform: scale(1.1);
          background: linear-gradient(135deg, rgba(79, 142, 247, 0.25), rgba(100, 180, 255, 0.18));
          border-color: rgba(79, 142, 247, 0.7);
          box-shadow: 0 0 50px rgba(79, 142, 247, 0.7), inset 0 0 30px rgba(79, 142, 247, 0.15);
        }
        .ai-chat-btn::after {
          content: ''; position: absolute; width: 8px; height: 8px;
          border-radius: 50%; background: #4F8EF7; top: -4px; right: -4px;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .ai-icon { width: 24px; height: 24px; color: #4F8EF7; }
        .chat-modal-bg {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px); z-index: 100;
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 16px;
        }
        .chat-modal {
          width: 100%; max-width: 420px; height: 80vh; max-height: 640px;
          background: linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%);
          border: 1px solid rgba(79, 142, 247, 0.3); border-radius: 16px;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 60px rgba(79, 142, 247, 0.2);
          animation: chat-slide-in 0.3s ease;
        }
        .chat-header {
          padding: 16px 20px; border-bottom: 1px solid rgba(79, 142, 247, 0.2);
          display: flex; align-items: center; justify-content: space-between;
        }
        .chat-title {
          font-size: 14px; font-weight: 600; color: #4F8EF7;
          font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 8px;
        }
        .chat-close {
          background: none; border: none; color: rgba(255,255,255,0.5);
          font-size: 20px; cursor: pointer; transition: color 0.2s; padding: 0 4px;
        }
        .chat-close:hover { color: rgba(255,255,255,0.9); }
        .messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .message { display: flex; gap: 8px; animation: message-fade 0.3s ease; }
        @keyframes message-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.user { justify-content: flex-end; }
        .message-bubble {
          max-width: 80%; padding: 10px 14px; border-radius: 12px;
          font-size: 13px; line-height: 1.6; word-wrap: break-word;
          font-family: 'DM Sans', sans-serif; white-space: pre-wrap;
        }
        .message.user .message-bubble {
          background: linear-gradient(135deg, #4F8EF7 0%, #6B9CFF 100%);
          color: white; border-bottom-right-radius: 4px;
        }
        .message.assistant .message-bubble {
          background: rgba(79, 142, 247, 0.1); color: #E0E8F0;
          border: 1px solid rgba(79, 142, 247, 0.25); border-bottom-left-radius: 4px;
        }
        .chat-input-group {
          padding: 12px 16px; border-top: 1px solid rgba(79, 142, 247, 0.2);
          display: flex; gap: 8px; background: rgba(0,0,0,0.3);
          border-radius: 0 0 16px 16px;
        }
        .chat-input {
          flex: 1; background: rgba(79, 142, 247, 0.08);
          border: 1px solid rgba(79, 142, 247, 0.25); border-radius: 8px;
          padding: 10px 12px; color: #E0E8F0; font-size: 13px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: #4F8EF7; background: rgba(79, 142, 247, 0.12); }
        .chat-input::placeholder { color: rgba(255,255,255,0.3); }
        .chat-send {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #4F8EF7 0%, #6B9CFF 100%);
          border: none; border-radius: 8px; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s; font-size: 16px; align-self: center;
        }
        .chat-send:hover:not(:disabled) { transform: scale(1.05); }
        .chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .typing-indicator { display: flex; gap: 4px; padding: 10px 14px; }
        .typing-dot {
          width: 6px; height: 6px; background: rgba(79, 142, 247, 0.6);
          border-radius: 50%; animation: typing 1.4s infinite;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
        @media (max-width: 640px) {
          .chat-modal { max-width: 100%; height: 90vh; }
        }
      `}</style>

      {/* Floating AI Chat Button */}
      <button
        className="ai-chat-btn"
        onClick={() => setIsOpen(true)}
        title="แชทปรึกษา AI"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}
      >
        <svg className="ai-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="chat-modal-bg" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-title">
                <span>🤖</span>
                <span>AI Health Assistant</span>
              </div>
              <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Messages */}
            <div className="messages">
              {messages.length === 0 ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", flexDirection: "column", gap: 16,
                  color: "rgba(255,255,255,0.5)", textAlign: "center", padding: 24,
                }}>
                  <div style={{ fontSize: 32 }}>🏥</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                    สวัสดี! ผมคือผู้ช่วยด้านการฟื้นฟูสมอง<br />
                    มีอะไรให้ช่วยคุณไหมครับ?
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-bubble">{msg.content}</div>
                  </div>
                ))
              )}
              {loading && (
                <div className="message assistant">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-group">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="พิมพ์คำถามของคุณ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    handleSendMessage();
                  }
                }}
                disabled={loading}
              />
              <button
                className="chat-send"
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                title="ส่งข้อความ"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
