import { createFileRoute, Link } from "@tanstack/react-router";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquareText,
  Clock,
  Check,
  CircleAlert,
  X,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  PlayCircle,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { studentSkills } from "@/lib/mock-data";

export const Route = createFileRoute("/debrief")({
  head: () => ({ meta: [{ title: "Debrief & Remediation — Swift River" }] }),
  component: DebriefPage,
});

const timeline = [
  { t: "0:00", step: "Initial assessment", result: "correct", detail: "Recognized cue cluster (confusion + fever + tachycardia)", tone: "success", icon: Check },
  { t: "2:14", step: "Prioritization / escalation", result: "late", detail: "Started fluids but delayed provider notification by ~6 min", tone: "warning", icon: CircleAlert },
  { t: "6:02", step: "Follow-up / handoff", result: "partial", detail: "SBAR omitted pending cultures and lactate recheck", tone: "warning", icon: CircleAlert },
];

const missedCues = [
  { cue: "Rising lactate (3.1)", when: "Decision 2", impact: "High" },
  { cue: "Falling urine output", when: "Decision 2", impact: "Medium" },
  { cue: "Pending culture results", when: "Handoff", impact: "Medium" },
];

const debriefQs = [
  "You recognized the pattern quickly — what made you wait to escalate once fluids were running?",
  "Which single vital sign should have moved provider notification to the top of your list?",
  "Rebuild your handoff using SBAR. What two items were missing and why do they matter to the ICU team?",
];

const remediation = [
  { title: "Early Escalation Workshop", type: "Interactive module", mins: 15, focus: "Escalation timing", tone: "critical" },
  { title: "SBAR Handoff Drill", type: "Guided practice", mins: 10, focus: "Structured communication", tone: "warning" },
  { title: "Replay: Sepsis (Advanced)", type: "Adaptive scenario", mins: 25, focus: "Apply under pressure", tone: "ai" },
];

function DebriefPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/student" className="hover:text-foreground">My Simulations</Link>
          <span>/</span>
          <span className="font-medium text-foreground">Debrief</span>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Debrief — Post-Op Sepsis Recognition</h1>
            <p className="text-sm text-muted-foreground">Completed 12 min ago · Standard mode · 7:42</p>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Review your decision timeline, missed cues, and judgment profile, then work through an AI-recommended personalized remediation plan.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot>CJMI 71</StatusBadge>
            <StatusBadge tone="warning">Debrief path B</StatusBadge>
          </div>
        </div>

        <AiCard title="AI Debrief Summary" className="mt-5">
          You demonstrated strong <strong>cue recognition</strong> and safe intervention, but the engine
          detected a recurring <strong>late-escalation pattern</strong> — this is the third case where you
          intervened before notifying the team. Your handoff was safe but incomplete. Two short remediation
          activities below target exactly these gaps; a replay in advanced mode will confirm the improvement.
        </AiCard>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Timeline */}
          <Card className="gap-0 p-6 lg:col-span-2">
            <h2 className="font-semibold">Your simulation path</h2>
            <p className="text-xs text-muted-foreground">Decisions, timing, and outcomes</p>
            <div className="mt-5 space-y-0">
              {timeline.map((e, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-border" />}
                  <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", `bg-${e.tone}-muted text-${e.tone}`)}>
                    <e.icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 rounded-xl border border-border p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{e.step}</p>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {e.t}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
                    <StatusBadge tone={e.tone} className="mt-2">{e.result}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>

            {/* Debrief questions */}
            <div className="mt-2 rounded-xl border border-ai/20 bg-ai-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-ai" />
                <h3 className="text-sm font-semibold">Reflection questions</h3>
              </div>
              <ol className="mt-3 space-y-2">
                {debriefQs.map((q, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ai-muted text-xs font-bold text-ai">{i + 1}</span>
                    <span className="leading-snug">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>

          {/* Right */}
          <div className="space-y-6">
            <Card className="gap-0 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Judgment profile</h3>
              <div className="mt-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={studentSkills} outerRadius="70%">
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} />
                    <Radar dataKey="score" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="gap-0 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><X className="h-4 w-4 text-critical" /> Missed cues</h3>
              <div className="mt-3 space-y-2">
                {missedCues.map((c) => (
                  <div key={c.cue} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div>
                      <p className="text-sm font-medium">{c.cue}</p>
                      <p className="text-[11px] text-muted-foreground">{c.when}</p>
                    </div>
                    <StatusBadge tone={c.impact === "High" ? "critical" : "warning"}>{c.impact}</StatusBadge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Remediation plan */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your personalized remediation plan</h2>
            <StatusBadge tone="ai"><Sparkles className="h-3 w-3" /> AI-recommended</StatusBadge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {remediation.map((r) => (
              <Card key={r.title} className="gap-0 p-5">
                <div className="flex items-start justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", `bg-${r.tone}-muted text-${r.tone}`)}>
                    <PlayCircle className="h-5 w-5" />
                  </span>
                  <span className="text-xs text-muted-foreground">{r.mins} min</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{r.title}</h3>
                <p className="text-xs text-muted-foreground">{r.type} · {r.focus}</p>
                <Button size="sm" className="mt-4 w-full gap-1.5" onClick={() => toast.success(`Starting: ${r.title}`)}>
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
