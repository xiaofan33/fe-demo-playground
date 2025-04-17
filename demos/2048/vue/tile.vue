<script setup lang="ts">
import { ref, watch } from 'vue';
const { score, isFirstMove } = defineProps<{
  score: number;
  isFirstMove?: boolean;
}>();

const animateCls = ref(!isFirstMove ? 'tile-popup' : 'tile-popup-no-delay');
watch(
  () => score,
  () => (animateCls.value = 'tile-merge'),
);
</script>

<template>
  <div
    :class="[
      'flex h-full w-full items-center justify-center rounded font-bold',
      `tile-${score <= 2048 ? score : 'super'}`,
      animateCls,
    ]"
    @animationend="() => (animateCls = '')"
  >
    {{ score }}
  </div>
</template>
