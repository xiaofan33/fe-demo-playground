<script setup lang="ts">
import { computed } from 'vue';
import { emojiPresets } from '../config.json';
import type { CellProps } from '../model';

const { meta, isHighlighted } = defineProps<{
  meta: CellProps;
  isHighlighted?: boolean;
}>();

const txt = computed(() => {
  if (meta.mark) return emojiPresets.mark;
  if (meta.boom) return emojiPresets.boom;
  if (meta.open && meta.mine) return emojiPresets.mine;
  if (meta.open && meta.aroundMines) return meta.aroundMines;
});

const isMarkedWrong = computed(() => meta.mark && meta.open && !meta.mine);

const bgCls = computed(() => {
  if (isMarkedWrong.value) return 'bg-red-600/30';
  if (meta.boom) return 'bg-red-600/70';
  return isHighlighted || (meta.open && !meta.mark)
    ? `bg-gradient-to-br from-sky-50 to-sky-100`
    : `bg-gradient-to-br from-sky-200 to-sky-300`;
});

const styles = computed(() => {
  if (meta.open && meta.aroundMines) {
    return { color: `var(--number-color-${meta.aroundMines})` };
  }
});
</script>

<template>
  <div
    :class="[
      'relative flex h-full w-full items-center justify-center overflow-hidden transition-[background-color]',
      'border border-sky-400/50',
      bgCls,
    ]"
    :style="styles"
  >
    {{ txt }}
    <b
      v-if="isMarkedWrong"
      class="absolute inset-0 flex items-center justify-center"
      >{{ emojiPresets.wrong }}</b
    >
  </div>
</template>
