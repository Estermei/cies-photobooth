import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR dinonaktifkan di AI Studio melalui variabel lingkungan DISABLE_HMR.
      // Jangan diubah - pemantauan berkas dinonaktifkan untuk mencegah kedipan saat agen melakukan pengeditan.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
