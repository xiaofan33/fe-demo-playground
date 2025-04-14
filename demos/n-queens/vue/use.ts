import { computed, ref, watchEffect } from 'vue';
import { useTimestamp, useWebWorkerFn } from '@vueuse/core';
import { nQueens$4 } from '../solutions';

export function useNQueensSolutions() {
  const isCalculating = ref(false);
  const timer = ref(0);
  const stamp = useTimestamp();
  let startTimestamp = 0;
  watchEffect(() => {
    if (isCalculating.value) {
      timer.value = stamp.value - startTimestamp;
    }
  });

  const solutions = ref<number[][]>([]);
  const solutionIndex = ref(0);
  const solutionCount = computed(() => solutions.value.length);
  const solutionInput = computed({
    get: () => solutionIndex.value + 1,
    set: input => {
      const current = solutionInput.value;
      const maximin = solutionCount.value;
      if (input === maximin + 1 && current === maximin) {
        solutionIndex.value = 0;
      } else if (input === 0 && current === 1) {
        solutionIndex.value = maximin - 1;
      } else {
        solutionIndex.value = Math.max(0, Math.min(maximin, input) - 1);
      }
    },
  });
  const activeSolution = computed(() => solutions.value[solutionIndex.value]);

  const { workerFn, workerTerminate } = useWebWorkerFn(
    (n: number) => JSON.stringify(nQueens$4(n)),
    { localDependencies: [nQueens$4] },
  );
  async function tryCalculate(n: number) {
    if (isCalculating.value) {
      return false;
    }
    isCalculating.value = true;
    startTimestamp = stamp.value;
    try {
      const resultStr = await workerFn(n);
      solutions.value = JSON.parse(resultStr);
      solutionInput.value = solutionInput.value;
      isCalculating.value = false;
      return true;
    } catch (error) {
      console.error(error);
      isCalculating.value = false;
      workerTerminate();
      return false;
    }
  }

  return {
    isCalculating,
    timer,
    solutionCount,
    solutionInput,
    activeSolution,
    tryCalculate,
  };
}
