<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue';
import { useTimestamp } from '@vueuse/core';
import { difficultyOptions, emojiPresets, numberColors } from '../config.json';
import {
  formatColorCssVars,
  formatNumber,
  playWinAnimation,
  type SettingOptions,
} from '../utils';
import { useMinesweeperModel } from './use';
import Board from './board.vue';
import type { CellProps, OperationType } from '../model';

const settings = ref<SettingOptions>({
  w: 9,
  h: 9,
  m: 10,
  side: 34,
  edge: 2,
  openFirst: true,
  markFirst: false,
});

const lastGameStorageKey = 'g-minesweeper-last-game';
const showResumeDialog = ref(false);

const sharedUrl = ref('');
const difficulty = ref('easy');
const timer = ref(0);

const { board, state, flagNum, ...model } = useMinesweeperModel();
const stamp = useTimestamp();

watch(
  difficulty,
  value => {
    if (value !== 'custom') {
      const { w, h, m } = difficultyOptions.find(({ key }) => key === value)!;
      gameReady({ w, h, m });
    }
  },
  { immediate: true },
);

watchEffect(() => {
  if (state.value === 'ready') {
    timer.value = 0;
  } else if (state.value === 'playing') {
    const { start = stamp.value, duration } = model.timer.value;
    timer.value = Math.floor((stamp.value - start + duration) / 1000);
  } else if (state.value === 'won') {
    setTimeout(playWinAnimation, 500);
  }
});

onMounted(() => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    tryResumeGame(atob(hash));
  } else if (window.localStorage.getItem(lastGameStorageKey)) {
    showResumeDialog.value = true;
  }
});

function gameReady(args?: Partial<SettingOptions>) {
  settings.value = { ...settings.value, ...args };
  model.init(settings.value);
  sharedUrl.value = '';
}

function onOperate(cell: CellProps, action: OperationType) {
  model.operate(cell, action, settings.value.openFirst);
}

function onShareCurrentGame() {
  const hash = btoa(JSON.stringify(model.dump()));
  sharedUrl.value = location.origin + location.pathname + '/#' + hash;
}

function onClickSharedUrl() {
  setTimeout(() => {
    sharedUrl.value = '';
  }, 1000);
}

function tryResumeGame(dataStr?: string) {
  try {
    dataStr = dataStr ?? localStorage.getItem(lastGameStorageKey) ?? '';
    model.load(JSON.parse(dataStr));
  } catch (e) {
    gameReady();
  } finally {
    showResumeDialog.value = false;
  }
}

function onConfirmResume() {
  showResumeDialog.value = false;
  window.localStorage.removeItem(lastGameStorageKey);
}
</script>

<template>
  <div class="text-center select-none">
    <div class="inline-flex max-w-full flex-col gap-5">
      <div class="flex items-center">
        <button
          v-for="{ key, text } in difficultyOptions"
          :key="key"
          class="mr-1 text-sm"
          @click="difficulty = key"
        >
          {{ text }}
        </button>
        <button class="ml-auto" title="重玩本局" @click="model.restart">
          <i class="i-lucide-repeat-1" />
        </button>
      </div>

      <div
        class="flex items-center justify-between font-mono text-xl font-bold"
      >
        <div class="w-20" title="未标记的地雷数">
          {{ emojiPresets.mine }}
          <span class="text-red-500">{{ formatNumber(flagNum) }}</span>
        </div>
        <button class="h-9 w-18" @click="gameReady()">
          {{ emojiPresets[state] }}
        </button>
        <div class="w-20" title="本局已用时间">
          {{ emojiPresets.timer }}
          <span class="text-red-500">{{ formatNumber(timer) }}</span>
        </div>
      </div>

      <div class="overflow-auto">
        <Board
          v-bind="{ ...settings }"
          :colorCssVars="formatColorCssVars(numberColors)"
          :getCell="model.getCell"
          :getHighlightedCells="model.getHighlightedCells"
          @onOperate="onOperate"
        />
      </div>

      <div>
        <div class="flex items-center gap-4">
          <label for="toggleOpenFirst">
            <input
              id="toggleOpenFirst"
              type="checkbox"
              v-model="settings.openFirst"
            />
            {{ emojiPresets.fast }}
          </label>
          <label for="toggleFlagFirst">
            <input
              id="toggleFlagFirst"
              type="checkbox"
              v-model="settings.markFirst"
            />
            {{ emojiPresets.mark }}
          </label>
          <button
            v-if="state !== 'ready'"
            class="ml-auto"
            title="分享当前局面"
            @click="onShareCurrentGame"
          >
            <i class="i-lucide-share-2" />
          </button>
        </div>
        <div v-if="sharedUrl" class="mt-2 text-right text-sm">
          已生成本局链接，<a
            :href="sharedUrl"
            target="_blank"
            class="text-blue-500 hover:underline"
            @click="onClickSharedUrl"
            >点击前往</a
          >
        </div>
      </div>
    </div>
  </div>
</template>
