import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(() => {
  const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

  return {
    base: isElectronBuild ? './' : '/',
    plugins: [react()],
  };
});
