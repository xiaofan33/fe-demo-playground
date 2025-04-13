<script setup lang="ts">
const {
  n = 8,
  side = 36,
  edge = 36,
  colors = ['#f0d9b5', '#b58863'],
} = defineProps<{
  n?: number;
  side?: number;
  edge?: number;
  colors?: string[];
}>();

defineEmits<{
  (e: 'tap', x: number, y: number): void;
}>();

const squareList = [
  {
    key: 'left',
    outerCls: 'left-0 top-[var(--edge)] flex-col',
    innerCls: 'h-[var(--side)] w-[var(--edge)]',
    getLabel: (i: number) => n - i,
  },
  {
    key: 'right',
    outerCls: 'right-0 top-[var(--edge)] flex-col',
    innerCls: 'h-[var(--side)] w-[var(--edge)]',
    getLabel: (i: number) => n - i,
  },
  {
    key: 'top',
    outerCls: 'top-0 left-[var(--edge)]',
    innerCls: 'h-[var(--edge)] w-[var(--side)]',
    getLabel: (i: number) => String.fromCodePoint(i + 65 /** 'A' ascii */),
  },
  {
    key: 'bottom',
    outerCls: 'bottom-0 left-[var(--edge)]',
    innerCls: 'h-[var(--edge)] w-[var(--side)]',
    getLabel: (i: number) => String.fromCodePoint(i + 65),
  },
];
</script>

<template>
  <div
    :style="{
      '--side': `${side}px`,
      '--edge': `${edge}px`,
      '--size': `${side * n + edge * 2}px`,
      '--color-0': colors[0],
      '--color-1': colors[1],
    }"
    class="max-w-full overflow-auto"
  >
    <div
      class="relative mx-auto my-[1px] w-[var(--size)] rounded-md p-[var(--edge)] shadow"
    >
      <div
        v-for="{ key, outerCls, innerCls, getLabel } in squareList"
        :key="key"
        :class="['absolute flex', outerCls]"
      >
        <div
          v-for="(_, index) in n"
          :class="[
            'flex items-center justify-center font-mono text-sm',
            innerCls,
          ]"
        >
          {{ getLabel(index) }}
        </div>
      </div>
      <div class="outline">
        <div v-for="(row, y) in n" :key="y" class="flex" :data-row="row">
          <div
            v-for="(col, x) in n"
            :key="x"
            :data-col="col"
            :class="[
              'h-[var(--side)] w-[var(--side)]',
              (x + y) % 2 === 0 ? 'bg-[var(--color-0)]' : 'bg-[var(--color-1)]',
            ]"
            @click="$emit('tap', x, y)"
          >
            <slot name="board-layer" :x="x" :y="y" />
          </div>
        </div>
      </div>
      <div class="absolute top-[var(--edge)] left-[var(--edge)]">
        <slot name="chess-layer" />
      </div>
    </div>
  </div>
</template>
