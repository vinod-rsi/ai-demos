# Feature-Overlap Completion Plan — Simulation Engineering

**Date:** 2026-07-08
**Status:** Draft for review (no implementation yet)

## Scope decision: which products count as "complete overlap"

The demo is the **Simulations** product. Of the 8 demos/pitches in the Feature Overlap
Report, only **two map onto a simulation surface**:

- **§4.7 Swift River — Adaptive Clinical Simulation Engine** (its direct analog)
- **§4.8 BoardVitals — Mastery Engine & Forgetfulness Forecast** (learner mastery layer)

The other six (JBL StudyBot, CRM Match, Hatsize Lab Blueprint/Copilot, FISDAP,
myTIPreport) are **content-tagging, grading, study-material, and evidence-classification**
surfaces. Forcing them into a simulation player would be off-domain and complex — so
they are **deliberately excluded**. "Complete overlap" here = fully cover Swift River +
BoardVitals, plus the cross-cutting **"AI proposes, confidence-scored, human approves"**
governance pattern (§3.2) that every demo shares.

## Coverage audit — feature → current status → action

| # | Pitch feature | Source | Current status | Action |
|---|---------------|--------|----------------|--------|
| 1 | Real-time adaptation (hints/difficulty shift to learner) | SR §4.7 | Static "Adaptive Engine" text on sim page; **the Beginner/Advanced mechanic was removed** when the iframe replaced the fake case | **B** — restore a "Preview as Beginner / Advanced" toggle + live difficulty badge around the iframe |
| 2 | One case → many levels | SR §4.7 | Author page has adaptive rules; not shown on sim page | **B** — same toggle communicates it; author page re-themed in A |
| 3 | Student detail: decision path, missed cues, timing gaps, AI judgment summary | SR §4.7 | ✅ Done — `debrief.tsx`, Lesson 10 themed | none |
| 4 | Faculty: class heatmap, weak spots, AI debrief questions, remediation groups | SR §4.7 | Built in `faculty.tsx` but **Sepsis-themed + "Swift River"** | **A** — re-theme to dosage-calc + rebrand |
| 5 | Admin: cohort trends, readiness distribution, at-risk flags, export | SR §4.7 | Built in `admin.tsx` but generic/Sepsis + "Swift River" | **A** — re-theme + rebrand |
| 6 | Authoring: AI proposes variations, educator approves | SR §4.7 | Built in `author.tsx` but Sepsis + "Swift River" | **A** — re-theme + rebrand |
| 7 | Concept-level mastery (Strong/Fragile/At-risk) | BV §4.8 | ✅ Done — sim-page rail | none |
| 8 | Forgetfulness forecast + explainability | BV §4.8 | ✅ Done — sim-page rail | none |
| 9 | Next-best-action | BV §4.8 | ✅ Done — sim-page rail | none |
| 10 | Cohort view: sort by readiness/decay, one-click "Suggest intervention" on flagged, track after | BV §4.8 | Faculty roster exists but **no decay-risk sort / intervention action** | **C** — add decay-risk column + "Suggest intervention" button to faculty roster |
| 11 | Governance: explainable, human-in-the-loop, instructor override | §3.2 | Built in `settings.tsx` but "Swift River" | **A** — rebrand (content already correct) |
| 12 | Landing / role overview | — | `index.tsx` marketing page, "Swift River" | **A** — rebrand + retheme hero to ATI Pharmacology |
| 13 | Student scenario list + CJMI trend | SR | `student.index.tsx`, generic nursing scenarios | **A** — retheme scenarios to Pharmacology lessons |

## Proposed phases (pick any subset)

### Phase A — Finish the rebrand + re-theme (core; ~mechanical)
Re-theme the six already-built pages and their mock data from **Swift River / Post-Op
Sepsis** → **Simulations / ATI Engage: Pharmacology / Lesson 10 Dosage Calc**:
- `index.tsx`, `faculty.tsx`, `admin.tsx`, `author.tsx`, `settings.tsx`, `student.index.tsx`
- `lib/mock-data.ts`: retheme `studentScenarios`, `studentSkills`, cohort `roster`,
  weak-skill heatmap, `readiness*`, `cohortComparison`, adaptive rules → dosage-calc
  skills (unit conversion, IV drip rate, pediatric dosing, decimal accuracy, high-alert
  protocol) and pharmacology scenario names.
- Titles `— Swift River` → `— Simulations`.
- **No new components** — text/data edits only. This single phase surfaces the entire
  Swift River faculty/admin/author/governance feature set in the Lesson 10 context.
- Effort: **medium-low** (mechanical), highest overlap-per-effort.

### Phase B — Restore the adaptive mechanic on the sim page (small)
Add above/beside the iframe: a **"Preview as Beginner / Advanced"** segmented toggle and
a live **difficulty badge**; the Adaptive-Engine panel copy changes with the selection
(fewer hints on Advanced, scaffolding on Beginner). Reuses the original Swift River
pattern; does **not** attempt to drive the Unity sim's internal difficulty (not possible).
- Effort: **small**. Closes features #1, #2 visibly.

### Phase C — BoardVitals cohort completion on faculty (small)
Add to the faculty roster a **decay-risk / forgetfulness** column (reusing the mastery
mock pattern) and a one-click **"Suggest intervention"** button on flagged learners that
toasts a queued remediation.
- Effort: **small**. Closes feature #10.

## What this achieves
- Phase A alone → **full Swift River overlap** (faculty/admin/author/analytics/governance)
  in the Lesson 10 context, consistently branded.
- + Phase B → real-time-adaptation mechanic visible on the actual sim page.
- + Phase C → **full BoardVitals cohort overlap**.
- Together = complete overlap for the two simulation-relevant products, no off-domain
  bloat, no new architecture.

## Explicitly out of scope
JBL StudyBot, CRM Match, Hatsize Lab Blueprint/Copilot, FISDAP, myTIPreport — different
product surfaces (tagging/grading/study/evidence), not a simulation player. Adding them
would be complex and off-brand for this demo.
