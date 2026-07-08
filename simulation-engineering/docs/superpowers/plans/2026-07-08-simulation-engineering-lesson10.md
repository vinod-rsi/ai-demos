# Simulation Engineering — Lesson 10 (Swift River UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a standalone Vite+React demo that reuses the Swift River design system, rebranded as Simulations / ATI Engage: Pharmacology, embedding the real Three.js Lesson 10 sim with an Adaptive-Engine + Mastery/Forgetfulness rail and a Lesson 10-themed Adaptive Debrief.

**Architecture:** Duplicate the working `swiftriver` TanStack Start project into `simulation-engineering/`, then modify four surfaces: the shell brand (`AppLayout`), the sim page (`student.simulation.tsx`, rewritten to embed an iframe to `localhost:5180`), the debrief page (`debrief.tsx`, re-themed), and mock data (`lib/mock-data.ts`, extended with Pharmacology content). All AI content is static mock data; the `threejs-port` project is embedded read-only and never modified.

**Tech Stack:** Vite, React 18, TanStack Start/Router, Tailwind v4 (oklch tokens), shadcn/radix, lucide-react, recharts, sonner, Bun.

## Global Constraints

- Do NOT modify anything under `/Users/vinodpatil/Projects/unity/ATIENGPH_DME_10_Unity/threejs-port` — embed only.
- No real LLM/network calls — all AI content is static mock data in `src/lib/mock-data.ts`.
- The embedded sim iframe src is exactly `http://localhost:5180` (the `threejs-port` dev server).
- The new app's own dev server runs on port `5186` (siblings use 5173–5185; threejs-port uses 5180).
- No test runner exists in this stack; per-task verification is `bunx tsc --noEmit` (typecheck) + `bun run build` and/or a manual browser load. Do not invent a test framework.
- Package manager is Bun (`bun install`, `bun run …`).
- Use the existing design tokens/components (`StatusBadge`, `AiCard`, `Card`, `Button`, tone classes `ai/critical/warning/success/info/primary`) — do not introduce new color systems.

---

### Task 1: Scaffold — duplicate swiftriver into simulation-engineering

**Files:**
- Create: entire `simulation-engineering/` tree copied from `swiftriver/` (excluding `node_modules`)
- Modify: `simulation-engineering/package.json` (name)
- Modify: `simulation-engineering/.lovable/project.json` (leave as-is; informational)
- Keep: `simulation-engineering/docs/` (already contains the spec + this plan)

**Interfaces:**
- Produces: a runnable Vite app at `simulation-engineering/` with all Swift River routes/components/design system intact.

- [ ] **Step 1: Copy the project (excluding node_modules and existing docs collision)**

Run from `/Users/vinodpatil/Projects/other-products/AI demos`:
```bash
rsync -a --exclude 'node_modules' --exclude 'docs' swiftriver/ simulation-engineering/
```
(The `--exclude 'docs'` preserves the spec/plan already in `simulation-engineering/docs`. `swiftriver` has no `docs` dir, so nothing is lost.)

- [ ] **Step 2: Rename the package**

Edit `simulation-engineering/package.json` line 2:
```json
  "name": "simulation-engineering",
```

- [ ] **Step 3: Install dependencies**

Run: `cd "simulation-engineering" && bun install`
Expected: completes with no error; `node_modules/` created.

- [ ] **Step 4: Typecheck the untouched copy**

Run: `cd "simulation-engineering" && bunx tsc --noEmit`
Expected: exits 0 (same as swiftriver — a clean baseline before edits).

- [ ] **Step 5: Verify it boots on port 5186**

Run: `cd "simulation-engineering" && bun run dev --port 5186 --strictPort` (background), then:
```bash
sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5186/
```
Expected: `200`. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering
git commit -m "feat(sim-eng): scaffold from swiftriver design system"
```

---

### Task 2: Rebrand the shell to Simulations / ATI

**Files:**
- Modify: `simulation-engineering/src/components/prototype/AppLayout.tsx` (brand block ~lines 84–93; mobile logo ~141–145)
- Modify: `simulation-engineering/src/lib/role-context.tsx` (STORAGE_KEY line: `const STORAGE_KEY = "swiftriver.role";`)

**Interfaces:**
- Consumes: `AppLayout` from Task 1.
- Produces: shell branded "Simulations / Adaptive Sim Engine"; unchanged nav/role APIs.

- [ ] **Step 1: Swap the sidebar brand icon + text**

In `AppLayout.tsx`, the import line 15 changes `Waves` usage. Replace the sidebar brand block (the `<div className="flex items-center gap-2.5 px-5 py-5">…</div>`) so the icon is `Activity` (already imported) and the text reads:
```tsx
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/90 text-sidebar-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Simulations</p>
            <p className="text-[11px] text-sidebar-foreground/70">Adaptive Sim Engine · ATI</p>
          </div>
        </div>
```

- [ ] **Step 2: Swap the mobile logo icon**

Replace the mobile `<Waves … />` inside the `lg:hidden` link (top bar) with `<Activity className="h-4.5 w-4.5" />`. If `Waves` becomes unused, remove it from the lucide import on lines 3–17 to keep the lint clean.

- [ ] **Step 3: Rename the role storage key**

In `role-context.tsx`, change:
```tsx
const STORAGE_KEY = "simulations.role";
```

- [ ] **Step 4: Typecheck**

Run: `cd "simulation-engineering" && bunx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering/src/components/prototype/AppLayout.tsx simulation-engineering/src/lib/role-context.tsx
git commit -m "feat(sim-eng): rebrand shell to Simulations / ATI"
```

---

### Task 3: Extend mock data with Lesson 10 Pharmacology content

**Files:**
- Modify: `simulation-engineering/src/lib/mock-data.ts` (append new exports at end)

**Interfaces:**
- Produces (all consumed by Tasks 4 & 5):
  - `export type MasteryState = "strong" | "fragile" | "at_risk";`
  - `export const masteryMeta: Record<MasteryState, { label: string; tone: string; glyph: string }>`
  - `export interface ConceptMastery { concept: string; state: MasteryState; detail: string; }`
  - `export const lesson10Mastery: ConceptMastery[]`
  - `export interface ForgetForecast { topic: string; risk: "high" | "medium" | "low"; explain: string; }`
  - `export const lesson10Forecast: ForgetForecast[]`
  - `export const lesson10NextBestAction: { label: string; detail: string }`
  - `export const lesson10DebriefTimeline: { t: string; step: string; result: string; detail: string; tone: string }[]`
  - `export const lesson10MissedCues: { cue: string; when: string; impact: string }[]`
  - `export const lesson10DebriefQuestions: string[]`
  - `export const lesson10Remediation: { title: string; type: string; mins: number; focus: string; tone: string }[]`
  - `export const lesson10Skills: { skill: string; score: number }[]`

- [ ] **Step 1: Append the mock data**

Add to the end of `mock-data.ts`:
```ts
// ── Lesson 10: Dosage Calculations & Medication Errors (Pharmacology) ──────────

export type MasteryState = "strong" | "fragile" | "at_risk";

export const masteryMeta: Record<MasteryState, { label: string; tone: string; glyph: string }> = {
  strong: { label: "Strong", tone: "success", glyph: "●" },
  fragile: { label: "Fragile", tone: "warning", glyph: "◐" },
  at_risk: { label: "At risk", tone: "critical", glyph: "⚠" },
};

export interface ConceptMastery {
  concept: string;
  state: MasteryState;
  detail: string;
}

export const lesson10Mastery: ConceptMastery[] = [
  { concept: "Unit conversions (mg ↔ mcg ↔ g)", state: "strong", detail: "6/6 correct across last 3 sessions" },
  { concept: "IV drip rate (gtt/min)", state: "fragile", detail: "Correct but slow; 1 recent slip on drop factor" },
  { concept: "Pediatric weight-based dosing", state: "at_risk", detail: "2 of last 3 attempts exceeded safe range" },
  { concept: "Decimal placement & rounding", state: "fragile", detail: "Trailing-zero error flagged once" },
];

export interface ForgetForecast {
  topic: string;
  risk: "high" | "medium" | "low";
  explain: string;
}

export const lesson10Forecast: ForgetForecast[] = [
  { topic: "Pediatric weight-based dosing", risk: "high", explain: "Last correct: 12 days ago · Topic difficulty: high · Reviewed once" },
  { topic: "IV drip rate (gtt/min)", risk: "medium", explain: "Last correct: 6 days ago · Topic difficulty: medium · Reviewed twice" },
];

export const lesson10NextBestAction = {
  label: "Start review set: Pediatric dosing",
  detail: "8 items · targets your highest decay risk",
};

export const lesson10DebriefTimeline = [
  { t: "0:00", step: "Order interpretation", result: "correct", detail: "Correctly parsed the ordered dose and available concentration", tone: "success" },
  { t: "1:48", step: "Pediatric dose calculation", result: "error", detail: "Mis-placed the decimal — computed 25 mg instead of 2.5 mg", tone: "critical" },
  { t: "4:12", step: "High-alert double-check", result: "partial", detail: "Recognized the med as high-alert but skipped the independent second-check", tone: "warning" },
];

export const lesson10MissedCues = [
  { cue: "Weight-based safe-range mismatch", when: "Pediatric calculation", impact: "High" },
  { cue: "High-alert medication flag", when: "Verification", impact: "High" },
  { cue: "Trailing zero on the MAR", when: "Documentation", impact: "Medium" },
];

export const lesson10DebriefQuestions = [
  "You read the order correctly — walk through where the decimal shifted, and what check would have caught it before administration.",
  "This medication is high-alert. What is the independent double-check protocol, and at which step should it have happened?",
  "Rewrite the pediatric dose using dimensional analysis. Which unit cancels first, and how does that guard against a 10× error?",
];

export const lesson10Remediation = [
  { title: "Dimensional-Analysis Drill", type: "Guided practice", mins: 12, focus: "Decimal & unit safety", tone: "critical" },
  { title: "High-Alert Medication Safety", type: "Interactive module", mins: 10, focus: "Independent double-check", tone: "warning" },
  { title: "Replay: Pediatric Dosing (Advanced)", type: "Adaptive scenario", mins: 20, focus: "Apply under pressure", tone: "ai" },
];

export const lesson10Skills = [
  { skill: "Order interpretation", score: 88 },
  { skill: "Unit conversion", score: 82 },
  { skill: "Decimal accuracy", score: 54 },
  { skill: "Safe-range check", score: 60 },
  { skill: "High-alert protocol", score: 66 },
];
```

- [ ] **Step 2: Typecheck**

Run: `cd "simulation-engineering" && bunx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering/src/lib/mock-data.ts
git commit -m "feat(sim-eng): add Lesson 10 pharmacology mock data"
```

---

### Task 4: Rewrite the sim page to embed the Three.js sim + Mastery rail

**Files:**
- Modify (full rewrite of component body): `simulation-engineering/src/routes/student.simulation.tsx`

**Interfaces:**
- Consumes: `lesson10Mastery`, `masteryMeta`, `lesson10Forecast`, `lesson10NextBestAction` from Task 3; `AppLayout`, `StatusBadge`, `AiCard`, `Card`, `Button`, `Progress`.
- Produces: route `/student/simulation` rendering the embedded sim + persistent right rail + completion card linking to `/debrief`.

- [ ] **Step 1: Replace the file contents**

Overwrite `student.simulation.tsx` with:
```tsx
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, ChevronRight, ArrowRight, Check, Activity, ShieldCheck,
  Lightbulb, RefreshCw, ClipboardCheck, TrendingDown, Play,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  lesson10Mastery, masteryMeta, lesson10Forecast, lesson10NextBestAction,
} from "@/lib/mock-data";
import { toast } from "sonner";

const SIM_URL = "http://localhost:5180";

export const Route = createFileRoute("/student/simulation")({
  head: () => ({ meta: [{ title: "Lesson 10 — Dosage Calculations & Medication Errors" }] }),
  component: SimulationPage,
});

function SimulationPage() {
  // "modal" = welcome-back shown; "running" = sim revealed; "complete" = finished
  const [phase, setPhase] = useState<"modal" | "running" | "complete">("modal");
  const progress = phase === "complete" ? 100 : phase === "running" ? 45 : 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/student" className="hover:text-foreground">My Simulations</Link>
          <ChevronRight className="h-4 w-4" />
          <span>ATI Engage: Pharmacology</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Lesson 10 — Dosage Calculations & Medication Errors</span>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
          A role-play clinical scenario. The adaptive engine tracks your dosage-calculation
          decisions, timing, and confidence, then updates your mastery profile and debrief.
        </p>

        {/* Progress + adaptive badge */}
        <div className="mt-4 flex items-center gap-4">
          <Progress value={progress} className="h-2 flex-1" />
          <StatusBadge tone="ai" dot>
            <Sparkles className="h-3 w-3" /> Adaptive · Live
          </StatusBadge>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: the embedded sim */}
          <div className="space-y-5">
            <Card className="gap-0 overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Play className="h-4 w-4 text-primary" /> Simulation
                </div>
                <StatusBadge tone={phase === "complete" ? "success" : "info"} dot>
                  {phase === "complete" ? "Completed" : phase === "running" ? "In progress" : "Ready"}
                </StatusBadge>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {/* The real Three.js sim */}
                <iframe
                  src={SIM_URL}
                  title="Lesson 10 Simulation"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; fullscreen"
                />

                {/* Welcome-back modal overlay */}
                {phase === "modal" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <div className="w-[min(420px,90%)] rounded-2xl bg-card p-6 text-center shadow-panel">
                      <p className="text-sm text-foreground/90">
                        Welcome back, would you like to continue where you left off?
                      </p>
                      <div className="mt-5 flex justify-center gap-3">
                        <Button onClick={() => setPhase("running")} className="min-w-28">Continue</Button>
                        <Button variant="outline" onClick={() => setPhase("running")} className="min-w-28">
                          Start over
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls under the sim */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sim runs from the local engine at <code className="rounded bg-secondary px-1">:5180</code> — start it if the frame is blank.
              </p>
              {phase === "running" && (
                <Button size="sm" className="gap-2" onClick={() => setPhase("complete")}>
                  Mark run complete <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Completion card */}
            {phase === "complete" && (
              <Card className="gap-0 overflow-hidden p-0">
                <div className="bg-gradient-hero px-6 py-8 text-center text-white">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-7 w-7" />
                  </span>
                  <h2 className="mt-3 text-xl font-semibold">Simulation complete</h2>
                  <p className="mt-1 text-sm text-white/80">Lesson 10 · Adaptive mode</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { l: "Case CJMI", v: 71 },
                      { l: "Decisions correct", v: "2/3" },
                      { l: "Time", v: "6:38" },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                        <p className="text-2xl font-bold tabular-nums">{s.v}</p>
                        <p className="text-xs text-muted-foreground">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <AiCard title="AI Debrief Summary" className="mt-5 text-left">
                    You interpreted the order correctly but a decimal-placement slip produced a 10× pediatric
                    overdose, and the high-alert double-check was skipped. The engine has queued a
                    dimensional-analysis drill and a high-alert safety module and flagged pediatric dosing as
                    at-risk in your mastery profile.
                  </AiCard>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button asChild className="gap-2">
                      <Link to="/debrief">View full debrief <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setPhase("modal")}>
                      <RefreshCw className="h-4 w-4" /> Replay
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right rail: Adaptive engine + Mastery */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Adaptive engine */}
            <div className="rounded-xl border border-ai/20 bg-ai-muted/50 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-ai text-ai-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ai">Adaptive Engine</p>
                  <p className="text-[11px] text-muted-foreground">Why the sim is adjusting</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-ai/15 bg-card/70 p-3 text-sm leading-relaxed">
                {phase === "complete"
                  ? "Pediatric dosing flagged after this run — I'll add scaffolding and a slower pace on your next weight-based case."
                  : "Difficulty is tuned live to your decisions. Hints are held back on strong concepts and added where you slip."}
              </div>
            </div>

            {/* Mastery & Forgetfulness */}
            <Card className="gap-0 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-primary" /> Concept mastery
              </h3>
              <div className="mt-3 space-y-2">
                {lesson10Mastery.map((m) => {
                  const meta = masteryMeta[m.state];
                  return (
                    <div key={m.concept} className="rounded-lg border border-border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{m.concept}</p>
                        <StatusBadge tone={meta.tone}>
                          <span aria-hidden>{meta.glyph}</span> {meta.label}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{m.detail}</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold">
                <TrendingDown className="h-4 w-4 text-critical" /> Forgetfulness forecast
              </h3>
              <div className="mt-3 space-y-2">
                {lesson10Forecast.map((f) => (
                  <div key={f.topic} className="rounded-lg bg-secondary/50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{f.topic}</p>
                      <StatusBadge tone={f.risk === "high" ? "critical" : f.risk === "medium" ? "warning" : "info"}>
                        {f.risk} risk
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{f.explain}</p>
                  </div>
                ))}
              </div>

              <Button
                className="mt-4 w-full gap-2"
                onClick={() => toast.success(lesson10NextBestAction.label, { description: lesson10NextBestAction.detail })}
              >
                <Lightbulb className="h-4 w-4" /> {lesson10NextBestAction.label}
              </Button>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5" /> Next-best-action · targets highest decay risk
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "simulation-engineering" && bunx tsc --noEmit`
Expected: exits 0. (If lucide reports a missing icon name, swap it for an existing one — all icons used here exist in lucide-react.)

- [ ] **Step 3: Manual load check**

Start the app: `cd "simulation-engineering" && bun run dev --port 5186 --strictPort` (background).
Open `http://localhost:5186/student/simulation`. Confirm: breadcrumb reads Lesson 10, the black sim frame shows the Welcome-back modal, the right rail shows Concept mastery pills + Forgetfulness forecast + the next-best-action button. Click Continue → modal disappears, "Mark run complete" appears. Click it → completion card with "View full debrief" link renders. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering/src/routes/student.simulation.tsx
git commit -m "feat(sim-eng): embed Three.js Lesson 10 sim + mastery rail"
```

---

### Task 5: Re-theme the debrief page to Lesson 10

**Files:**
- Modify: `simulation-engineering/src/routes/debrief.tsx` (replace the local `timeline`, `missedCues`, `debriefQs`, `remediation` consts and the `studentSkills` radar source with the Task 3 exports; retitle to Lesson 10)

**Interfaces:**
- Consumes: `lesson10DebriefTimeline`, `lesson10MissedCues`, `lesson10DebriefQuestions`, `lesson10Remediation`, `lesson10Skills` from Task 3.

- [ ] **Step 1: Replace the import and local data**

In `debrief.tsx`, change the mock-data import (line 29) from:
```tsx
import { studentSkills } from "@/lib/mock-data";
```
to:
```tsx
import {
  lesson10DebriefTimeline as timeline,
  lesson10MissedCues as missedCues,
  lesson10DebriefQuestions as debriefQs,
  lesson10Remediation as remediation,
  lesson10Skills,
} from "@/lib/mock-data";
```
Then DELETE the four local `const timeline`, `const missedCues`, `const debriefQs`, `const remediation` blocks (lines ~36–58), since they now come from imports.

Note: the timeline map uses `e.icon`. The imported `lesson10DebriefTimeline` has no `icon` field, so replace the icon usage. In the timeline map, change:
```tsx
<span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", `bg-${e.tone}-muted text-${e.tone}`)}>
  <e.icon className="h-4 w-4" />
</span>
```
to use a tone-derived icon:
```tsx
<span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", `bg-${e.tone}-muted text-${e.tone}`)}>
  {e.tone === "success" ? <Check className="h-4 w-4" /> : e.tone === "critical" ? <X className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
</span>
```
(`Check`, `X`, `CircleAlert` are already imported in this file.)

- [ ] **Step 2: Retitle the page + header badges**

Change the `head` title (line ~32) to `"Debrief & Remediation — Lesson 10"`. Change the `<h1>` (line ~71) to `Debrief — Lesson 10: Dosage Calculations & Medication Errors`. Update the sub-line (line ~72) to `Completed just now · Adaptive mode · 6:38` and the header StatusBadges (line ~76–77) to `CJMI 71` / `High-alert flag`.

- [ ] **Step 3: Point the radar at lesson10Skills**

In the `<RadarChart data={studentSkills} …>` (line ~135), change `data={studentSkills}` to `data={lesson10Skills}`.

- [ ] **Step 4: Update the AiCard summary copy**

Replace the `<AiCard title="AI Debrief Summary">` body (lines ~81–86) with:
```tsx
        <AiCard title="AI Debrief Summary" className="mt-5">
          You <strong>interpreted the order correctly</strong>, but a <strong>decimal-placement slip</strong> produced a
          10× pediatric overdose and the <strong>high-alert independent double-check was skipped</strong>. These are the
          exact gaps the two activities below target; a replay in advanced mode will confirm the fix. Pediatric dosing is
          now flagged <strong>at-risk</strong> in your mastery profile.
        </AiCard>
```

- [ ] **Step 5: Typecheck**

Run: `cd "simulation-engineering" && bunx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Manual load check**

With the dev server running, open `http://localhost:5186/debrief`. Confirm the timeline shows the order-interpretation / decimal-error / double-check steps, missed cues list the weight-based mismatch + high-alert flag, reflection questions are dosage-themed, and the remediation cards read Dimensional-Analysis Drill / High-Alert Medication Safety / Replay.

- [ ] **Step 7: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering/src/routes/debrief.tsx
git commit -m "feat(sim-eng): re-theme debrief to Lesson 10 dosage calc"
```

---

### Task 6: End-to-end verification + README

**Files:**
- Create: `simulation-engineering/README.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the README**

Create `simulation-engineering/README.md`:
```markdown
# Simulation Engineering — Lesson 10 Demo

Standalone demo reusing the Swift River design system, rebranded as **Simulations /
ATI Engage: Pharmacology**, embedding the real Three.js **Lesson 10: Dosage
Calculations & Medication Errors** simulation with an adaptive-engine + mastery rail
and an AI debrief.

## Run

Two servers are needed:

1. **The simulation engine** (the embedded iframe source):
   ```bash
   cd /Users/vinodpatil/Projects/unity/ATIENGPH_DME_10_Unity/threejs-port
   npm install && npm run dev      # http://localhost:5180
   ```
2. **This demo shell:**
   ```bash
   bun install && bun run dev --port 5186 --strictPort   # http://localhost:5186
   ```

Then open http://localhost:5186/student/simulation.

All AI content is static mock data (`src/lib/mock-data.ts`); no LLM calls. The
`threejs-port` project is embedded read-only and never modified.
```

- [ ] **Step 2: Full build**

Run: `cd "simulation-engineering" && bun run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: End-to-end walkthrough**

Start both servers (threejs-port on 5180, this app on 5186). At `http://localhost:5186/student/simulation`:
1. The sim frame loads the real Three.js sim behind the Welcome-back modal.
2. Continue → sim is interactive; right rail shows mastery + forecast.
3. Mark run complete → completion card → View full debrief.
4. `/debrief` shows Lesson 10 content end-to-end.
Confirm no console errors. Confirm `threejs-port` git status is unchanged (`git -C /Users/vinodpatil/Projects/unity/ATIENGPH_DME_10_Unity/threejs-port status` clean w.r.t. our work).

- [ ] **Step 4: Commit**

```bash
cd "/Users/vinodpatil/Projects/other-products/AI demos"
git add simulation-engineering/README.md
git commit -m "docs(sim-eng): add run instructions"
```

---

## Self-Review

**Spec coverage:**
- Standalone copy of swiftriver → Task 1 ✓
- Rebrand to Simulations/ATI → Task 2 ✓
- Embedded Three.js sim + Welcome-back modal → Task 4 ✓
- Persistent right rail (Adaptive Engine + Mastery/Forgetfulness + next-best-action) → Tasks 3+4 ✓
- Completion card linking to debrief → Task 4 ✓
- Reused, re-themed Adaptive Debrief → Tasks 3+5 ✓
- Static mock data, no LLM → Task 3 ✓ (Global Constraints)
- No changes to threejs-port → Global Constraints + Task 6 verification ✓
- Port 5186 / iframe :5180 → Global Constraints ✓

**Type consistency:** `masteryMeta` keys (`strong`/`fragile`/`at_risk`) match `MasteryState` and `lesson10Mastery[].state`. `lesson10DebriefTimeline` has no `icon` field — Task 5 Step 1 explicitly replaces `e.icon` with tone-derived icons. Debrief imports are aliased to the local names the JSX already uses (`timeline`, `missedCues`, `debriefQs`, `remediation`).

**Placeholders:** none — all code blocks are complete.
