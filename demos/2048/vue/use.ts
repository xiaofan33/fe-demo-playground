import { reactive, toRefs, watchEffect } from 'vue';
import { useStorage } from '@vueuse/core';
import { usePagehideCallback } from '@/lib/composable';
import { G2048Model } from '../model';

export interface UseG2048Options {
  saveWhenExit?: boolean;
  lastStateKey?: string;
  bestScoreKey?: string;
}

export function useG2048(args: UseG2048Options = {}) {
  const {
    saveWhenExit = true,
    lastStateKey = '2048-last-state',
    bestScoreKey = '2048-best-score',
  } = args;

  const model = reactive(new G2048Model());
  const { gg, tiles, options } = toRefs(model);

  const bestScore = useStorage(bestScoreKey, 0);
  watchEffect(() => {
    if (options.value.score >= bestScore.value) {
      bestScore.value = options.value.score;
    }
  });

  if (saveWhenExit) {
    usePagehideCallback(() => {
      window.localStorage.setItem(
        lastStateKey,
        JSON.stringify({ tiles: tiles.value, options: options.value }),
      );
    });

    try {
      const storage = window.localStorage.getItem(lastStateKey);
      if (storage) {
        model.init(JSON.parse(storage));
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem(lastStateKey);
    }
  }

  return {
    gg,
    tiles,
    options,
    bestScore,
    init: model.init.bind(model),
    move: model.move.bind(model),
    back: model.back.bind(model),
    canBack: model.canBack.bind(model),
  };
}
