import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces so the dev server is reachable
    // from other devices on the same Wi-Fi (e.g. testing on a phone).
    host: true,
  },
})
