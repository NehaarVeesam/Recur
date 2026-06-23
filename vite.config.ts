import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Saving a problem writes to problems/*.txt — don't reload the whole app
      ignored: ['**/problems/**'],
    },
  },
});
