// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deployed as static files on GitHub Pages under /ai-demos/swiftriver/, so:
//  - nitro is off: we ship prerendered HTML, there is no server at runtime.
//  - prerender crawls every route into a real .html file (deep links work on Pages
//    without the usual SPA 404.html fallback).
//  - base must match the Pages subpath; src/router.tsx reads it via BASE_URL.
export default defineConfig({
  nitro: false,
  vite: { base: "/ai-demos/swiftriver/" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    prerender: { enabled: true, crawlLinks: true, failOnError: true },
  },
});
