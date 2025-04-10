<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useG2048 } from './use';
import Tile from './tile.vue';

const boardRef = useTemplateRef<HTMLElement>('boardRef');
const toastTplRef = useTemplateRef<HTMLElement>('toastTplRef');

const boardWidth = ref(4);
const cells = computed(() =>
  Array.from({ length: boardWidth.value }, (_, row) =>
    Array.from({ length: boardWidth.value }, (_, col) => ({
      id: `${row}-${col}`,
      row,
      col,
    })),
  ).flat(),
);

const { gg, tiles, options, bestScore, ...model } = useG2048(boardRef);

function newGame() {
  model.init({ options: { boardWidth: boardWidth.value } });
}

const score = ref(options.value.score);
watch(() => options.value.score, updateScoreLabelWithAnimation);

function updateScoreLabelWithAnimation(to: number, from?: number) {
  if (from === undefined || to < from) {
    score.value = to;
    return;
  }
  const delta = to - from;
  let startTimestamp: number;
  let raf = window.requestAnimationFrame;
  const step = (timestamp: number) => {
    startTimestamp = startTimestamp ?? timestamp;
    const progress = Math.min(1, (timestamp - startTimestamp) / 300);
    if (progress < 1) {
      score.value = from + Math.floor(delta * progress);
      raf(step);
    } else {
      score.value = to;
    }
  };
  raf(step);

  if (toastTplRef.value) {
    let toastNode = toastTplRef.value.cloneNode(true) as HTMLElement | null;
    if (toastNode) {
      toastNode.textContent = `+${delta}`;
      toastNode.classList.remove('hidden');
      toastNode.addEventListener('animationend', () => {
        toastNode?.remove();
        toastNode = null;
      });
      toastTplRef.value.parentNode?.appendChild(toastNode);
    }
  }
}
</script>

<template>
  <div class="g-2048 text-center select-none">
    <div class="inline-flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h1
          class="tile-2048 w-32 self-stretch rounded-md p-2 text-4xl font-bold shadow-none!"
        >
          2048
        </h1>
        <ul class="flex items-center gap-2">
          <li
            class="relative w-24 rounded-md bg-[#bbada0] p-1 text-center text-[#eee4da] dark:bg-[#9b8776]"
          >
            <div class="text-sm">最佳</div>
            <div class="text-lg font-bold text-white">{{ bestScore }}</div>
          </li>
          <li
            class="relative w-24 rounded-md bg-[#bbada0] p-1 text-center text-[#eee4da] dark:bg-[#9b8776]"
          >
            <div class="text-sm">得分</div>
            <div class="text-lg font-bold text-white">
              {{ score }}
            </div>
            <div
              ref="toastTplRef"
              class="toast-up absolute right-1 bottom-0 hidden text-xl font-bold text-white"
            ></div>
          </li>
        </ul>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm underline underline-offset-2 opacity-90">
          移动方块🎯组合出 2048
        </div>
        <button
          class="flex h-12 w-24 items-center justify-center rounded-md bg-[#8f7a6d] text-lg font-bold text-white outline-none dark:bg-[#776359]"
          @click="newGame"
        >
          新游戏
        </button>
      </div>

      <div
        ref="boardRef"
        class="relative rounded-lg bg-[#bbada0] p-[var(--edge)] dark:bg-[#9b8776]"
        :style="{ '--size': boardWidth }"
      >
        <div class="grid grid-cols-[repeat(var(--size),1fr)] gap-[var(--edge)]">
          <div
            v-for="cell in cells"
            :key="cell.id"
            :data-row="cell.row"
            :data-col="cell.col"
            class="h-[var(--side)] w-[var(--side)] rounded bg-[#cdc1b4] dark:bg-[#bdac97]"
          ></div>
        </div>

        <div class="absolute inset-[var(--edge)] text-[calc(var(--side)*0.4)]">
          <div
            v-for="{ id, x, y, value } in tiles"
            :key="id"
            :style="{
              '--x': `calc(var(--side) * ${x} + var(--edge) * ${x})`,
              '--y': `calc(var(--side) * ${y} + var(--edge) * ${y})`,
              'transform': `translate(var(--x), var(--y))`,
            }"
            class="absolute h-[var(--side)] w-[var(--side)] transition-transform"
          >
            <Tile :score="value" />
          </div>
        </div>
        <Transition name="gg">
          <div
            v-if="gg"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-black/70"
          >
            <div class="mb-6 text-5xl font-bold">Game Over</div>
            <button
              class="rounded-md bg-[#8f7a6d] px-6 py-2 text-lg font-bold text-white dark:bg-[#776359]"
              @click="newGame"
            >
              再来
            </button>
          </div>
        </Transition>
      </div>

      <div class="relative flex justify-center">
        <div class="absolute top-2 right-2 font-mono text-sm opacity-90">
          steps: {{ options.steps }}
        </div>
        <button
          :class="[
            'flex h-10 w-16 items-center justify-center rounded-md transition outline-none hover:bg-black/5 dark:bg-white/10',
            model.canBack.value
              ? 'opacity-90'
              : 'cursor-not-allowed opacity-30',
          ]"
          title="撤销上次移动"
          @click="model.back"
        >
          <i class="i-lucide-undo text-lg" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@import '../styles.css';

.gg-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.gg-enter-active {
  transition: all 0.5s ease 1s;
}
</style>
