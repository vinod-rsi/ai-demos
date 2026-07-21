import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, ChevronRight, ArrowRight, Check, Activity, ShieldCheck,
  Lightbulb, RefreshCw, ClipboardCheck, TrendingDown, Play,
  Maximize2, ExternalLink,
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

// The Three.js sim ships with this app: sim/ builds into public/sim, so the
// iframe is same-origin wherever the demo is hosted (see sim/README.md).
const SIM_URL = `${import.meta.env.BASE_URL}sim/index.html`;

export const Route = createFileRoute("/student/simulation")({
  head: () => ({ meta: [{ title: "Lesson 10 — Dosage Calculations & Medication Errors" }] }),
  component: SimulationPage,
});

function SimulationPage() {
  // "modal" = welcome-back shown; "running" = sim revealed; "complete" = finished
  const [phase, setPhase] = useState<"modal" | "running" | "complete">("modal");
  const [mode, setMode] = useState<"Beginner" | "Advanced">("Advanced");
  const progress = phase === "complete" ? 100 : phase === "running" ? 45 : 0;
  const simWrapRef = useRef<HTMLDivElement>(null);

  const goFullscreen = () => simWrapRef.current?.requestFullscreen?.();

  const difficulty =
    mode === "Beginner"
      ? { label: "Supported", tone: "info", note: "Beginner level — the engine adds worked-example scaffolding, keeps hints one tap away, and slows the pace on weight-based steps." }
      : { label: "Advanced", tone: "ai", note: "Advanced level — hints are held back and a competing high-alert distractor is introduced, because your recent dosage decisions have been strong." };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
        {/* Breadcrumb + mode toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/student" className="hover:text-foreground">My Simulations</Link>
            <ChevronRight className="h-4 w-4" />
            <span>ATI Engage: Pharmacology</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Lesson 10 — Dosage Calculations &amp; Medication Errors</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <span className="px-2 text-xs font-medium text-muted-foreground">Preview as</span>
            {(["Beginner", "Advanced"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
          One case, every skill level — the adaptive engine tracks your dosage-calculation
          decisions, timing, and confidence, then tunes cues and difficulty and updates your
          mastery profile and debrief.
        </p>

        {/* Progress + adaptive badge */}
        <div className="mt-4 flex items-center gap-4">
          <Progress value={progress} className="h-2 flex-1" />
          <StatusBadge tone={difficulty.tone} dot>
            <Sparkles className="h-3 w-3" /> {difficulty.label}
          </StatusBadge>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: the embedded sim */}
          <div className="space-y-5">
            <Card className="gap-0 overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Play className="h-4 w-4 text-primary" /> Simulation
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={phase === "complete" ? "success" : "info"} dot>
                    {phase === "complete" ? "Completed" : phase === "running" ? "In progress" : "Ready"}
                  </StatusBadge>
                  <button
                    type="button"
                    onClick={goFullscreen}
                    title="Fullscreen"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={SIM_URL}
                    target="_blank"
                    rel="noreferrer"
                    title="Open sim in new tab"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div
                ref={simWrapRef}
                className="relative h-[72vh] max-h-[820px] min-h-[520px] w-full bg-black"
              >
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
                Real Three.js simulation engine — Konverse dialogue, lip-sync and course assets, running in-page.
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
                  : difficulty.note}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-card/70 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Current level</span>
                <StatusBadge tone={difficulty.tone}>{difficulty.label}</StatusBadge>
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
