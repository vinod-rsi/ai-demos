import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Lock,
  Users,
  Eye,
  Bell,
  FileCheck,
} from "lucide-react";

import { AppLayout } from "@/components/prototype/AppLayout";
import { StatusBadge } from "@/components/prototype/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRole } from "@/lib/role-context";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings & Governance — Swift River" }] }),
  component: SettingsPage,
});

const governanceToggles = [
  { icon: Sparkles, title: "AI adaptive engine", desc: "Personalize difficulty, cues, and hints in real time.", on: true },
  { icon: Eye, title: "Explainable AI notes", desc: "Show learners why the simulation adapted.", on: true },
  { icon: Lock, title: "Instructor override", desc: "Faculty can lock difficulty or disable adaptation per class.", on: true },
  { icon: FileCheck, title: "Human-in-the-loop review", desc: "AI-flagged remediation requires instructor approval before assignment.", on: true },
  { icon: Bell, title: "At-risk alerts", desc: "Notify faculty when a learner's readiness declines.", on: true },
  { icon: Users, title: "Anonymized benchmarking", desc: "Contribute de-identified outcomes to national benchmarks.", on: false },
];

function SettingsPage() {
  const { profile, role } = useRole();
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Governance
        </div>
        <h1 className="mt-1 text-2xl font-bold">Settings & AI Governance</h1>
        <p className="text-sm text-muted-foreground">Keep the adaptive engine supportive, explainable, and instructor-controlled.</p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Configure the AI governance guardrails and adaptation intensity that keep the adaptive engine explainable, safe, and under instructor control.</p>

        {/* Profile */}
        <Card className="mt-6 flex-row items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            {profile.initials}
          </span>
          <div className="flex-1">
            <p className="font-semibold">{profile.name}</p>
            <p className="text-xs text-muted-foreground">{profile.meta}</p>
          </div>
          <StatusBadge tone="primary">{profile.label}</StatusBadge>
        </Card>

        {/* AI governance */}
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-ai" /> AI governance controls
          </h2>
          <Card className="gap-0 divide-y divide-border p-0">
            {governanceToggles.map((t) => (
              <div key={t.title} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <t.icon className="h-4.5 w-4.5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <Switch
                  defaultChecked={t.on}
                  disabled={role === "student"}
                  onCheckedChange={(v) => toast.success(`${t.title} ${v ? "enabled" : "disabled"}`)}
                />
              </div>
            ))}
          </Card>
          {role === "student" && (
            <p className="mt-2 text-xs text-muted-foreground">Governance controls are managed by faculty and program administrators.</p>
          )}
        </div>

        {/* Adaptation intensity */}
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Adaptation intensity
          </h2>
          <Card className="gap-0 p-6">
            <div className="flex items-center justify-between">
              <Label>How aggressively the engine adjusts difficulty</Label>
              <StatusBadge tone="info">Balanced</StatusBadge>
            </div>
            <Slider defaultValue={[60]} max={100} step={10} className="mt-5" disabled={role === "student"} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Gentle scaffolding</span>
              <span>Maximum challenge</span>
            </div>
            <div className="mt-5 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Regardless of intensity, learners never see hidden rationale until a case is complete, and all
              safety-critical decisions are preserved across every difficulty level.
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => toast.info("Changes discarded")}>Cancel</Button>
          <Button onClick={() => toast.success("Governance settings saved")}>Save changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}
