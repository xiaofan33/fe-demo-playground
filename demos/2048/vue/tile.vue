<script setup lang="ts">
import { ref, watch } from 'vue';
const { score } = defineProps<{ score: number }>();

// first render
const animateCls = ref('tile-popup-no-delay');
watch(
  () => score,
  (_, oldScore) => (animateCls.value = !oldScore ? 'tile-popup' : 'tile-merge'),
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
