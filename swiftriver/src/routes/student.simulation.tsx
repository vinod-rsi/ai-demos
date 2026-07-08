import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  CircleAlert,
  Heart,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Thermometer,
  Wind,
  Droplet,
  Gauge,
  ChevronRight,
  X,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/student/simulation")({
  head: () => ({ meta: [{ title: "Simulation — Post-Op Sepsis Recognition" }] }),
  component: SimulationPage,
});

type Correctness = "correct" | "partial" | "incorrect";
type Mode = "Beginner" | "Advanced";

interface Choice {
  id: string;
  label: string;
  correctness: Correctness;
  feedback: string;
  aiNote: string;
}

interface Vital {
  icon: typeof Heart;
  label: string;
  value: string;
  tone: string;
}

interface Step {
  key: string;
  phase: string;
  title: string;
  narrative: string;
  vitals: Vital[];
  hint: string;
  prompt: string;
  choices: Choice[];
}

const patient = {
  name: "Robert Hayes",
  meta: "68 y · Male · POD 2 sigmoid colectomy",
  summary:
    "Post-op day 2 following elective sigmoid colectomy. Reports feeling \"off\" and clammy. History of type 2 diabetes and hypertension.",
};

const steps: Step[] = [
  {
    key: "assessment",
    phase: "Decision 1 of 3",
    title: "Initial Assessment",
    narrative:
      "You enter the room for a routine check. Mr. Hayes is diaphoretic and slightly confused about the time. His dressing is dry and intact.",
    vitals: [
      { icon: Heart, label: "HR", value: "112 bpm", tone: "warning" },
      { icon: Wind, label: "RR", value: "24 /min", tone: "warning" },
      { icon: Gauge, label: "BP", value: "104/62", tone: "info" },
      { icon: Thermometer, label: "Temp", value: "38.4°C", tone: "warning" },
      { icon: Droplet, label: "SpO₂", value: "94%", tone: "info" },
    ],
    hint: "Cluster the cues rather than treating them one at a time. New confusion + fever + tachycardia in a post-op patient is a recognizable pattern.",
    prompt: "What is your first priority action?",
    choices: [
      {
        id: "a1",
        label: "Recognize a cue cluster suggestive of early sepsis and complete a focused assessment (full vitals, mentation, perfusion, lactate)",
        correctness: "correct",
        feedback:
          "Strong recognition. You grouped confusion, fever, and tachycardia as an early sepsis pattern and gathered the data needed to act.",
        aiNote:
          "You clustered cues quickly and confidently. I'm keeping support minimal and will add a competing priority at the escalation step to stretch you.",
      },
      {
        id: "a2",
        label: "Give the scheduled acetaminophen for the fever and reassess in an hour",
        correctness: "partial",
        feedback:
          "Partially safe — treating the fever isn't wrong, but a one-hour delay misses the window to catch decompensation early.",
        aiNote:
          "You treated a single cue in isolation. I'll surface a guided assessment prompt next so the full picture stays visible.",
      },
      {
        id: "a3",
        label: "Document that the patient is anxious and continue your medication round",
        correctness: "incorrect",
        feedback:
          "Unsafe. Attributing new confusion to anxiety without assessment overlooks a life-threatening pattern.",
        aiNote:
          "A key cue was missed. I'm increasing support and slowing the pace so we can rebuild the assessment step by step.",
      },
    ],
  },
  {
    key: "escalation",
    phase: "Decision 2 of 3",
    title: "Prioritization & Escalation",
    narrative:
      "Your assessment confirms it: lactate is 3.1 mmol/L and urine output has dropped. Mr. Hayes is now harder to rouse. A call light is ringing next door for a stable patient requesting pain meds.",
    vitals: [
      { icon: Heart, label: "HR", value: "124 bpm", tone: "critical" },
      { icon: Wind, label: "RR", value: "28 /min", tone: "critical" },
      { icon: Gauge, label: "BP", value: "88/54", tone: "critical" },
      { icon: Thermometer, label: "Temp", value: "38.9°C", tone: "warning" },
      { icon: Droplet, label: "SpO₂", value: "90%", tone: "warning" },
    ],
    hint: "Two demands are competing. Sort by physiologic instability — which patient can decompensate in minutes versus who can safely wait?",
    prompt: "How do you prioritize right now?",
    choices: [
      {
        id: "b1",
        label: "Initiate the sepsis bundle: escalate to the provider/rapid response, start fluids, and draw cultures before antibiotics",
        correctness: "correct",
        feedback:
          "Excellent prioritization. You escalated the unstable patient immediately and sequenced the sepsis bundle correctly.",
        aiNote:
          "You handled the competing priority without hesitation. Difficulty is holding at advanced — no hints needed.",
      },
      {
        id: "b2",
        label: "Start IV fluids yourself but wait to call the provider until the next set of vitals in 15 minutes",
        correctness: "partial",
        feedback:
          "Right intervention, delayed escalation. Fluids help, but a 15-minute delay in notifying the team risks a worse trajectory.",
        aiNote:
          "I detected a late-escalation pattern — a recurring gap for you. I'll add an escalation-timing checkpoint to your debrief.",
      },
      {
        id: "b3",
        label: "Answer the neighboring call light first, then return to reassess Mr. Hayes",
        correctness: "incorrect",
        feedback:
          "Unsafe prioritization. The stable patient can wait; Mr. Hayes is decompensating and needs immediate escalation.",
        aiNote:
          "Unsafe priority selected → triggering debrief path B. I'll route this to your instructor's remediation queue.",
      },
    ],
  },
  {
    key: "handoff",
    phase: "Decision 3 of 3",
    title: "Follow-up & Handoff",
    narrative:
      "Rapid response is at the bedside and Mr. Hayes is stabilizing after the first fluid bolus. The ICU team is arriving to take over. They ask you for a handoff.",
    vitals: [
      { icon: Heart, label: "HR", value: "108 bpm", tone: "warning" },
      { icon: Wind, label: "RR", value: "22 /min", tone: "info" },
      { icon: Gauge, label: "BP", value: "98/60", tone: "info" },
      { icon: Thermometer, label: "Temp", value: "38.6°C", tone: "warning" },
      { icon: Droplet, label: "SpO₂", value: "95%", tone: "success" },
    ],
    hint: "A good handoff is structured and forward-looking. SBAR closes the loop and names what still needs watching.",
    prompt: "How do you hand off care?",
    choices: [
      {
        id: "c1",
        label: "Give a structured SBAR handoff including trend, interventions given, and pending cultures / lactate to recheck",
        correctness: "correct",
        feedback:
          "Textbook handoff. Structured, complete, and forward-looking — the ICU team has everything they need.",
        aiNote:
          "Clear, organized communication. Your CJMI for this case landed at 88 — advanced tier.",
      },
      {
        id: "c2",
        label: "Summarize the current vitals verbally and let the ICU team review the chart for the rest",
        correctness: "partial",
        feedback:
          "Incomplete. Current vitals alone omit the trend and interventions that explain the picture.",
        aiNote:
          "Handoff structure was a gap. I've added an SBAR practice prompt to your remediation.",
      },
      {
        id: "c3",
        label: "Tell them the patient is 'stable now' and move on to your other patients",
        correctness: "incorrect",
        feedback:
          "Unsafe. 'Stable now' hides an unstable trajectory and pending results the receiving team must monitor.",
        aiNote:
          "Critical communication gap flagged. Routing to debrief with a focus on closed-loop handoff.",
      },
    ],
  },
];

const correctnessMeta: Record<Correctness, { label: string; tone: string; icon: typeof Check }> = {
  correct: { label: "Correct", tone: "success", icon: Check },
  partial: { label: "Partially correct", tone: "warning", icon: CircleAlert },
  incorrect: { label: "Incorrect", tone: "critical", icon: X },
};

function SimulationPage() {
  const [mode, setMode] = useState<Mode>("Advanced");
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<Correctness[]>([]);

  const step = steps[stepIndex];
  const progress = finished ? 100 : Math.round((stepIndex / steps.length) * 100);

  const difficulty = useMemo(() => {
    const wrong = history.filter((h) => h !== "correct").length;
    if (mode === "Beginner") return { label: "Supported", tone: "info", note: "Extra scaffolding and guided prompts are on." };
    if (wrong >= 2) return { label: "Increasing support", tone: "warning", note: "The engine added scaffolding after repeated missed cues." };
    if (wrong === 0 && history.length > 0) return { label: "Advanced", tone: "ai", note: "Hints reduced; a competing priority was introduced." };
    return { label: "Adaptive", tone: "primary", note: "Difficulty is tuned live to your choices." };
  }, [history, mode]);

  const handleSelect = (choice: Choice) => {
    if (selected) return;
    setSelected(choice);
    setHistory((h) => [...h, choice.correctness]);
  };

  const handleContinue = () => {
    setSelected(null);
    setShowHint(false);
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setStepIndex(0);
    setSelected(null);
    setShowHint(false);
    setFinished(false);
    setHistory([]);
  };

  if (finished) return <CompletionView history={history} mode={mode} onRestart={restart} />;

  const meta = selected ? correctnessMeta[selected.correctness] : null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/student" className="hover:text-foreground">My Simulations</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Post-Op Sepsis Recognition</span>
          </div>
          {/* Mode preview toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <span className="px-2 text-xs font-medium text-muted-foreground">Preview as</span>
            {(["Beginner", "Advanced"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); toast.info(`Previewing ${m} mode`, { description: "Same scenario — the engine adjusts scaffolding and complexity." }); }}
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

        <p className="mt-2 max-w-2xl text-xs text-muted-foreground">Work through an unfolding patient case where the AI engine adapts cues, difficulty, and hints to your decisions in real time.</p>

        {/* Progress + adapt indicator */}
        <div className="mt-4 flex items-center gap-4">
          <Progress value={progress} className="h-2 flex-1" />
          <StatusBadge tone={difficulty.tone} dot>
            <Sparkles className="h-3 w-3" /> {difficulty.label}
          </StatusBadge>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main case column */}
          <div className="space-y-5">
            {/* Patient summary */}
            <Card className="flex-row items-center gap-4 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted font-bold text-primary">
                RH
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{patient.name}</p>
                  <StatusBadge tone="critical" dot>Deteriorating</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground">{patient.meta}</p>
              </div>
            </Card>

            {/* Scenario step */}
            <Card className="gap-0 p-6">
              <div className="flex items-center justify-between">
                <StatusBadge tone="info">{step.phase}</StatusBadge>
                <span className="text-xs font-medium text-muted-foreground">{step.title}</span>
              </div>
              <p className="mt-4 leading-relaxed text-foreground/90">{step.narrative}</p>

              {/* Vitals */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {step.vitals.map((v) => (
                  <div key={v.label} className="rounded-lg border border-border bg-secondary/40 p-2.5 text-center">
                    <v.icon className={cn("mx-auto h-4 w-4", `text-${v.tone}`)} />
                    <p className="mt-1 text-sm font-bold tabular-nums">{v.value}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{v.label}</p>
                  </div>
                ))}
              </div>

              {/* Prompt */}
              <div className="mt-6 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <p className="font-semibold">{step.prompt}</p>
              </div>

              {/* Choices */}
              <div className="mt-3 space-y-2.5">
                {step.choices.map((c) => {
                  const isSelected = selected?.id === c.id;
                  const showResult = !!selected;
                  const cm = correctnessMeta[c.correctness];
                  return (
                    <button
                      key={c.id}
                      disabled={showResult}
                      onClick={() => handleSelect(c)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all",
                        !showResult && "border-border bg-card hover:border-primary/50 hover:bg-primary-muted/40",
                        showResult && isSelected && c.correctness === "correct" && "border-success/40 bg-success-muted",
                        showResult && isSelected && c.correctness === "partial" && "border-warning/40 bg-warning-muted",
                        showResult && isSelected && c.correctness === "incorrect" && "border-critical/40 bg-critical-muted",
                        showResult && !isSelected && "border-border opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                          showResult && isSelected ? `bg-${cm.tone} text-${cm.tone}-foreground border-transparent` : "border-muted-foreground/40 text-muted-foreground",
                        )}
                      >
                        {showResult && isSelected ? <cm.icon className="h-3 w-3" /> : c.id.slice(-1).toUpperCase()}
                      </span>
                      <span className="flex-1 leading-snug">{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              {!selected && mode === "Beginner" && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowHint((s) => !s)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ai hover:underline"
                  >
                    <Lightbulb className="h-4 w-4" /> {showHint ? "Hide hint" : "Ask the AI for a hint"}
                  </button>
                  {showHint && (
                    <AiCard title="Personalized Hint" compact className="mt-2">
                      {step.hint}
                    </AiCard>
                  )}
                </div>
              )}
              {!selected && mode === "Advanced" && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Advanced mode — hints are held back to challenge your judgment.
                </p>
              )}

              {/* Feedback + continue */}
              {selected && meta && (
                <div className="mt-5 space-y-3 border-t border-border pt-5">
                  <div className={cn("rounded-xl border p-4", `border-${meta.tone}/25 bg-${meta.tone}-muted`)}>
                    <StatusBadge tone={meta.tone} dot>{meta.label}</StatusBadge>
                    <p className="mt-2 text-sm leading-relaxed">{selected.feedback}</p>
                  </div>
                  <Button onClick={handleContinue} className="w-full gap-2">
                    {stepIndex < steps.length - 1 ? "Continue" : "Complete & view debrief"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* AI side panel */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
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
                {selected ? selected.aiNote : difficulty.note}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-card/70 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Current difficulty</span>
                <StatusBadge tone={difficulty.tone}>{difficulty.label}</StatusBadge>
              </div>
            </div>

            <Card className="gap-0 p-5">
              <h3 className="text-sm font-semibold">Support options</h3>
              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled={mode === "Advanced" || !!selected}
                  onClick={() => { setShowHint(true); toast.success("Hint revealed"); }}
                >
                  <Lightbulb className="h-4 w-4 text-ai" /> Personalized hint
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info("Faculty notified", { description: "Dr. Alvarado can see your request for help." })}>
                  <HelpCircle className="h-4 w-4 text-info" /> Ask instructor for help
                </Button>
              </div>
              <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                <Activity className="mr-1 inline h-3.5 w-3.5" />
                Your choices, timing, and confidence are captured for debrief — hidden rationale stays sealed until you finish.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CompletionView({
  history,
  mode,
  onRestart,
}: {
  history: Correctness[];
  mode: Mode;
  onRestart: () => void;
}) {
  const correct = history.filter((h) => h === "correct").length;
  const score = Math.round((correct / history.length) * 100) || 0;
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <Card className="gap-0 overflow-hidden p-0 text-center">
          <div className="bg-gradient-hero px-6 py-10 text-white">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <Check className="h-8 w-8" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold">Simulation complete</h1>
            <p className="mt-1 text-sm text-white/80">Post-Op Sepsis Recognition · {mode} mode</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { l: "Case CJMI", v: score >= 66 ? 88 : score >= 33 ? 71 : 54 },
                { l: "Decisions correct", v: `${correct}/${history.length}` },
                { l: "Time", v: "7:42" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <p className="text-2xl font-bold tabular-nums">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <AiCard title="AI Debrief Summary" className="mt-5 text-left">
              {correct === history.length
                ? "Exemplary judgment throughout — early cue recognition, decisive escalation, and a complete SBAR handoff. The engine ran this case at advanced difficulty with hints held back."
                : "You recognized the sepsis pattern but showed a late-escalation tendency under competing priorities. The engine has queued an escalation-timing checkpoint and an SBAR practice prompt for your debrief."}
            </AiCard>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="gap-2">
                <Link to="/debrief">View full debrief <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" onClick={onRestart} className="gap-2">
                Replay scenario
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
