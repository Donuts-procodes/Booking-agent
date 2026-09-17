import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/widget',
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/widget-entry.tsx'),
      name: 'BookingAgentWidget',
      fileName: () => 'booking-agent-widget.js',
      formats: ['iife'],
    },

    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
