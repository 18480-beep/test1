import { useState, useEffect, useCallback } from "react";
import {
  SIDEBAR_WIDTH_FULL,
  SIDEBAR_WIDTH_COLLAPSED,
} from "@/components/CommandSidebar";

export interface Breakpoint {
  /** < 768px — phone portrait */
  isMobile: boolean;
  /** 768–1023px — phone landscape / iPad mini */
  isTablet: boolean;
  /** 1024–1279px — iPad / iPad Pro */
  isTabletLarge: boolean;
  /** >= 1280px — desktop */
  isDesktop: boolean;
  sidebarWidth: number;
  width: number;
  height: number;
  isLandscape: boolean;
}

export function useBreakpoint(): Breakpoint {
  const getValues = useCallback((): Breakpoint => {
    // clientWidth ไม่รวม browser sidebar (Opera, Firefox sidebar ฯลฯ)
    const w = document.documentElement.clientWidth;
    const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
    const isLandscape = w > h;

    const isMobile      = w < 768;
    const isTablet      = w >= 768  && w < 1024;
    const isTabletLarge = w >= 1024 && w < 1280;
    const isDesktop     = w >= 1280;

    const sidebarWidth = isMobile
      ? 0
      : isTablet || isTabletLarge
        ? SIDEBAR_WIDTH_COLLAPSED
        : SIDEBAR_WIDTH_FULL;

    return {
      isMobile,
      isTablet,
      isTabletLarge,
      isDesktop,
      sidebarWidth: Math.max(0, sidebarWidth),
      width: w,
      height: h,
      isLandscape,
    };
  }, []);

  const [bp, setBp] = useState<Breakpoint>(getValues);

  useEffect(() => {
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setBp(getValues()));
    };
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    window.visualViewport?.addEventListener("resize", handler);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
      window.visualViewport?.removeEventListener("resize", handler);
    };
  }, [getValues]);

  return bp;
}