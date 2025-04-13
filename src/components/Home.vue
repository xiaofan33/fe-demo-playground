<script setup lang="ts">
import Demos from '../assets/demos.json';
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-10">
    <h1 class="mb-8 text-3xl font-bold">Front-end Demo Playground</h1>
    <div class="grid gap-4 sm:grid-cols-2">
      <router-link
        v-for="demo in Demos"
        :key="demo.path"
        :to="demo.path"
        class="rounded-lg border p-6 transition-colors hover:border-gray-400"
      >
        <h2 class="mb-2 text-xl font-semibold">{{ demo.name }}</h2>
        <p class="text-gray-600">{{ demo.description }}</p>
      </router-link>
    </div>
  </main>
</template>
