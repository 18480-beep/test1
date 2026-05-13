import { useState } from "react";
import { useTextToSpeech } from "@/contexts/TextToSpeechContext";

// ── Helper: รอ voices โหลด + หา Thai voice แบบ fuzzy ──────────────
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { resolve(v); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

function findVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  // ลอง exact match ก่อน แล้ว fallback หา prefix (th, en)
  return (
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()))
  );
}

async function speakText(text: string, lang: string, onEnd: () => void) {
  window.speechSynthesis.cancel();
  const voices = await getVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;

  const voice = findVoice(voices, lang);
  if (voice) {
    utterance.voice = voice;
  } else if (lang.startsWith("th")) {
    alert("ไม่พบเสียงภาษาไทยในระบบ\nกรุณาไปที่ Settings → Time & Language → Speech แล้วเพิ่มภาษาไทย");
    onEnd(); return;
  }

  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

// ─────────────────────────────────────────────────────────────────────
export default function TTSControlButton() {
  const { isSpeaking, stop, speak, currentLang, setCurrentLang } = useTextToSpeech();
  const [showMenu, setShowMenu] = useState(false);

  const handleReadPage = () => {
    setShowMenu(false);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('.control-panel-container') || parent.closest('.tts-menu') || parent.closest('.sc-wrap') || parent.closest('header') || parent.closest('.fixed'))
          return NodeFilter.FILTER_REJECT;
        const skipTags = ["SCRIPT","STYLE","NOSCRIPT","BUTTON","INPUT","TEXTAREA","SELECT"];
        if (skipTags.includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const style = window.getComputedStyle(parent);
        if (style.display==="none"||style.visibility==="hidden"||style.opacity==="0") return NodeFilter.FILTER_REJECT;
        const text = node.textContent?.trim() ?? "";
        if (text.length < 2) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const parts: string[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      if (text) parts.push(text);
    }
    const fullText = parts.join(" ").replace(/\s+/g," ").trim();
    if (!fullText) return;

    const isThaiDominant = (fullText.match(/[\u0E00-\u0E7F]/g)||[]).length > fullText.length * 0.1;
    const lang = isThaiDominant ? "th-TH" : (currentLang === "th" ? "th-TH" : "en-US");
    speakText(fullText, lang, stop);
  };

  const handleReadSelection = () => {
    setShowMenu(false);
    const selected = window.getSelection()?.toString().trim();
    if (!selected) {
      speak(
        currentLang==="th" ? "กรุณาเลือกข้อความก่อน แล้วกดปุ่มอ่านข้อความที่เลือก" : "Please select text first.",
        currentLang==="th" ? "th-TH" : "en-US"
      );
      return;
    }
    const isThai = /[\u0E00-\u0E7F]/.test(selected);
    speakText(selected, isThai ? "th-TH" : "en-US", stop);
  };

  return (
    <>
      <style>{`
        .tts-button {
          position: relative;
          width: clamp(40px, 4.4vw, 52px);
          height: clamp(40px, 4.4vw, 52px);
          min-width: 40px;
          min-height: 40px;
          border-radius: 12px;
          border: 1.5px solid rgba(200,150,50,0.4);
          background: linear-gradient(135deg,rgba(10,10,15,0.85),rgba(20,20,35,0.9));
          color: #C89632; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4); backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          font-size: clamp(18px, 2.2vw, 22px);
          padding: 0;
          flex: 0 0 auto;
          touch-action: manipulation;
        }
        .tts-button:hover { transform: translateY(-3px); border-color: #C89632; box-shadow: 0 8px 28px rgba(200,150,50,0.3); background: linear-gradient(135deg,rgba(200,150,50,0.15),rgba(220,180,80,0.1)); }
        .tts-button.speaking { animation: tts-pulse 1s ease-in-out infinite; border-color: #C89632; background: linear-gradient(135deg,rgba(200,150,50,0.2),rgba(220,180,80,0.15)); }
        @keyframes tts-pulse { 0%,100%{box-shadow:0 4px 16px rgba(200,150,50,0.4);}50%{box-shadow:0 8px 28px rgba(200,150,50,0.6);} }
        .tts-control-wrap {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 100%;
        }
        .tts-menu {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          width: min(248px, calc(100vw - var(--control-panel-left, 16px) - max(env(safe-area-inset-right, 0px), 10px)));
          max-height: min(420px, calc(100vh - 140px));
          background: linear-gradient(180deg,rgba(10,10,15,0.97),rgba(15,15,25,0.97));
          border: 1px solid rgba(200,150,50,0.3);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          animation: menu-slide-in 0.2s ease;
          overflow: auto;
          overscroll-behavior: contain;
        }
        @keyframes menu-slide-in { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        .tts-menu-item { padding: 13px 16px; border: none; background: none; color: rgba(255,255,255,0.8); cursor: pointer; width: 100%; text-align: left; font-size: 14px; line-height: 1.35; transition: all 0.2s; border-bottom: 1px solid rgba(200,150,50,0.1); font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:10px; }
        .tts-menu-item:last-child { border-bottom: none; }
        .tts-menu-item:hover { background: rgba(200,150,50,0.15); color: #C89632; }
        .tts-menu-item.active { background: rgba(200,150,50,0.2); color: #C89632; font-weight: 600; }
        .tts-menu-item.primary { background: rgba(200,150,50,0.12); color: #E8B84B; font-weight: 600; font-size: 15px; }
        .tts-menu-item.primary:hover { background: rgba(200,150,50,0.25); }
        .tts-menu-divider { height: 1px; background: rgba(200,150,50,0.2); margin: 2px 0; }
        .tts-menu-label { padding: 8px 14px 4px; font-size: 11px; color: rgba(200,150,50,0.6); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; }
        .tts-stop-bar {
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          display:flex; align-items:center; gap:8px;
          max-width: calc(100vw - var(--control-panel-left, 16px) - clamp(56px, 8vw, 68px) - max(env(safe-area-inset-right, 0px), 10px));
          padding:6px 10px; background:rgba(200,150,50,0.1); border:1px solid rgba(200,150,50,0.3); border-radius:8px; font-size:12px; color:#C89632; cursor:pointer; transition:background 0.2s; white-space:nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tts-stop-bar:hover { background: rgba(200,150,50,0.2); }

        /* ── Thai voice warning banner ── */
        .tts-warn { padding:10px 14px; background:rgba(255,180,0,0.08); border-top:1px solid rgba(255,180,0,0.15); font-size:11px; color:rgba(255,200,80,0.7); line-height:1.5; }

        @media (max-width: 480px) {
          .tts-menu {
            width: min(286px, calc(100vw - var(--control-panel-left, 10px) - max(env(safe-area-inset-right, 0px), 10px)));
            max-height: min(360px, calc(100vh - 124px));
          }
          .tts-menu-item {
            padding: 12px 13px;
            font-size: 13px;
          }
          .tts-menu-item.primary {
            font-size: 14px;
          }
          .tts-warn {
            font-size: 10.5px;
          }
        }
      `}</style>

      <div className="tts-control-wrap">
        {isSpeaking && (
          <button className="tts-stop-bar" onClick={stop} title="หยุดอ่าน">
            🔊 กำลังอ่าน...&nbsp;<span style={{fontSize:16}}>⏹</span>
          </button>
        )}

        <button
          className={`tts-button ${isSpeaking?"speaking":""}`}
          onClick={() => { if (isSpeaking) { stop(); } else { setShowMenu(!showMenu); } }}
          aria-label={isSpeaking?"หยุดอ่าน":"เมนูเสียงอ่าน"}
        >
          <span aria-hidden="true">{isSpeaking?"🔊":"🔇"}</span>
        </button>

        {showMenu && !isSpeaking && (
          <div className="tts-menu">
            <button className="tts-menu-item primary" onClick={handleReadPage}>📖 อ่านทั้งหน้า</button>
            <button className="tts-menu-item" onClick={handleReadSelection}>✍️ อ่านข้อความที่เลือก</button>
            <div className="tts-menu-divider" />
            <div className="tts-menu-label">เลือกภาษา</div>
            <button className={`tts-menu-item ${currentLang==="th"?"active":""}`} onClick={()=>{setCurrentLang("th");setShowMenu(false);}}>🇹🇭 ไทย</button>
            <button className={`tts-menu-item ${currentLang==="en"?"active":""}`} onClick={()=>{setCurrentLang("en");setShowMenu(false);}}>🇺🇸 English</button>
            <div className="tts-menu-divider" />
            <div className="tts-warn">
              💡 เลือกข้อความ → กด "อ่านข้อความที่เลือก"<br/>
              หากไม่มีเสียงไทย: Settings → Time &amp; Language → Speech → เพิ่มภาษาไทย
            </div>
          </div>
        )}
      </div>
    </>
  );
}
