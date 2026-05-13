type SceneTune = {
  shiftX: number;
  shiftY: number;
  boxScale: number;
  textScale: number;
};

type GameButtonTune = {
  shiftX: number;
  shiftY: number;
  scale: number;
};

const sceneTextBoxBase: SceneTune = {
  // + moves right, - moves left.
  shiftX: 1,
  // + moves down, - moves up.
  shiftY: 0,
  // Size of the whole text box frame.
  boxScale: 1,
  // Font size inside scene text boxes.
  textScale: 1,
};

const gameButtonBase: GameButtonTune = {
  shiftX: 0,
  shiftY: 0,
  scale: 1,
};

const sceneTextBoxOverrides: Record<number, Partial<SceneTune>> = {
  1: {},
  2: {},
};

const gameButtonOverrides: Record<number, Partial<GameButtonTune>> = {
  1: {},
  2: {},
  3: {},
  4: {},
};

export const layoutTuning = {
  sceneTextBoxes: {
    desktop: sceneTextBoxBase,
    mobile: {
      ...sceneTextBoxBase,
      textScale: 1,
    },
    // Per-scene overrides. Scene numbers match sceneData id.
    // Example:
    // 1: { shiftX: -24, shiftY: 8, textScale: 0.92 },
    byScene: sceneTextBoxOverrides,
  },
  defaultSceneText: {
    // This affects scenes without textBoxes.
    shiftX: 0,
    shiftY: 0,
    textScale: 1,
  },
  gameButton: {
    desktop: gameButtonBase,
    mobile: {
      ...gameButtonBase,
      scale: 1,
    },
    byScene: gameButtonOverrides,
  },
};

export function getSceneTextBoxTune(sceneId: number, isMobile: boolean): SceneTune {
  const base = isMobile
    ? layoutTuning.sceneTextBoxes.mobile
    : layoutTuning.sceneTextBoxes.desktop;
  return {
    ...base,
    ...(layoutTuning.sceneTextBoxes.byScene[sceneId] ?? {}),
  };
}

export function getGameButtonTune(sceneId: number, isMobile: boolean): GameButtonTune {
  const base = isMobile
    ? layoutTuning.gameButton.mobile
    : layoutTuning.gameButton.desktop;
  return {
    ...base,
    ...(layoutTuning.gameButton.byScene[sceneId] ?? {}),
  };
}
