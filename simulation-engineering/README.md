# Simulation Engineering — Lesson 10 Demo

Standalone demo reusing the **Swift River** design system, rebranded as
**Simulations / ATI Engage: Pharmacology**, that embeds the real Three.js
**Lesson 10: Dosage Calculations & Medication Errors** simulation with an
adaptive-engine + mastery rail and an AI debrief.

## Run

The sim ships inside this app (`sim/` → `public/sim/`), so one server is enough:

```bash
bun install
bun run build:sim                                    # once, or after changing sim/
bun run dev --port 5186 --strictPort                 # http://localhost:5186
```

Then open **http://localhost:5186/student/simulation**. `bun run build` runs the
sim build first, so the production build needs no extra step.

## What to demo

- **Sim page** (`/student/simulation`) — the real Three.js Lesson 10 sim loads
  behind a "Welcome back… Continue / Start over" modal. Dismiss it to play. The
  persistent right rail shows the **Adaptive Engine** panel, **Concept mastery**
  pills (Strong / Fragile / At-risk), the **Forgetfulness Forecast** with
  explainability, and a **next-best-action** button. "Mark run complete" reveals a
  completion card linking to the debrief.
- **Debrief** (`/debrief`) — decision timeline, missed cues, judgment-profile
  radar, AI reflection questions, and an AI-recommended remediation plan, all themed
  to dosage-calculation / medication-error content.

## Notes

- All AI content is static mock data (`src/lib/mock-data.ts`) — no LLM calls.
- The Three.js sim is vendored in `sim/` (engine + imported Unity course content)
  and built to `public/sim/`, which is git-ignored. It is iframed same-origin, so
  the deployed demo has no dependency on a local server — see `sim/README.md` for
  how to re-import course assets from the Unity project.
- The pre-existing faculty / admin / author pages from the Swift River shell remain
  available via the role switcher; the primary flow is the student sim page.
