<script setup lang="ts">
import { computed, ref } from 'vue';
import ChessBoard from './chess-board.vue';
import ChessQueen from './chess-queen.vue';

const options = ref({
  side: 36,
  edge: 36,
  colors: ['#eeeed2', '#769656'],
  // colors = ['#f0d9b5', '#b58863'],
});

const inputN = ref(8);
const queens = computed(() =>
  Array.from({ length: inputN.value }, (_, index) => ({
    id: index,
    x: index,
    y: inputN.value - 1,
  })),
);
</script>

<template>
  <div>
    <ChessBoard v-bind="options" :n="inputN">
      <template #chess-layer>
        <ChessQueen
          v-for="q in queens"
          :key="q.id"
          :style="{ transform: `translate(${q.x * 100}%, ${q.y * 100}%)` }"
          class="h-[var(--side)] w-[var(--side)] text-[calc(var(--side)*0.6))]"
        />
      </template>
    </ChessBoard>
  </div>
</template>

<style src="../styles.css"></style>
