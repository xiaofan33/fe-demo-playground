import { fileURLToPath } from 'node:url';
import { resolve } from 'pathe';

function r(path: string) {
  return resolve(fileURLToPath(new URL('.', import.meta.url)), path);
}

export const alias: Record<string, string> = {
  '@/shared': r('./demos/shared'),
  '@/2048': r('./demos/2048'),
  '@/minesweeper': r('./demos/minesweeper'),
  '@/n-queens': r('./demos/n-queens'),
};
