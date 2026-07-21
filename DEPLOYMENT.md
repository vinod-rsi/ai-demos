# Hosting the AI demos on GitHub Pages

Plan and verified recipe for publishing all eight demos together as one static site.

**Status:** recipe proven end-to-end on `swiftriver`. Not yet applied to the other seven.

---

## Why GitHub Pages works here

The demos looked like they'd need a server — six of the eight are TanStack Start apps
with Nitro SSR, and `vite build` produces a Cloudflare Worker rather than a folder of
HTML. But an audit found **no server-side dependencies at all**:

- zero `createServerFn`
- zero server routes (`createServerFileRoute` / `createAPIFileRoute`)
- zero route `loader`s

All data comes from client-side mock data. The `server.ts` / `start.ts` files are purely
SSR error-handling boilerplate. So the apps are genuinely prerenderable, and Pages is a
real option rather than a compromise.

A useful side effect: because every route becomes a real `.html` file, deep links and
hard refreshes work without the usual SPA `404.html` fallback hack.

## Inventory

| Demo | Type | Routes | Work needed |
|---|---|---|---|
| `fisdap` | TanStack Start | 3 (1 dynamic) | prerender + base; dynamic route needs checking |
| `jbl` | TanStack Start | 2 | prerender + base |
| `lab-assistant` | TanStack Start | 2 | prerender + base |
| `live-lab-session` | TanStack Start | 3 | prerender + base |
| `simulation-engineering` | TanStack Start | 10 | prerender + base; plus the vendored Three.js sim in `sim/` |
| `swiftriver` | TanStack Start | 10 | **done** |
| `boardvitals` | single `index.html` (96K) | — | copy as-is |
| `mytipreport/…/competency-app` | plain Vite SPA | — | `base` only |

Relevant versions: `@tanstack/react-start` 1.168.26, `@tanstack/react-router` 1.170.16,
Vite 8.0.16, Nitro 3.0.260603-beta.

---

## The recipe

Each Start app needs two edits.

### 1. `vite.config.ts`

The Vite config is a Lovable wrapper (`@lovable.dev/vite-tanstack-config`) that bundles
`tanstackStart`, `viteReact`, `tailwindcss` and Nitro internally. It must not have plugins
added manually, but it does expose `nitro`, `vite` and `tanstackStart` passthrough options —
so no ejecting is required.

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  vite: { base: "/ai-demos/<demo-name>/" },
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true, crawlLinks: true, failOnError: true },
  },
});
```

### 2. `src/router.tsx`

```ts
const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  // …existing options
});
```

`BASE_URL` mirrors the `base` from `vite.config.ts`, and is `/` in dev — so local
development is unaffected.

### Output

`dist/client/` is the deployable folder. `dist/server/` is a build-time artifact used by
the prerenderer and should **not** be published.

---

## Two traps

### `nitro: false` is load-bearing

The obvious approach — Nitro's `static` preset — does not work. Nitro and TanStack Start
each ship their own prerenderer and they fight:

```
[nitro] ℹ Prerendering 1 initial routes with crawler
[nitro]   ├─ / (3ms)
  │ └── [404] Not Found
[nitro] ℹ Prerendered 0 routes
error during build:
rollupOptions.input should not be an html file when building for SSR.
```

Keeping Nitro on its default Cloudflare preset fails differently — it writes
`.output/server/index.mjs`, while TanStack's prerender preview server tries to import
`dist/server/server.js`:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/dist/server/server.js'
```

Disabling Nitro entirely lets TanStack Start emit its own `dist/` layout, which is exactly
what its prerenderer expects.

### Redundant crawling

With `basepath` set, the crawler follows both prefixed and unprefixed link variants, so it
renders 14 pages to produce 8 files. Wasteful but harmless — output is correct.

---

## Verification performed on `swiftriver`

Built, then served `dist/client/` under `/ai-demos/swiftriver/` on a local static server:

- 8 HTML files generated: `/`, `/admin`, `/author`, `/debrief`, `/faculty`, `/settings`,
  `/student`, `/student/simulation`
- root, `/faculty/` and `/student/simulation/` deep links → all `200`
- CSS and JS assets → `200`, all under `/ai-demos/swiftriver/assets/…`
- zero asset references outside the base path (these would 404 on Pages)
- browser load: no console errors, page hydrated, nav links correctly prefixed
- `/faculty/` deep link renders fully (roster, heatmap, debrief questions, remediation groups)

---

## Remaining work

1. Apply the recipe to `fisdap`, `jbl`, `lab-assistant`, `live-lab-session`,
   `simulation-engineering`.
2. Handle `fisdap`'s dynamic route — `crawlLinks` only reaches it if something links to it;
   otherwise it needs an explicit `pages` entry in the prerender config.
3. Add `base` to `mytipreport/…/competency-app`. As an unprerendered SPA it also needs a
   `404.html` fallback for deep links, unless only its root URL is ever linked.
4. Copy `boardvitals/index.html` through as-is.
5. Build a landing page linking to all eight.
6. Add a GitHub Actions workflow that builds each demo and merges the outputs into one
   Pages artifact.

## Open questions

- **Repo name and account.** The base path is baked into each build, so this must be fixed
  before rolling out. Assumed `vinodpatil/ai-demos` → `vinodpatil.github.io/ai-demos/<demo>/`.
- ~~**The Three.js sim.**~~ Resolved: vendored into `simulation-engineering/sim/`
  (engine source + the Unity course content it fetches, ~58 MB under `sim/public/unity`).
  It builds to `simulation-engineering/public/sim/` — chained from that app's `build`
  script, so CI needs no extra step — and the sim page iframes it same-origin at
  `<base>/sim/index.html`. Nothing resolves to `localhost` any more. See
  `simulation-engineering/sim/README.md`.
- **No git remote.** This repo isn't on GitHub yet.
- **Public by default.** Pages on a private repo requires GitHub Enterprise Cloud.
  Confirmed acceptable — these are demos, not confidential material.

## Uncommitted work

`jbl` has modifications in `AdminView.tsx`, `DemoContext.tsx`, `InstructorView.tsx`,
`SalesOpsView.tsx`, `StudentView.tsx`, `mockData.ts`, plus an untracked `Provenance.tsx`.
Left untouched; not part of this migration.
