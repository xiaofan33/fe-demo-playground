import confetti, { type Options } from 'canvas-confetti';
import type { BoardProps } from './model';

export type SettingOptions = BoardProps & {
  side: number;
  edge: number;
  openFirst: boolean;
  markFirst: boolean;
};

export function formatNumber(num: number) {
  return Math.min(999, Math.floor(num)).toString().padStart(3, '0');
}

export function formatColorCssVars(colors: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [
      `--number-color-${key}`,
      value,
    ]),
  );
}

export function playWinAnimation() {
  const defaults = {
    particleCount: 50,
    origin: { y: 0.8 },
    gravity: 0.75,
    ticks: 600,
  } satisfies Options;

  const configs = [
    { spread: 26, startVelocity: 25 },
    { spread: 60, startVelocity: 30, decay: 0.95 },
    { spread: 100, startVelocity: 35, decay: 0.95, scalar: 0.9 },
    { spread: 120, startVelocity: 25, decay: 0.95, scalar: 1.2 },
    { spread: 120, startVelocity: 35, decay: 0.94 },
  ] satisfies Options[];

  configs.forEach(config => {
    confetti({
      ...defaults,
      ...config,
    });
  });
}
