import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4200,
    allowedHosts: ['*'],
    cors: true,
    fs: {
      allow: ['.']
    }
  },
  appType: 'spa'   // 👈 ADD THIS
});
