import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ArrowRight, Clock, Play, RotateCcw, CheckCircle2, Sparkles, Flame } from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { studentScenarios, studentSkills, cjmiTrend, type AssignedScenario } from "@/lib/mock-data";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [{ title: "My Simulations — Swift River" }],
  }),
  component: StudentDashboardIndex,
});

const statusMeta: Record<AssignedScenario["status"], { label: string; tone: string }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
};

function StudentDashboardIndex() {
  const active = studentScenarios.find((s) => s.status === "in_progress") ?? studentScenarios[0];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, Maya</p>
            <h1 className="text-2xl font-bold">Your Simulations</h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Browse your assigned adaptive scenarios, resume the case in progress, and track your clinical judgment readiness and CJMI trend.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success" dot>Readiness: Ready</StatusBadge>
            <StatusBadge tone="warning"><Flame className="h-3 w-3" /> 4-day streak</StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left: continue + list */}
          <div className="space-y-6 lg:col-span-2">
            {/* Continue card */}
            <Card className="gap-0 overflow-hidden p-0">
              <div className="bg-gradient-hero px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <StatusBadge tone="info" className="border-white/20 bg-white/10 text-white">
                    Continue where you left off
                  </StatusBadge>
                  <span className="text-xs text-white/70">{active.specialty} · {active.mode} mode</span>
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold">{active.title}</h2>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={active.progress} className="h-2 flex-1 bg-white/20" />
                  <span className="text-sm font-medium">{active.progress}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  <Clock className="mr-1 inline h-4 w-4" />~{active.estMinutes} min · Step 2 of 5: Prioritization
                </p>
                <Button asChild className="gap-2">
                  <Link to="/student/simulation">
                    <Play className="h-4 w-4" /> Resume simulation
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Assigned list */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Assigned scenarios</h3>
              <div className="space-y-3">
                {studentScenarios.map((s) => {
                  const meta = statusMeta[s.status];
                  return (
                    <Card key={s.id} className="flex-row items-center gap-4 p-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                        {s.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Play className="h-5 w-5 text-primary" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{s.title}</p>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.specialty} · {s.mode} mode · {s.due}
                          {s.cjmiScore ? ` · CJMI ${s.cjmiScore}` : ""}
                        </p>
                      </div>
                      <Button
                        asChild
                        variant={s.status === "completed" ? "outline" : "default"}
                        size="sm"
                        className="gap-1.5"
                      >
                        <Link to="/student/simulation">
                          {s.status === "completed" ? (
                            <><RotateCcw className="h-3.5 w-3.5" /> Review</>
                          ) : s.status === "in_progress" ? (
                            <>Resume <ArrowRight className="h-3.5 w-3.5" /></>
                          ) : (
                            <>Start <ArrowRight className="h-3.5 w-3.5" /></>
                          )}
                        </Link>
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: performance */}
          <div className="space-y-6">
            <AiCard title="AI Readiness Insight">
              You're consistently strong on <strong>taking action</strong>, but the engine has noticed
              a pattern of <strong>late prioritization</strong> under time pressure. Your next case will
              introduce one competing priority to build that skill.
            </AiCard>

            <Card className="gap-0 p-5">
              <h3 className="text-sm font-semibold">Clinical Judgment Profile</h3>
              <p className="text-xs text-muted-foreground">NCSBN CJMM domains</p>
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={studentSkills} outerRadius="72%">
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="gap-0 p-5">
              <h3 className="text-sm font-semibold">CJMI trend</h3>
              <p className="text-xs text-muted-foreground">Clinical Judgment Maturity Index</p>
              <div className="mt-3 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cjmiTrend} margin={{ left: -22, right: 6, top: 6 }}>
                    <XAxis dataKey="attempt" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--color-border)",
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                <Sparkles className="h-3.5 w-3.5" /> +24 pts over 6 weeks
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
