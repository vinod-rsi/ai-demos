import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  BarChart3,
  PencilRuler,
  Activity,
  Gauge,
  Lightbulb,
  ClipboardList,
  MessageSquareText,
  ShieldCheck,
  Waves,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRole, ROLE_PROFILES, type Role } from "@/lib/role-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swift River Adaptive Clinical Simulation Engine" },
      {
        name: "description",
        content:
          "An AI layer inside Swift River that personalizes unfolding nursing simulations in real time — one scenario that adapts across every skill level.",
      },
      { property: "og:title", content: "Swift River Adaptive Clinical Simulation Engine" },
      {
        property: "og:description",
        content: "Personalized, adaptive nursing simulation that builds clinical judgment.",
      },
    ],
  }),
  component: OverviewPage,
});

const roleCards: {
  role: Role;
  icon: typeof GraduationCap;
  tone: string;
  desc: string;
  benefit: string;
}[] = [
  {
    role: "student",
    icon: GraduationCap,
    tone: "info",
    desc: "Enter unfolding cases that adapt cues, difficulty, and hints to your judgment.",
    benefit: "Practice at the right challenge level, every time",
  },
  {
    role: "faculty",
    icon: Users,
    tone: "primary",
    desc: "See where the cohort struggles, auto-generate debriefs, and group remediation.",
    benefit: "Less grading prep, sharper clinical debriefs",
  },
  {
    role: "admin",
    icon: BarChart3,
    tone: "ai",
    desc: "Track clinical judgment readiness, completion, and risk across every cohort.",
    benefit: "Board-ready outcomes visibility",
  },
  {
    role: "author",
    icon: PencilRuler,
    tone: "success",
    desc: "Design one scenario with adaptive rules that serve beginners through advanced.",
    benefit: "Build once, adapt for everyone",
  },
];

const aiBehaviors = [
  { icon: Gauge, title: "Adjusts difficulty in real time", text: "Cues, escalation timing, and distractors shift to the learner's demonstrated judgment." },
  { icon: Lightbulb, title: "Generates personalized hints", text: "Scaffolds support only when needed — never revealing the answer too early." },
  { icon: Activity, title: "Summarizes missed patterns", text: "Detects recurring gaps like late escalation or mis-prioritization." },
  { icon: ClipboardList, title: "Recommends remediation", text: "Groups learners and suggests targeted practice paths automatically." },
  { icon: MessageSquareText, title: "Produces debrief questions", text: "Faculty-ready prompts grounded in what actually happened in the case." },
  { icon: ShieldCheck, title: "Explains every adaptation", text: "Plain-language rationale keeps AI supportive, transparent, and instructor-controlled." },
];

function OverviewPage() {
  const { setRole } = useRole();
  const navigate = useNavigate();

  const go = (r: Role) => {
    setRole(r);
    navigate({ to: ROLE_PROFILES[r].home });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {/* Hero */}
        <section className="clinical-grid relative overflow-hidden rounded-2xl bg-gradient-hero px-6 py-10 text-white shadow-panel md:px-10 md:py-14">
          <StatusBadge tone="ai" dot className="border-white/20 bg-white/10 text-white">
            AI Engine embedded in Swift River
          </StatusBadge>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight md:text-5xl">
            One scenario. Every skill level. Adapting in real time.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
            The Adaptive Clinical Simulation Engine personalizes unfolding nursing simulations —
            changing patient cues, branching difficulty, escalation timing, and remediation depth
            based on each learner's choices, confidence, and history.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" onClick={() => go("student")} className="gap-2">
              Launch student demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              onClick={() => go("faculty")}
              className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Explore faculty view
            </Button>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              { v: "+12 pts", l: "Avg CJMI gain" },
              { v: "1 build", l: "Serves all levels" },
              { v: "88%", l: "Completion rate" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-bold md:text-3xl">{s.v}</p>
                <p className="text-xs text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Role entry points */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Built for every role in the program</h2>
              <p className="text-sm text-muted-foreground">Switch roles anytime from the top bar to explore each workspace.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roleCards.map((c) => {
              const p = ROLE_PROFILES[c.role];
              return (
                <Card
                  key={c.role}
                  className="group cursor-pointer gap-0 p-5 transition-all hover:-translate-y-0.5 hover:shadow-panel"
                  onClick={() => go(c.role)}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${c.tone}-muted text-${c.tone}`}>
                    <c.icon className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{p.label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                    Enter workspace
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* AI behaviors */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-ai text-ai-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">What the AI does — visibly, and under instructor control</h2>
              <p className="text-sm text-muted-foreground">Supportive and explainable. Never a black box.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiBehaviors.map((b) => (
              <Card key={b.title} className="gap-0 border-ai/15 bg-ai-muted/30 p-5">
                <b.icon className="h-5 w-5 text-ai" />
                <h3 className="mt-3 text-sm font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <footer className="mt-12 flex items-center justify-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <Waves className="h-3.5 w-3.5" /> Swift River Adaptive Clinical Simulation Engine · Prototype
        </footer>
      </div>
    </AppLayout>
  );
}
