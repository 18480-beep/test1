/*
 * useBreakpoint.ts
 * Flutter-style MediaQuery hook for responsive layout
 * 
 * Usage:
 *   const { isMobile, isTablet, sidebarWidth } = useBreakpoint();
 */

import { useState, useEffect } from "react";

export interface Breakpoint {
  /** < 640px — phone portrait */
  isMobile: boolean;
  /** 640–1023px — phone landscape / small tablet */
  isTablet: boolean;
  /** >= 1024px — desktop */
  isDesktop: boolean;
  /** Width of the left sidebar (0 on mobile, 64 collapsed, 240 expanded) */
  sidebarWidth: number;
  /** window.innerWidth */
  width: number;
}

export function useBreakpoint(): Breakpoint {
  const getValues = (): Breakpoint => {
    const w = window.innerWidth;
    const isMobile  = w < 640;
    const isTablet  = w >= 640 && w < 1024;
    const isDesktop = w >= 1024;
    // On mobile the sidebar slides in as a drawer (width = 0 in layout flow)
    // On tablet it collapses to icon-only (64px)
    // On desktop it stays full (240px) — ต้องตรงกับ CommandSidebar.tsx W = 240
    const sidebarWidth = isMobile ? 0 : isTablet ? 64 : 240;
    return { isMobile, isTablet, isDesktop, sidebarWidth, width: w };
  };

  const [bp, setBp] = useState<Breakpoint>(getValues);

  useEffect(() => {
    const handler = () => setBp(getValues());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return bp;
}