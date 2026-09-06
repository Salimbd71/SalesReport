import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // GitHub Actions চলাকালীন base পাথ /SalesReport/ হবে, অন্যথায় (Vercel/Netlify) / থাকবে
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

  return {
    plugins: [react(), tailwindcss()],
    base: isGithubActions ? '/SalesReport/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});