import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from a subpath on GitHub Pages. This app has no router — views are state-driven —
// so `base` is all that's needed; there are no deep links to fall back for.
export default defineConfig({
  base: '/ai-demos/mytipreport/',
  plugins: [react()],
  server: { open: true },
})
