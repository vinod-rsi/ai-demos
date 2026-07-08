# Simulation Engineering — Lesson 10 (Swift River UI) — Design

**Date:** 2026-07-08
**Status:** Approved (design), pending implementation plan
**Owner:** Vinod Patil

## Purpose

A standalone, shareable demo that reproduces the **Simulations** product experience
for **Lesson 10: Dosage Calculations and Medication Errors (ATI Engage: Pharmacology)**
by:

1. Reusing the **Swift River demo's design system and shell** (Tailwind v4 + oklch
   semantic tokens, shadcn primitives, `AppLayout` / `StatusBadge` / `AiCard`),
   rebranded as **Simulations / ATI Engage: Pharmacology**.
2. Embedding the **real Three.js Lesson 10 simulation** (the `threejs-port` browser
   port of the Unity course) where Swift River previously had a fake text-based case.
3. Layering two AI overlays from the *Ascend AI Feature Overlap Report*:
   - **Adaptive Debrief** (Swift River pattern) — reuse the existing `/debrief` route.
   - **Mastery & Forgetfulness** (BoardVitals pattern) — new persistent right-rail card.

This replaces the earlier plan to mimic the raw SimMoodle LMS chrome from the
screenshot. The Swift River visual language supersedes the Moodle look, and the
"plain static HTML" stack decision is superseded by the Vite + React + Tailwind
stack required to faithfully adopt that design system.

## Non-goals (YAGNI)

- No new faculty/cohort AI work beyond what Swift River already ships.
- No in-sim Socratic copilot.
- No real LLM integration — all AI content is static mock data (consistent with the
  rest of the AI-demos portfolio, which is front-end only).
- No modifications to the `threejs-port` project — it is embedded read-only via iframe.
- No real Moodle/LMS routing or persistence beyond in-page React state.

## Build approach

**Standalone copy.** Duplicate the existing `swiftriver` project into
`simulation-engineering/`, then modify. Duplicating (rather than hand-porting)
guarantees the Tailwind v4 `@theme` / `@source` directives, shadcn primitives, and
TanStack Start scaffolding work without re-derivation.

- Runs on its own dev server: **port 5186** (siblings occupy 5173–5185; `threejs-port`
  uses 5180).
- Embeds the Three.js sim from **`http://localhost:5180`** — the `threejs-port` dev
  server (`npm run dev`) must be running for the sim to load.

## Components / structure

Reused from Swift River (copied, mostly unchanged):

- `src/styles.css` — the oklch design-token system (tones: `ai`, `critical`,
  `warning`, `success`, `info`, `primary`; gradients `gradient-ai`, `gradient-hero`).
- `src/components/ui/*` — shadcn primitives.
- `src/components/prototype/AppLayout.tsx`, `StatusBadge.tsx`, `AiCard.tsx`, `StatCard.tsx`.
- `src/routes/__root.tsx`, `router.tsx`, `server.ts`, `start.ts`, TanStack scaffolding.
- `src/routes/faculty.tsx`, `admin.tsx`, `author.tsx`, `settings.tsx`, `index.tsx` —
  kept as-is (free demo depth); primary flow is the student sim page.

Changed / new:

### 1. Shell — rebranded `AppLayout`

- Sidebar brand: **◈ Simulations · Adaptive Sim Engine** (replaces "Swift River").
- Top bar unchanged: search, **"AI Engine · Live"** badge, notifications, role switcher.
- Student nav: Overview · My Simulations · Debrief & Remediation · Settings.

### 2. Sim page — `src/routes/student.simulation.tsx` (rewritten)

The core change. Replaces the fake text case with the embedded real sim.

- **Breadcrumb:** ATI Engage: Pharmacology / Lesson 10 — Dosage Calculations & Medication Errors.
- **Progress bar + live Adaptive status badge** (Swift River style).
- **Two-column layout** (`lg:grid-cols-[1fr_320px]`):
  - **Left — real sim:** a `Card` wrapping
    `<iframe src="http://localhost:5180" title="Lesson 10 Simulation">`, with the
    faithful **"Welcome back, would you like to continue where you left off?"**
    modal (Continue / Start over) overlaid on top. Dismissing the modal reveals the
    live sim and sets `runStarted = true`. If `:5180` is unreachable, show a styled
    "Start the sim server (:5180)" placeholder in the black-box state.
  - **Right rail (persistent):**
    - **Adaptive Engine** panel — reuse the `bg-ai-muted` "why the sim is adjusting"
      card.
    - **Mastery & Forgetfulness** card (new) — concept pills with state
      (`● Strong` / `◐ Fragile` / `⚠ At-risk`): *Unit conversions*, *IV drip rate*,
      *Pediatric weight-based dosing*; a **Forgetfulness Forecast** line
      ("Last correct: 12 days ago · Topic difficulty: high · Reviewed once"); and a
      **Next-best-action** button ("Review set: Pediatric dosing · 8 items").
- **Completion card** (reuse `CompletionView` style) — appears when the run is marked
  complete: CJMI/score tiles + **"View full debrief →"** link to `/debrief`.

### 3. Adaptive Debrief — `src/routes/debrief.tsx` (reused, re-themed)

Keep the existing layout (decision timeline, missed cues, judgment radar, reflection
questions, AI remediation plan). Swap content from Post-Op Sepsis to Lesson 10
dosage-calc context:

- Timeline steps → dosage-calc decision points.
- Missed cues → e.g. "mis-placed decimal on pediatric dose", "unit mismatch mg vs mcg".
- Reflection questions → dosage-calc reasoning prompts.
- Remediation → e.g. "Dimensional-analysis drill", "High-alert medication safety module".

### 4. Mock data — `src/lib/mock-data.ts` (extended)

Add Pharmacology concept-mastery states, forgetfulness-forecast entries, and the
Lesson 10 debrief content (timeline, missed cues, reflection questions, remediation,
judgment-radar skills). Static only.

## State & data flow

- Sim page holds React state `{ modalDismissed, runStarted, runComplete }`.
- Dismissing the Welcome-back modal → `runStarted = true` (reveals iframe).
- Marking the run complete → `runComplete = true` (shows Completion card + debrief link).
- Mastery rail and Adaptive Engine panel render from static `mock-data.ts`.
- All AI content is deterministic mock data; no network/LLM calls.

## Reconciliation of earlier decisions

| Earlier decision | Revised |
|---|---|
| Mimic SimMoodle chrome | Adopt Swift River shell, rebranded Simulations/ATI |
| Plain static HTML/CSS/JS | Vite + React + Tailwind (copied from swiftriver) |
| AI Debrief as a 4th tab | Reuse Swift River's dedicated `/debrief` page, linked post-run |
| Mastery persistent right rail | Unchanged — persistent right-rail card |
| Live iframe → :5180 | Unchanged |
| Student persona | Unchanged (faculty/admin/author pages kept but secondary) |

## Success criteria

- `simulation-engineering/` runs on `:5186` and renders the Swift River-styled shell
  rebranded to Simulations / ATI Engage: Pharmacology.
- The student sim page embeds the live Three.js sim from `:5180` behind the
  Welcome-back modal; dismissing the modal reveals the playable sim.
- The persistent right rail shows the Adaptive Engine panel + Mastery/Forgetfulness card.
- Completing the run surfaces a completion card linking to a Lesson 10-themed
  Adaptive Debrief at `/debrief`.
- No console errors; no changes made to the `threejs-port` project.
