import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { themeConfig } from "@/lib/themeConfig";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
  textScale: number;
  setTextScale: (n: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const TEXT_MIN = 0.5;
const TEXT_MAX = 2.5;
const clampText = (n: number) => Math.min(TEXT_MAX, Math.max(TEXT_MIN, Number(n) || 1));

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = true,
}: { children: React.ReactNode; defaultTheme?: Theme; switchable?: boolean }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem("stroke3d.theme") as Theme) || defaultTheme;
  });

  const [textScale, setTextScaleState] = useState<number>(() => {
    if (typeof window === "undefined") return themeConfig.defaultTextScale || 1.0;
    const stored = localStorage.getItem("stroke3d.textScale");
    return clampText(stored ? Number(stored) : (themeConfig.defaultTextScale || 1.0));
  });

  useEffect(() => {
    const root = document.documentElement;
    const p = themeConfig.pages || {};
    
    // Page Colors
    root.style.setProperty("--login-bg", p.login?.background || "#f8fafc");
    root.style.setProperty("--login-primary", p.login?.primary || "#00d4aa");
    root.style.setProperty("--login-text", p.login?.text || "#1e293b");
    root.style.setProperty("--home-sidebar", p.home?.sidebar || "#0f172a");
    root.style.setProperty("--primary", p.global?.primary || "#00d4aa");
    root.style.setProperty("--border", p.global?.border || "#e2e8f0");

    // Scene Colors (Gradients)
    const s = themeConfig.scenes || {};
    Object.entries(s).forEach(([key, config]: [string, any]) => {
      // key = 'scene0'..'scene6' → CSS var format: --scene-0-c1
      const idx = key.replace('scene', '');
      root.style.setProperty(`--scene-${idx}-c1`, config.color1);
      root.style.setProperty(`--scene-${idx}-c2`, config.color2);
      root.style.setProperty(`--scene-${idx}-accent`, config.accent);
    });

    if (theme === "dark") {
      root.classList.add("dark");
      root.style.setProperty("--background", "#06080d");
      root.style.setProperty("--foreground", "#f8fafc");
    } else {
      root.classList.remove("dark");
      root.style.setProperty("--background", "#f8fafc");
      root.style.setProperty("--foreground", "#1e293b");
    }
    
    root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(textScale));
    localStorage.setItem("stroke3d.textScale", String(textScale));
  }, [textScale]);

  const value = useMemo(() => ({
    theme, 
    setTheme: (t: Theme) => setThemeState(t), 
    toggleTheme: () => setThemeState(p => p === "light" ? "dark" : "light"),
    switchable,
    textScale,
    setTextScale: (n: number) => setTextScaleState(clampText(n))
  }), [theme, switchable, textScale]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
