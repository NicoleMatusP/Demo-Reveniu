import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: ruta de GitHub Pages (https://nicolematusp.github.io/Demo-Reveniu/)
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/Demo-Reveniu/' : '/',
});
