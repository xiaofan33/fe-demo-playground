import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwind from '@tailwindcss/vite';
import { alias } from './alias';

export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: { alias },
});
