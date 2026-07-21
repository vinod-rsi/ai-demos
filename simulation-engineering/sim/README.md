# ATIENGPH_DME_10 — Three.js Port (embedded sim)

Browser-native port of the Unity WebGL course **"Pharmacology: Dosage
Calculations and Medication Errors"** (`atiengph_dme_10`). The Konverse
dialogue engine is re-implemented in TypeScript and plays the **real course
data** (JSON + WAV + FBX) exported out of the Unity project.

This is the simulation the demo shell iframes at `/student/simulation`. It
builds to `../public/sim/`, so the deployed demo serves it from its own origin
— there is no dev server to start and nothing pointing at `localhost`.

## Build / run

```bash
bun install
bun run build      # → ../public/sim (what the shell ships)
bun run dev        # http://localhost:5180, standalone
bun run typecheck
```

`bun run build` in the parent demo runs this build first (`build:sim`), so a
plain `bun run build` in `simulation-engineering/` produces everything.

## Course content

The Unity project is not a dependency of the build. `public/unity/` holds an
imported copy of exactly what the sim fetches — logic JSON, dialogue audio,
markup, key config, MGFX sprites, and the character/environment FBX + textures.
Re-import it after the Unity course changes:

```bash
bun run import-assets                      # defaults to the known Unity path
bun run import-assets -- /path/to/ATIENGPH_DME_10_Unity
```

The import (`scripts/import-unity-assets.mjs`) also:

- transcodes dialogue WAVs to 16-bit/22.05 kHz mono (~68 MB → ~23 MB) — needs
  `ffmpeg`;
- copies the animation takes under plain file names, because Unity's originals
  contain `! # & $`;
- writes `unity/logic/Nodes/__list.json`, since a static host can't answer the
  directory listing the loader used to rely on.

Every content URL resolves through `src/base.ts` against `import.meta.env.BASE_URL`,
which is why the same bundle works at `/` in dev and under
`/ai-demos/simulation-engineering/sim/` in production (`vite.config.ts`,
overridable with `SIM_BASE`).

## What works (vertical slice)

- Full Konverse engine port: node graph traversal, RPN-equivalent expression
  conditions, linkages, variables + gates, lifetimes, tactics-grouped choice
  menus, coach feedback with `$value()/$text()` substitution, the insulin
  slider activities, end-of-conversation + dashboard variable text.
- Voice playback of the real WAV clips (explicit + auto-assigned clip names),
  with `[br]`-timed captions and amplitude-driven lip level.
- **Real Unity assets in Three.js**: the PHARM_T3_env baked backdrop and the
  textured Rebecca rig (with her idle animation) load from the imported FBX at
  runtime; procedural placeholders remain as automatic fallback. Converted GLBs
  are preferred when listed in `public/models/__list.json` (see
  `scripts/convert-assets.md`).
- Ending/feedback screen from the dashboard variables, running score meter
  (B key), transcript view, history/undo (`U`), suspend/resume through the
  LMS boundary (localStorage; xAPI adapter skeleton for production).
- Keyboard commands per `KAT-BackpackConfig.json` (arrows/space/enter select,
  -/+ volume, V mute, C captions, F fullscreen, P pause, T thoughts,
  B score meter).

## Layout

```
src/base.ts       base-URL resolution for every content fetch
src/content       loader + raw types + localization
src/conversation  the Konverse engine port (expression/, engine, logic, ...)
src/scene         Three.js runtime, asset registry, stage
src/performance   Gossamer/Timeline replacement interfaces (lip-sync etc.)
src/audio         WAV dialogue playback
src/lms           LMS/xAPI/suspend-data boundary
src/input         command bus + Unity key-mapping
src/ui            side panel, choices, coach overlay, captions, debug
public/unity      imported course content (see above)
scripts           import-unity-assets.mjs, convert-assets.md
docs              MIGRATION_HARD_PARTS.md, NEXT_MODEL_TASKS.md, plans/
```

Read `docs/MIGRATION_HARD_PARTS.md` before changing engine semantics. The
original project (with its vitest suites and Unity-path dev middleware) lives
at `ATIENGPH_DME_10_Unity/threejs-port`; this copy is the shippable one.
