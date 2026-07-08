import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap, RotateCcw, Shield, TrendingUp, UserCog } from "lucide-react";
import { DemoProvider, useDemo, type Role } from "@/components/demo/DemoContext";
import { StudentView } from "@/components/demo/StudentView";
import { InstructorView } from "@/components/demo/InstructorView";
import { AdminView } from "@/components/demo/AdminView";
import { SalesOpsView } from "@/components/demo/SalesOpsView";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "JBL AI — Stakeholder Prototype" },
      {
        name: "description",
        content:
          "Internal prototype of StudyBot and the CRM ↔ Catalogue Match Assistant for Jones & Bartlett Learning.",
      },
    ],
  }),
});

function Index() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}

const ROLES: { id: Role; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "instructor", label: "Instructor", icon: UserCog },
  { id: "admin", label: "Admin", icon: Shield },
  { id: "sales", label: "Sales / Ops", icon: TrendingUp },
];

function Shell() {
  const { role, setRole, resetDemo } = useDemo();
  const [transitioning, setTransitioning] = useState(false);

  const switchRole = (r: Role) => {
    if (r === role) return;
    setTransitioning(true);
    setTimeout(() => {
      setRole(r);
      setTransitioning(false);
    }, 180);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_220)]">
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                <span className="font-serif text-sm font-bold">J</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-tight text-foreground">
                  Jones &amp; Bartlett Learning
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  AI Stakeholder Prototype
                </div>
              </div>
            </div>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              <span className="text-foreground">Dashboard</span>
              <span className="hover:text-foreground cursor-default">My Titles</span>
              <span className="hover:text-foreground cursor-default">Course Materials</span>
              <span className="hover:text-foreground cursor-default">Support</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-full border bg-muted/40 p-0.5">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => switchRole(r.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    role === r.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <r.icon className="h-3.5 w-3.5" />
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                resetDemo();
                toast.success("Demo reset");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Demo
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              JP
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-5">
        <RoleBanner role={role} />
        <div
          className={cn(
            "mt-4 transition-all duration-200",
            transitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0 animate-fade-in",
          )}
          key={role}
        >
          {role === "student" && <StudentView />}
          {role === "instructor" && <InstructorView />}
          {role === "admin" && <AdminView />}
          {role === "sales" && <SalesOpsView />}
        </div>

        <AssumptionsFooter />
      </div>
    </div>
  );
}

function RoleBanner({ role }: { role: Role }) {
  const meta: Record<Role, { title: string; sub: string; desc?: string }> = {
    student: {
      title: "Student · Course Reader",
      sub: "NURS 340 · Adult Critical Care · Fall 2026",
    },
    instructor: {
      title: "Instructor · Course Materials",
      sub: "Dr. R. Halvorsen · NURS 340 · Section 02",
    },
    admin: {
      title: "Content Admin · Governance Console",
      sub: "Jones & Bartlett Learning · Publishing Ops",
    },
    sales: {
      title: "Sales &amp; Ops · Account Reconciliation",
      sub: "Higher Ed Sales Region · East",
      desc: "AI-assisted matching of Salesforce CRM institutional accounts against the JBL catalogue — surfaces, scores, and confirms account matches with a full audit trail.",
    },
  };
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight text-foreground"
          dangerouslySetInnerHTML={{ __html: meta[role].title }}
        />
        <p className="mt-0.5 text-sm text-muted-foreground">{meta[role].sub}</p>
        {meta[role].desc && (
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            {meta[role].desc}
          </p>
        )}
      </div>
    </div>
  );
}

function AssumptionsFooter() {
  return (
    <div className="mt-10 rounded-lg border border-dashed bg-background/60 p-4 text-xs text-muted-foreground">
      <strong className="text-foreground">Prototype note.</strong> No JBL design system
      reference was provided; visual style falls back to a clean clinical-education
      baseline (single teal accent, generous whitespace, serif for long-form reading).
      All AI responses are pre-scripted mock data. Use{" "}
      <span className="font-medium text-foreground">Reset Demo</span> to restore
      initial state between run-throughs.
    </div>
  );
}
