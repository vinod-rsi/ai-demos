import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  PencilRuler,
  Plus,
  Eye,
  Send,
  GitBranch,
  Target,
  Tag,
  Sparkles,
  Check,
  X,
  Trash2,
  ArrowRight,
  Beaker,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { AiCard } from "@/components/prototype/AiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { adaptiveRules, learningObjectives, type AdaptiveRule } from "@/lib/mock-data";

export const Route = createFileRoute("/author")({
  head: () => ({ meta: [{ title: "Scenario Authoring — Swift River" }] }),
  component: AuthorPage,
});

function AuthorPage() {
  const [rules, setRules] = useState<AdaptiveRule[]>(adaptiveRules);
  const [preview, setPreview] = useState<"Beginner" | "Advanced" | null>(null);

  const toggleRule = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  const removeRule = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PencilRuler className="h-4 w-4" /> Scenario Authoring
            </div>
            <h1 className="text-2xl font-bold">Post-Op Sepsis Recognition</h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Author one adaptive scenario with branching rules that scale cues, difficulty, and hints from beginner through advanced learners.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="warning" dot>In review</StatusBadge>
            <Button variant="outline" className="gap-2" onClick={() => setPreview("Beginner")}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button className="gap-2" onClick={() => toast.success("Submitted for publishing", { description: "Sent to curriculum committee for approval." })}>
              <Send className="h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left: base scenario */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="gap-0 p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-primary" /> Base scenario</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5">Scenario title</Label>
                  <Input defaultValue="Post-Op Sepsis Recognition" />
                </div>
                <div>
                  <Label className="mb-1.5">Specialty area</Label>
                  <Select defaultValue="medsurg">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medsurg">Med-Surg</SelectItem>
                      <SelectItem value="critical">Critical Care</SelectItem>
                      <SelectItem value="ob">Obstetrics</SelectItem>
                      <SelectItem value="peds">Pediatrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Base difficulty</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label className="mb-1.5">Learning objectives</Label>
                <div className="space-y-2">
                  {learningObjectives.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-success" /> {o}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => toast.info("Add objective")}>
                    <Plus className="h-3.5 w-3.5" /> Add objective
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Handoff cues (required to stabilize)</Label>
                  <Textarea rows={2} defaultValue="Trend improving · fluids given · cultures pending · lactate to recheck" />
                </div>
                <div>
                  <Label className="mb-1.5">Remediation tags</Label>
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2.5">
                    {["escalation-timing", "cue-clustering", "sbar-handoff"].map((t) => (
                      <StatusBadge key={t} tone="primary"><Tag className="h-3 w-3" /> {t}</StatusBadge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Rule builder */}
            <Card className="gap-0 p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4 text-ai" /> Adaptive rule builder</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    setRules((rs) => [
                      ...rs,
                      { id: `r${rs.length + 1}`, condition: "IF learner …", action: "THEN …", active: false, tone: "info" },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add rule
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Rules define how the engine adapts the case in real time.</p>

              <div className="mt-4 space-y-3">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "rounded-xl border p-4 transition-opacity",
                      r.active ? "border-border bg-card" : "border-dashed border-border bg-secondary/30 opacity-70",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", `bg-${r.tone}-muted text-${r.tone}`)}>
                        <GitBranch className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{r.condition}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" /> {r.action}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={r.active} onCheckedChange={() => toggleRule(r.id)} />
                        <button onClick={() => removeRule(r.id)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-critical">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Branching thresholds</p>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Increase support after</p>
                    <p className="mt-1 font-bold">2 missed cues</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Advanced tier at CJMI</p>
                    <p className="mt-1 font-bold">&gt; 80</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Debrief path B on</p>
                    <p className="mt-1 font-bold">unsafe priority</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: AI + status */}
          <div className="space-y-6">
            <AiCard title="AI Authoring Assistant">
              This scenario is well-scoped for a single build to serve <strong>beginner through advanced</strong>.
              Consider adding a rule for <strong>high confidence + incorrect action</strong> to catch over-confidence —
              it's the #1 predictor of NCLEX safety errors in your program.
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => { setRules((rs) => rs.map((r) => (r.id === "r4" ? { ...r, active: true } : r))); toast.success("Rule enabled"); }}>
                <Sparkles className="h-3.5 w-3.5" /> Apply suggestion
              </Button>
            </AiCard>

            <Card className="gap-0 p-5">
              <h3 className="text-sm font-semibold">Review status</h3>
              <div className="mt-3 space-y-2.5">
                {[
                  { l: "Objectives mapped", done: true },
                  { l: "Adaptive rules validated", done: true },
                  { l: "Accessibility check", done: true },
                  { l: "Peer review", done: false },
                  { l: "Committee approval", done: false },
                ].map((s) => (
                  <div key={s.l} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", s.done ? "bg-success-muted text-success" : "bg-secondary text-muted-foreground")}>
                      {s.done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={s.done ? "" : "text-muted-foreground"}>{s.l}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="gap-0 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Beaker className="h-4 w-4 text-info" /> Preview modes</h3>
              <p className="mt-1 text-xs text-muted-foreground">See the same case at each level</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview("Beginner")}>Beginner</Button>
                <Button variant="outline" size="sm" onClick={() => setPreview("Advanced")}>Advanced</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {preview && <PreviewModal mode={preview} onClose={() => setPreview(null)} />}
    </AppLayout>
  );
}

function PreviewModal({ mode, onClose }: { mode: "Beginner" | "Advanced"; onClose: () => void }) {
  const beginner = mode === "Beginner";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg gap-0 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Preview — {mode} mode</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <StatusBadge tone={beginner ? "info" : "ai"} dot>{beginner ? "Supported" : "Advanced"}</StatusBadge>
            <span className="text-xs text-muted-foreground">Decision 1 · Initial Assessment</span>
          </div>
          <p className="text-sm leading-relaxed">
            POD 2 patient is diaphoretic and confused. {beginner
              ? "Vital signs are labeled with normal ranges, and one guided prompt is available."
              : "No cue labels. A competing priority (a second patient's call light) is introduced immediately."}
          </p>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium">What is your first priority action?</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>• Recognize sepsis cue cluster & assess</li>
              <li>• Treat the fever and reassess later</li>
              {!beginner && <li>• Respond to the neighboring call light first</li>}
            </ul>
          </div>
          <AiCard title="Engine behavior" compact>
            {beginner
              ? "Hints ON · guided assessment prompt available · 1 competing priority hidden · debrief simplified."
              : "Hints OFF · 2 competing priorities · distractor added · full SBAR required at handoff."}
          </AiCard>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { toast.success("Looks good — ready to publish"); onClose(); }}>Approve preview</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
