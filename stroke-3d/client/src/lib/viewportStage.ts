export const DESIGN_STAGE_WIDTH = 1920;
export const DESIGN_STAGE_HEIGHT = 1080;

export interface ViewportStage {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  x: (value: number) => number;
  y: (value: number) => number;
  size: (value: number) => number;
  bottom: (value: number) => number;
}

export function getViewportStage(width: number, height: number): ViewportStage {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const scale = Math.min(
    safeWidth / DESIGN_STAGE_WIDTH,
    safeHeight / DESIGN_STAGE_HEIGHT
  );
  const stageWidth = DESIGN_STAGE_WIDTH * scale;
  const stageHeight = DESIGN_STAGE_HEIGHT * scale;
  const offsetX = (safeWidth - stageWidth) / 2;
  const offsetY = (safeHeight - stageHeight) / 2;

  return {
    width: safeWidth,
    height: safeHeight,
    scale,
    offsetX,
    offsetY,
    x: value => offsetX + value * scale,
    y: value => offsetY + value * scale,
    size: value => value * scale,
    bottom: value => safeHeight - (offsetY + (DESIGN_STAGE_HEIGHT - value) * scale),
  };
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
