<script setup lang="ts">
defineEmits(['onConfirm', 'onCancel']);
</script>

<template>
  <div class="bg-slate-100/60 dark:bg-neutral-800/60">
    <div class="w-80 rounded-lg p-8 text-center md:w-96">
      <div class="mb-8 text-lg">恢复对局 ❓</div>
      <div class="mb-6 text-sm">本地有上次未完成的对局，是否恢复？</div>
      <div class="flex items-center justify-center gap-5">
        <button
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border border-solid border-gray-300/60 bg-red-600/10 text-sm transition hover:bg-red-600/20 dark:border-gray-500/20"
          @click="$emit('onCancel')"
        >
          <i class="i-lucide-x mr-1 text-xl text-red-600" />
          取消
        </button>
        <button
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border border-solid border-gray-300/60 bg-green-600/10 text-sm transition hover:bg-green-600/20 dark:border-gray-500/20"
          @click="$emit('onConfirm')"
        >
          <i class="i-lucide-check mr-1 text-xl text-green-600" />
          确认
        </button>
      </div>
    </div>
  </div>
</template>
