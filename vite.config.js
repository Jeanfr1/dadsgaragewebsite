import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    cssTarget: ['chrome111', 'safari16.4', 'firefox115'],
    assetsInlineLimit: 0,
  },
  server: { port: 5203 },
  preview: { port: 4203 },
});
