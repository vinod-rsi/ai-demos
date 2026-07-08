import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  AlertTriangle,
  ArrowRight,
  X,
  Clock,
  Target,
  MessageSquareText,
  UsersRound,
  ChevronRight,
  CheckCircle2,
  Copy,
  BarChart3,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { StatCard } from "@/components/prototype/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  roster,
  skillHeatmap,
  debriefQuestions,
  remediationGroups,
  readinessMeta,
  type StudentRow,
} from "@/lib/mock-data";

export const Route = createFileRoute("/faculty")({
  head: () => ({ meta: [{ title: "Faculty Dashboard — Swift River" }] }),
  component: FacultyDashboard,
});

function heatTone(v: number) {
  if (v >= 45) return "bg-critical text-critical-foreground";
  if (v >= 35) return "bg-warning text-warning-foreground";
  if (v >= 25) return "bg-warning-muted text-warning-foreground";
  return "bg-success-muted text-success";
}

function FacultyDashboard() {
  const [selected, setSelected] = useState<StudentRow | null>(null);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Med-Surg · BSN 2026 · Sections A & B</p>
            <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Monitor cohort readiness, drill into each learner's simulation path, and act on AI-generated debrief questions and remediation groups.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Comparing Section A vs Section B")}>
            <BarChart3 className="h-4 w-4" /> Compare sections
          </Button>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Class roster" value="32" icon={Users} hint="Across 2 sections" />
          <StatCard label="Scenario completion" value="71%" delta="+8%" icon={CheckCircle2} hint="Sepsis module" />
          <StatCard label="Avg cohort CJMI" value="68" delta="+5" icon={Target} iconTone="info" />
          <StatCard label="At-risk learners" value="2" delta="Needs review" deltaTone="critical" icon={AlertTriangle} iconTone="critical" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Roster */}
          <Card className="gap-0 p-0 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Class roster</h2>
              <span className="text-xs text-muted-foreground">Click a learner for their path</span>
            </div>
            <div className="divide-y divide-border">
              {roster.map((s) => {
                const rm = readinessMeta[s.readiness];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-secondary text-xs font-semibold">{s.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        {s.flag === "at_risk" && <StatusBadge tone="critical" dot>At risk</StatusBadge>}
                        {s.flag === "improving" && <StatusBadge tone="success" dot>Improving</StatusBadge>}
                      </div>
                      <p className="text-xs text-muted-foreground">Section {s.section} · Weakest: {s.weakestSkill} · {s.lastActive}</p>
                    </div>
                    <div className="hidden w-28 sm:block">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{s.completed}/{s.assigned}</span>
                      </div>
                      <Progress value={(s.completed / s.assigned) * 100} className="mt-1 h-1.5" />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-bold tabular-nums">{s.cjmi}</p>
                      <StatusBadge tone={rm.tone}>{rm.label}</StatusBadge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <AiCard title="AI Cohort Insight">
              <strong>Late escalation</strong> is the cohort's dominant gap — 41% of learners delayed
              provider notification in the sepsis case. Section A trails Section B on cue recognition
              by 16 points. I've drafted a targeted debrief and two remediation groups below.
            </AiCard>

            {/* Heatmap */}
            <Card className="gap-0 p-5">
              <h3 className="text-sm font-semibold">Weak-skill heatmap</h3>
              <p className="text-xs text-muted-foreground">% of learners missing each domain</p>
              <div className="mt-3 space-y-2">
                {skillHeatmap.map((row) => (
                  <div key={row.skill} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <span className="text-xs text-muted-foreground">{row.skill}</span>
                    <span className={cn("w-11 rounded-md py-1 text-center text-xs font-bold", heatTone(row.sectionA))}>
                      {row.sectionA}
                    </span>
                    <span className={cn("w-11 rounded-md py-1 text-center text-xs font-bold", heatTone(row.sectionB))}>
                      {row.sectionB}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 pt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                  <span />
                  <span className="w-11 text-center">Sec A</span>
                  <span className="w-11 text-center">Sec B</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Debrief + remediation */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="gap-0 p-5">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-ai" />
              <h3 className="font-semibold">Auto-generated debrief questions</h3>
            </div>
            <p className="text-xs text-muted-foreground">Grounded in this cohort's actual decisions</p>
            <ol className="mt-3 space-y-2.5">
              {debriefQuestions.map((q, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ai-muted text-xs font-bold text-ai">{i + 1}</span>
                  <span className="leading-snug">{q}</span>
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" className="mt-3 gap-2 self-start" onClick={() => toast.success("Debrief copied to clipboard")}>
              <Copy className="h-3.5 w-3.5" /> Copy debrief set
            </Button>
          </Card>

          <Card className="gap-0 p-5">
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Suggested remediation groups</h3>
            </div>
            <p className="text-xs text-muted-foreground">Auto-grouped by shared skill gaps</p>
            <div className="mt-3 space-y-3">
              {remediationGroups.map((g) => (
                <div key={g.name} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{g.name}</p>
                    <StatusBadge tone="primary">{g.size} learners</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Focus: {g.focus}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.members.map((m) => (
                      <span key={m} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3 gap-2 self-start" onClick={() => toast.success("Remediation assigned", { description: "Learners notified with targeted practice." })}>
              Assign remediation <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        </div>
      </div>

      {selected && <StudentDrawer student={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}

function StudentDrawer({ student, onClose }: { student: StudentRow; onClose: () => void }) {
  const rm = readinessMeta[student.readiness];
  const path = [
    { step: "Initial assessment", result: "correct", detail: "Recognized cue cluster in 42s", tone: "success" },
    { step: "Prioritization / escalation", result: student.flag === "at_risk" ? "late" : "correct", detail: student.flag === "at_risk" ? "Escalated 6 min late — competing priority" : "Escalated promptly, bundle sequenced", tone: student.flag === "at_risk" ? "critical" : "success" },
    { step: "Handoff", result: "partial", detail: "SBAR missing pending labs", tone: "warning" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-card shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">{student.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-xs text-muted-foreground">Section {student.section} · Last active {student.lastActive}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
              <p className="text-xl font-bold tabular-nums">{student.cjmi}</p>
              <p className="text-[10px] text-muted-foreground">CJMI</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
              <p className="text-xl font-bold tabular-nums">{student.completed}/{student.assigned}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
              <StatusBadge tone={rm.tone}>{rm.label}</StatusBadge>
              <p className="mt-1 text-[10px] text-muted-foreground">Readiness</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Simulation path — Sepsis Recognition</h3>
            <div className="space-y-2">
              {path.map((p, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", `bg-${p.tone}`)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{p.step}</p>
                      <StatusBadge tone={p.tone}>{p.result}</StatusBadge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {p.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Missed cues</h3>
            <div className="flex flex-wrap gap-1.5">
              {["Rising lactate", "Falling urine output", "Widening pulse pressure"].map((c) => (
                <StatusBadge key={c} tone="critical">{c}</StatusBadge>
              ))}
            </div>
          </div>

          <AiCard title="AI Debrief Summary">
            {student.name.split(" ")[0]} reliably recognizes cues but hesitates to escalate under
            competing demands. Recommend the <strong>Early Escalation Workshop</strong> and an SBAR
            handoff drill. Confidence is high even when incorrect — add a reflection checkpoint.
          </AiCard>

          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => { toast.success("Remediation assigned to " + student.name); onClose(); }}>
              Assign remediation
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
