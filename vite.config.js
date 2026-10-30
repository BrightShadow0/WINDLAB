import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from /WINDLAB/, not the domain root.
export default defineConfig({
  plugins: [react()],
  base: '/WINDLAB/',
});
