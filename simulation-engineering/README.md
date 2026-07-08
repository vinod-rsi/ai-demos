# Simulation Engineering — Lesson 10 Demo

Standalone demo reusing the **Swift River** design system, rebranded as
**Simulations / ATI Engage: Pharmacology**, that embeds the real Three.js
**Lesson 10: Dosage Calculations & Medication Errors** simulation with an
adaptive-engine + mastery rail and an AI debrief.

## Run

Two dev servers are needed — the embedded sim and this shell:

1. **The simulation engine** (the embedded iframe source, port `5180`):
   ```bash
   cd /Users/vinodpatil/Projects/unity/ATIENGPH_DME_10_Unity/threejs-port
   npm install && npm run dev        # http://localhost:5180
   ```

2. **This demo shell** (port `5186`):
   ```bash
   bun install && bun run dev --port 5186 --strictPort   # http://localhost:5186
   ```

Then open **http://localhost:5186/student/simulation**.

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
- The `threejs-port` project is embedded read-only via iframe and is never modified.
- The pre-existing faculty / admin / author pages from the Swift River shell remain
  available via the role switcher; the primary flow is the student sim page.
