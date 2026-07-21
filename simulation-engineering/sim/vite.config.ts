import { defineConfig } from 'vite';

/**
 * The Three.js sim builds to a plain static bundle that lands in the demo
 * shell's public/sim/, so /student/simulation can iframe it from the same
 * origin — no second dev server, nothing served off a developer's machine.
 *
 * `base` must match where the shell is hosted (../vite.config.ts:
 * /ai-demos/simulation-engineering/) plus this sim/ subfolder; every content
 * URL in src/ resolves against it through src/base.ts.
 */
export default defineConfig({
  base: process.env.SIM_BASE ?? '/ai-demos/simulation-engineering/sim/',
  build: {
    outDir: '../public/sim',
    emptyOutDir: true,
  },
  server: { port: 5180 },
});
