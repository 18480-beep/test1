import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";

interface TextToSpeechContextType {
  speak: (text: string, lang?: "th" | "en") => void;
  stop: () => void;
  isSpeaking: boolean;
  currentLang: "th" | "en";
  setCurrentLang: (lang: "th" | "en") => void;
  isSupported: boolean;
}

const TextToSpeechContext = createContext<TextToSpeechContextType | undefined>(undefined);

export function TextToSpeechProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLang, setCurrentLang] = useState<"th" | "en">("th");
  const [isSupported, setIsSupported] = useState(true);

  // Chrome freezing fix: resume loop
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      (window.speechSynthesis !== undefined || "webkitSpeechSynthesis" in window);
    setIsSupported(supported);
    if (!supported) {
      console.warn("[TTS] Web Speech API not supported in this browser");
    }
  }, []);

  // Chrome fix: keep speech alive (Chrome pauses after ~15s)
  const startResumeLoop = () => {
    if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    resumeTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 5000);
  };

  const stopResumeLoop = () => {
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const speak = useCallback(
    (text: string, lang: "th" | "en" = currentLang) => {
      if (!text || text.trim().length === 0) return;

      try {
        // Step 1: Stop everything first
        window.speechSynthesis.cancel();
        stopResumeLoop();
        setIsSpeaking(false);

        // Step 2: Wait for cancel to settle (Chrome needs this delay)
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang === "th" ? "th-TH" : "en-US";
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            console.log("[TTS] Started speaking");
            setIsSpeaking(true);
            startResumeLoop();
          };

          utterance.onend = () => {
            console.log("[TTS] Finished speaking");
            setIsSpeaking(false);
            stopResumeLoop();
          };

          utterance.onerror = (event) => {
            // 'interrupted' is normal when user stops — not a real error
            if (event.error !== "interrupted") {
              console.error("[TTS] Error:", event.error);
            }
            setIsSpeaking(false);
            stopResumeLoop();
          };

          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        }, 150); // 150ms delay fixes Chrome cancel→speak race condition

      } catch (error) {
        console.error("[TTS] Exception:", error);
        setIsSpeaking(false);
        stopResumeLoop();
      }
    },
    [currentLang]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopResumeLoop();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopResumeLoop();
    };
  }, []);

  const value: TextToSpeechContextType = {
    speak,
    stop,
    isSpeaking,
    currentLang,
    setCurrentLang,
    isSupported,
  };

  return (
    <TextToSpeechContext.Provider value={value}>
      {children}
    </TextToSpeechContext.Provider>
  );
}

export function useTextToSpeech() {
  const context = useContext(TextToSpeechContext);
  if (!context) {
    throw new Error("useTextToSpeech must be used within TextToSpeechProvider");
  }
  return context;
}