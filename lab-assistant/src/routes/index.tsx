import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Send,
  Sparkles,
  Server,
  Database,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Loader2,
  Clock,
  GraduationCap,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Lab Assistant — Hatsize" },
      { name: "description", content: "Describe a lab in plain language and have the assistant draft a complete lab blueprint." },
    ],
  }),
  component: LabAssistantPage,
});

const PRESET_PROMPTS = [
  "CCNA VLAN lab",
  "Linux hardening",
  "Basic SQL injection",
  "Kubernetes networking deep dive",
];

const SAMPLE_TRANSCRIPT = [
  {
    who: "Instructor",
    text: "I want a 45-minute beginner lab on SQL injection using a vulnerable web app. Students should learn how to exploit a basic login form and then patch it.",
  },
  {
    who: "Assistant",
    text: "Got it. I'll propose a lab with 5 steps, 1 VM template, and auto-grading for final screenshots. Review the blueprint on the right.",
  },
];

type Phase = "empty" | "loading" | "ready";

function LabAssistantPage() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState<typeof SAMPLE_TRANSCRIPT>(SAMPLE_TRANSCRIPT);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generate = (prompt?: string) => {
    if (prompt) setInput(prompt);
    setPhase("loading");
    setTranscript(SAMPLE_TRANSCRIPT);
    setTimeout(() => setPhase("ready"), 1400);
  };

  return (
    <AdminShell
      section="Authoring"
      page="AI Lab Assistant"
      description="Describe a lab in plain language and the assistant drafts a complete, editable blueprint — objectives, environment, step-by-step flow, and an auto-grading rubric."
      tabs={[
        { label: "Blueprint Assistant", active: true },
        { label: "Lab Library" },
        { label: "Templates" },
      ]}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* LEFT: Input */}
        <section className="hatsize-card flex flex-col">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              Describe your lab in plain language
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Use voice or text to describe your lab. The assistant will propose a complete blueprint you can refine.
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Composer */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/40">
              <button
                onClick={() => setListening((l) => !l)}
                aria-label="Hold to speak"
                className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  listening ? "bg-brand text-brand-foreground mic-pulse" : "bg-secondary text-foreground hover:bg-accent"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="Describe the lab you want to create…"
                className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => generate()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground hover:bg-brand-dark transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Submit
              </button>
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground">Mic status:</span>
              {listening ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  Listening…
                </span>
              ) : (
                <span className="text-muted-foreground">Idle — hold the mic to dictate.</span>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-md border border-border bg-secondary/40 p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Conversation
              </div>
              <div className="space-y-3">
                {transcript.map((line, i) => (
                  <div key={i} className="type-in text-[13px] leading-relaxed" style={{ animationDelay: `${i * 120}ms` }}>
                    <span className={`mr-1.5 font-semibold ${line.who === "Assistant" ? "text-brand" : "text-foreground"}`}>
                      {line.who}:
                    </span>
                    <span className="text-muted-foreground">"{line.text}"</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preset prompts */}
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preset prompts
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => generate(p)}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-foreground transition-colors hover:border-brand hover:bg-accent hover:text-accent-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Blueprint */}
        <section className="hatsize-card flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <h2 className="text-[15px] font-semibold text-foreground">Draft Lab Blueprint</h2>
            </div>
            <span className="rounded-sm bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Auto-generated · review before saving
            </span>
          </div>

          {phase === "loading" ? (
            <LoadingBlueprint />
          ) : phase === "empty" ? (
            <EmptyBlueprint />
          ) : (
            <ReadyBlueprint />
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function ReadyBlueprint() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-6 px-6 py-5">
        {/* Title */}
        <Field label="Lab Title">
          <input
            defaultValue="Intro to SQL Injection on Login Forms"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>

        {/* Objectives */}
        <Field label="Learning Objectives">
          <ul className="space-y-1.5 text-[13px] text-foreground">
            {[
              "Identify common SQL injection patterns in user-supplied input.",
              "Exploit a vulnerable login form to bypass authentication.",
              "Inspect database queries to understand the underlying flaw.",
              "Apply parameterized queries and validate the patched application.",
            ].map((o) => (
              <li key={o} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Field>

        {/* Duration / Difficulty */}
        <Field label="Lab Duration & Difficulty">
          <div className="flex flex-wrap gap-2">
            <Pill icon={Clock}>45 minutes</Pill>
            <Pill icon={GraduationCap}>Beginner</Pill>
            <Pill>Cybersecurity</Pill>
            <Pill>Single learner</Pill>
          </div>
        </Field>

        {/* Environment */}
        <Field label="Environment & Topology">
          <div className="overflow-hidden rounded-md border border-border bg-secondary/40">
            {[
              { icon: Server, title: "Vulnerable web server", sub: "Ubuntu 22.04 · DVWA · 1 vCPU / 2 GB" },
              { icon: Database, title: "MySQL database", sub: "MariaDB 10.6 · seed data: users, sessions" },
              { icon: Laptop, title: "Attacker workstation", sub: "Kali Lite · Firefox · curl · sqlmap" },
            ].map((row) => (
              <div key={row.title} className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2.5 last:border-b-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <row.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{row.title}</div>
                  <div className="text-[11.5px] text-muted-foreground">{row.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Field>

        {/* Steps */}
        <Field label="Step-by-step Flow">
          <ol className="space-y-2">
            {[
              { t: "Survey the application", d: "Browse the login page and identify input fields.", out: "Notes on attack surface" },
              { t: "Craft a malicious payload", d: "Use a single-quote based payload to test SQL behavior.", out: "Error message captured" },
              { t: "Bypass authentication", d: "Submit an OR 1=1 payload and gain admin access.", out: "Admin dashboard screenshot" },
              { t: "Inspect the vulnerable query", d: "Open the application source to find unsanitized SQL.", out: "Annotated code snippet" },
              { t: "Patch and re-test", d: "Replace string concat with parameterized query, re-run attack.", out: "Failed exploit screenshot" },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-brand-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-foreground">{s.t}</div>
                    <span className="rounded-sm bg-accent px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-accent-foreground">
                      Expected · {s.out}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Field>

        {/* Rubric */}
        <Field label="Assessment & Grading Rubric">
          <div className="overflow-hidden rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-[12.5px]">
                <thead className="bg-secondary text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold">Deliverable</th>
                    <th className="px-3 py-2 font-semibold">How it is checked</th>
                    <th className="px-3 py-2 font-semibold w-20">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {[
                    ["Exploit screenshot", "Image OCR for 'admin' dashboard text", "30%"],
                    ["Vulnerable query identified", "File diff against expected snippet", "20%"],
                    ["Patched source file", "Automated unit test against payload", "30%"],
                    ["Reflection notes", "Minimum 80-word response", "20%"],
                  ].map(([d, h, w]) => (
                    <tr key={d}>
                      <td className="px-3 py-2 font-medium text-foreground">{d}</td>
                      <td className="px-3 py-2 text-muted-foreground">{h}</td>
                      <td className="px-3 py-2 text-foreground">{w}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Field>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-4">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-accent transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate Blueprint
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-accent transition-colors">
          <Pencil className="h-3.5 w-3.5" />
          Edit Details
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[12.5px] font-semibold text-brand-foreground hover:bg-brand-dark transition-colors">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept & Create Lab Template
        </button>
      </div>
    </div>
  );
}

function EmptyBlueprint() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-brand">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-[14px] font-semibold text-foreground">Your blueprint will appear here</h3>
      <p className="mt-1 max-w-sm text-[12.5px] text-muted-foreground">
        Describe a lab on the left — or pick a preset — and the assistant will draft a complete blueprint you can edit, refine, and publish.
      </p>
    </div>
  );
}

function LoadingBlueprint() {
  return (
    <div className="flex flex-1 flex-col px-6 py-5">
      <div className="mb-5 inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
        Drafting your lab blueprint…
      </div>
      {["w-2/3 h-5", "w-full h-3", "w-5/6 h-3", "w-1/2 h-5", "w-full h-20", "w-1/3 h-5", "w-full h-32"].map((c, i) => (
        <div key={i} className={`mb-3 animate-pulse rounded-md bg-secondary ${c}`} />
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof Clock }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[12px] font-medium text-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 text-brand" />}
      {children}
    </span>
  );
}
