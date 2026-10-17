import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server is isolated from the user's site (127.0.0.1:5173): different port = different origin,
// and /api is proxied to a dev API server that writes to data-dev/.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:5181' },
  },
  build: { chunkSizeWarningLimit: 4000 },
  test: { include: ['tests/**/*.test.ts'] },
});
