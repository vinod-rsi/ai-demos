import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatCard } from "@/components/prototype/StatCard";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  programKpis,
  cohortComparison,
  readinessTrend,
  timeInSim,
  readinessDistribution,
  riskFlags,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Program Outcomes — Swift River" }] }),
  component: AdminDashboard,
});

const pieColors: Record<string, string> = {
  ai: "var(--color-ai)",
  success: "var(--color-success)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
};

const kpiIcons = [Users, Target, CheckCircle2, AlertTriangle] as const;

function AdminDashboard() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Riverside University · School of Nursing · AY 2025–26</p>
            <h1 className="text-2xl font-bold">Program Outcomes</h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Track program-wide clinical judgment readiness, completion, cohort comparisons, and at-risk learners for board-ready outcomes reporting.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Report exported (PDF)")}>
              <FileText className="h-4 w-4" /> Board report
            </Button>
            <Button className="gap-2" onClick={() => toast.success("Data exported (CSV)")}>
              <Download className="h-4 w-4" /> Export data
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {programKpis.map((k, i) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={k.value}
              delta={k.delta}
              deltaTone={k.tone}
              icon={kpiIcons[i]}
              iconTone={i === 3 ? "success" : i === 1 ? "info" : "primary"}
            />
          ))}
        </div>

        <AiCard title="AI Executive Summary" className="mt-6">
          Program-wide clinical judgment readiness is up <strong>+15 points</strong> year-over-year and
          now leads the national benchmark by 6 points. Completion is strong at 88%. The single lever
          with the highest projected NCLEX impact is <strong>early escalation timing</strong> — concentrated
          in 47 at-risk learners across two cohorts. Recommended: targeted remediation sprint before the spring clinical rotation.
        </AiCard>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Readiness trend */}
          <Card className="gap-0 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Clinical judgment readiness trend</h2>
                <p className="text-xs text-muted-foreground">Program vs national benchmark</p>
              </div>
              <StatusBadge tone="success" dot><TrendingUp className="h-3 w-3" /> Above benchmark</StatusBadge>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={readinessTrend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="readiness" name="Program" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rd)" />
                  <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke="var(--color-muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Readiness distribution */}
          <Card className="gap-0 p-5">
            <h2 className="font-semibold">Readiness distribution</h2>
            <p className="text-xs text-muted-foreground">All active learners</p>
            <div className="mt-2 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={readinessDistribution} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={2}>
                    {readinessDistribution.map((d) => (
                      <Cell key={d.name} fill={pieColors[d.tone]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {readinessDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: pieColors[d.tone] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Cohort comparison */}
          <Card className="gap-0 p-5">
            <h2 className="font-semibold">Cohort comparison</h2>
            <p className="text-xs text-muted-foreground">Readiness by graduating class</p>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortComparison} margin={{ left: -22, top: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Bar dataKey="readiness" name="Readiness" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Time in sim */}
          <Card className="gap-0 p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <h2 className="font-semibold">Time in simulation</h2>
            </div>
            <p className="text-xs text-muted-foreground">Avg minutes per learner · by specialty</p>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeInSim} layout="vertical" margin={{ left: 24, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="section" width={92} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  <Bar dataKey="minutes" fill="var(--color-info)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk flags */}
          <Card className="gap-0 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-critical" />
              <h2 className="font-semibold">Risk flags</h2>
            </div>
            <p className="text-xs text-muted-foreground">Learners needing intervention</p>
            <div className="mt-3 space-y-2">
              {riskFlags.map((r) => (
                <div key={r.name} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", r.severity === "critical" ? "bg-critical" : "bg-warning")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.section}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3 gap-2 self-start" onClick={() => toast.info("Opening intervention workflow")}>
              Review all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
