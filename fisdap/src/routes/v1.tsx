import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Lock,
  MessageSquare,
  Paperclip,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/v1")({
  head: () => ({
    meta: [
      { title: "AI Shift Feedback Copilot — FISDAP" },
      {
        name: "description",
        content:
          "Instructor-led AI assistance for reviewing EMS student shift logs. Draft feedback faster while preserving human approval.",
      },
      { property: "og:title", content: "AI Shift Feedback Copilot — FISDAP" },
      {
        property: "og:description",
        content: "Instructor-led AI assistance for reviewing EMS student shift logs.",
      },
    ],
  }),
  component: Index,
});

type View = "dashboard" | "review";
type Student = {
  id: string;
  name: string;
  cohort: string;
  course: string;
  shiftDate: string;
  site: string;
  encounters: number;
  status: "ai-ready" | "data-check" | "review-pending" | "approved";
  competency: string;
  complete: boolean;
};

const STUDENTS: Student[] = [
  {
    id: "s-001",
    name: "Marcus Reyes",
    cohort: "EMT-24-Fall",
    course: "EMT 220 — Clinical Rotations",
    shiftDate: "Oct 14, 2025",
    site: "Mercy General — ED",
    encounters: 4,
    status: "ai-ready",
    competency: "Cardiac Assessment",
    complete: true,
  },
  {
    id: "s-002",
    name: "Priya Anand",
    cohort: "Paramedic-24-Spring",
    course: "PARA 310 — Field Internship",
    shiftDate: "Oct 14, 2025",
    site: "Metro EMS — Unit 12",
    encounters: 6,
    status: "data-check",
    competency: "Respiratory Distress",
    complete: false,
  },
  {
    id: "s-003",
    name: "Jordan Klein",
    cohort: "EMT-24-Fall",
    course: "EMT 220 — Clinical Rotations",
    shiftDate: "Oct 13, 2025",
    site: "St. Luke's — ED",
    encounters: 3,
    status: "review-pending",
    competency: "Trauma Triage",
    complete: true,
  },
  {
    id: "s-004",
    name: "Alicia Tran",
    cohort: "Paramedic-24-Spring",
    course: "PARA 310 — Field Internship",
    shiftDate: "Oct 13, 2025",
    site: "Metro EMS — Unit 7",
    encounters: 5,
    status: "ai-ready",
    competency: "Pediatric Assessment",
    complete: true,
  },
  {
    id: "s-005",
    name: "Devon Walker",
    cohort: "EMT-24-Fall",
    course: "EMT 220 — Clinical Rotations",
    shiftDate: "Oct 12, 2025",
    site: "Mercy General — ED",
    encounters: 2,
    status: "approved",
    competency: "Patient Handoff",
    complete: true,
  },
];

function Index() {
  const [view, setView] = useState<View>("dashboard");
  const [selected, setSelected] = useState<Student>(STUDENTS[1]); // start with the incomplete one to demo safety
  const [draft, setDraft] = useState("");
  const [draftEdited, setDraftEdited] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [approved, setApproved] = useState<Record<string, boolean>>({ "s-005": true });

  const openReview = (s: Student) => {
    setSelected(s);
    setDraft(buildDraft(s));
    setDraftEdited(false);
    setView("review");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Stepper view={view} approved={!!approved[selected.id]} />
      {view === "dashboard" ? (
        <Dashboard
          onOpen={openReview}
          approved={approved}
        />
      ) : (
        <ReviewPage
          student={selected}
          draft={draft}
          setDraft={(v) => {
            setDraft(v);
            setDraftEdited(true);
          }}
          edited={draftEdited}
          approved={!!approved[selected.id]}
          onBack={() => setView("dashboard")}
          onApprove={() => setShowApprove(true)}
        />
      )}
      {showApprove && (
        <ApproveModal
          student={selected}
          onClose={() => setShowApprove(false)}
          onConfirm={() => {
            setApproved((a) => ({ ...a, [selected.id]: true }));
            setShowApprove(false);
          }}
        />
      )}
      <Footer />
    </div>
  );
}

/* ---------------- Top Bar ---------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      {/* The brand, nav and control cluster need ~940px on one line, so the row
          keeps wrapping until there is room for it — nowrap at md overflowed a tablet. */}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:gap-6 md:px-8 lg:flex-nowrap">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-semibold tracking-tight">FISDAP</div>
            <div className="text-[11px] text-muted-foreground">EMS Education Platform</div>
          </div>
        </div>
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          {["Shifts", "Skills", "Testing", "Reports"].map((n) => (
            <button
              key={n}
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {n}
            </button>
          ))}
          <button className="rounded-md bg-primary-soft px-3 py-1.5 font-medium text-primary">
            Feedback Copilot
          </button>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground md:flex">
            <Search className="h-4 w-4" />
            <span>Search students, shifts…</span>
            <kbd className="ml-6 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </div>
          <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
          </button>
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              EM
            </div>
            <div className="leading-tight pr-1">
              <div className="text-xs font-medium">Dr. Elena Moss</div>
              <div className="text-[10px] text-muted-foreground">Lead Instructor</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Stepper ---------------- */

function Stepper({ view, approved }: { view: View; approved: boolean }) {
  const steps = [
    { k: "review", label: "Review", icon: ClipboardList },
    { k: "edit", label: "Edit", icon: FileText },
    { k: "approve", label: "Approve", icon: CheckCircle2 },
  ];
  const active = view === "dashboard" ? -1 : approved ? 3 : 1;
  return (
    <div className="border-b border-border bg-surface-muted">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 py-3 md:flex-row md:items-center md:gap-0 md:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex-nowrap">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium uppercase tracking-wider text-foreground/70">
            AI Shift Feedback Copilot
          </span>
          <span className="text-border-strong">/</span>
          <span>{view === "dashboard" ? "Instructor Dashboard" : "Shift Review"}</span>
        </div>
        <div className="flex w-full items-center gap-1 overflow-x-auto md:w-auto md:overflow-visible">
          {steps.map((s, i) => {
            const isActive = i <= active;
            const Icon = s.icon;
            return (
              <div key={s.k} className="flex shrink-0 items-center">
                <div
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground ring-1 ring-border"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="mx-1 h-3.5 w-3.5 text-border-strong" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function Dashboard({
  onOpen,
  approved,
}: {
  onOpen: (s: Student) => void;
  approved: Record<string, boolean>;
}) {
  const stats = [
    { label: "Shifts awaiting review", value: 14, icon: ClipboardList, tone: "primary" as const },
    { label: "AI drafts ready", value: 9, icon: Sparkles, tone: "info" as const },
    { label: "Data checks flagged", value: 3, icon: AlertTriangle, tone: "warning" as const },
    { label: "Approved this week", value: 27, icon: CheckCircle2, tone: "success" as const },
  ];

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instructor Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review AI-drafted shift feedback. All approvals require your sign-off.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-info-soft px-3 py-2 text-xs text-primary">
          <Shield className="h-3.5 w-3.5" />
          AI drafts are advisory. Instructor approval required for publication.
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        {["All cohorts", "All courses", "Last 7 days", "All competencies"].map((f, i) => (
          <button
            key={f}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              i === 0
                ? "border-primary/40 bg-primary-soft text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">5</span> of 14 submissions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-surface-muted text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Cohort / Course</th>
              <th className="px-5 py-3 font-medium">Shift</th>
              <th className="px-5 py-3 font-medium">Encounters</th>
              <th className="px-5 py-3 font-medium">Competency</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STUDENTS.map((s) => (
              <tr
                key={s.id}
                onClick={() => onOpen(s)}
                className="cursor-pointer transition hover:bg-surface-muted"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.id.toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-foreground">{s.cohort}</div>
                  <div className="text-xs text-muted-foreground">{s.course}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div>{s.shiftDate}</div>
                  <div className="text-xs text-muted-foreground">{s.site}</div>
                </td>
                <td className="px-5 py-3.5 tabular-nums">{s.encounters}</td>
                <td className="px-5 py-3.5 text-foreground/90">{s.competency}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={approved[s.id] ? "approved" : s.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Open <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        Drafts are generated from logged patient encounter data. The instructor remains the source of record for feedback and competency sign-off.
      </p>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone: "primary" | "info" | "warning" | "success";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-primary",
    warning: "bg-warning-soft text-warning-foreground",
    success: "bg-success-soft text-success",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Student["status"] }) {
  const map: Record<Student["status"], { label: string; cls: string; dot: string }> = {
    "ai-ready": {
      label: "AI Draft Ready",
      cls: "bg-info-soft text-primary ring-primary/20",
      dot: "bg-primary",
    },
    "data-check": {
      label: "Needs Data Check",
      cls: "bg-warning-soft text-warning-foreground ring-warning/30",
      dot: "bg-warning",
    },
    "review-pending": {
      label: "Instructor Review Pending",
      cls: "bg-secondary text-secondary-foreground ring-border-strong",
      dot: "bg-muted-foreground",
    },
    approved: {
      label: "Approved",
      cls: "bg-success-soft text-success ring-success/30",
      dot: "bg-success",
    },
  };
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${m.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ---------------- Review Page ---------------- */

function ReviewPage({
  student,
  draft,
  setDraft,
  edited,
  approved,
  onBack,
  onApprove,
}: {
  student: Student;
  draft: string;
  setDraft: (v: string) => void;
  edited: boolean;
  approved: boolean;
  onBack: () => void;
  onApprove: () => void;
}) {
  const showWarning = !student.complete;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
      {/* Breadcrumb + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground md:flex-nowrap">
          <button onClick={onBack} className="hover:text-foreground">
            Dashboard
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Shift Review — {student.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Submitted 2h ago · {student.shiftDate}
        </div>
      </div>

      {/* Header card */}
      <div className="mb-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{student.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{student.cohort}</span>
                <span>{student.course}</span>
                <span>{student.site}</span>
                <span>{student.encounters} patient encounters</span>
              </div>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                Compare the logged encounter data against the AI draft and rubric, then edit and give final sign-off on this student's shift.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={approved ? "approved" : student.status} />
            {approved && (
              <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success ring-1 ring-success/30">
                <Lock className="h-3 w-3" /> Final score locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data quality warning */}
      {showWarning && <DataWarningBanner />}

      {/* Three-panel layout */}
      <div className="grid grid-cols-12 gap-4">
        <EncounterPanel student={student} />
        <DraftPanel
          student={student}
          draft={draft}
          setDraft={setDraft}
          edited={edited}
          approved={approved}
          onApprove={onApprove}
          warning={showWarning}
        />
        <RubricPanel approved={approved} />
      </div>
    </main>
  );
}

function DataWarningBanner() {
  return (
    <div className="mb-4 rounded-lg border border-warning/40 bg-warning-soft p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-warning text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-0">
            <h3 className="text-sm font-semibold text-warning-foreground">
              Data completeness check — AI draft generated from partial data
            </h3>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning-foreground">
              Action needed
            </span>
          </div>
          <p className="mt-1 text-xs text-warning-foreground/90">
            Instructor must verify before approval. The following fields are missing or look incomplete in Encounter #2:
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-warning-foreground/90 md:grid-cols-2">
            <li>• Repeat vitals after intervention</li>
            <li>• SpO₂ trend (single reading only)</li>
            <li>• Medication dose verification</li>
            <li>• Transfer-of-care narrative</li>
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2 md:flex-nowrap">
            <button className="rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-warning-foreground hover:opacity-90">
              Request clarification from student
            </button>
            <button className="rounded-md border border-warning/40 bg-surface px-3 py-1.5 text-xs font-medium text-warning-foreground hover:bg-warning-soft">
              View missing fields
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Left: Encounter Data -------- */

function EncounterPanel({ student }: { student: Student }) {
  const incomplete = !student.complete;
  return (
    <section className="col-span-12 lg:col-span-3 space-y-4">
      <PanelHeader icon={ClipboardList} title="Encounter Data" subtitle="Logged by student" />

      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Encounter #2 of {student.encounters}</span>
            <span className="text-[11px] text-muted-foreground">14:22 — 14:58</span>
          </div>
          <div className="mt-1 text-sm font-semibold">
            {incomplete ? "Respiratory distress, adult female" : "Chest pain, adult male"}
          </div>
        </div>

        <div className="divide-y divide-border">
          <Field label="Chief complaint" value={incomplete ? "Shortness of breath, 2 days" : "Substernal chest pressure, radiates left arm"} />
          <Field label="Patient" value={incomplete ? "Female, 67y" : "Male, 58y"} />

          <div className="px-4 py-3">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vitals</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Vital label="HR" value={incomplete ? "112" : "96"} />
              <Vital label="BP" value={incomplete ? "148/92" : "142/88"} />
              <Vital label="RR" value={incomplete ? "28" : "18"} />
              <Vital
                label="SpO₂"
                value={incomplete ? "89%" : "97%"}
                flag={incomplete}
                tip="Single reading — repeat measurement missing"
              />
              <Vital label="Temp" value="36.8°C" />
              <Vital
                label="Repeat vitals"
                value={incomplete ? "Missing" : "Logged ×2"}
                flag={incomplete}
                tip="Required for monitored interventions"
              />
            </div>
          </div>

          <Field
            label="Interventions"
            value={incomplete ? "Albuterol 2.5 mg nebulized" : "ASA 324mg PO, NTG 0.4mg SL, IV access, 12-lead ECG"}
          />
          <Field
            label="Medication verification"
            value={incomplete ? "Not documented" : "Dose & route verified"}
            flag={incomplete}
          />
          <Field label="Disposition" value="Transport, Code 2" />

          <div className="px-4 py-3">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Attachments
            </div>
            <div className="space-y-1.5">
              <Attachment name="12-lead-ecg.pdf" size="184 KB" />
              <Attachment name="patient-care-report.pdf" size="92 KB" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${flag ? "text-warning-foreground" : "text-foreground"}`}>
        <span className="inline-flex items-center gap-1.5">
          {flag && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
          {value}
        </span>
      </div>
    </div>
  );
}

function Vital({
  label,
  value,
  flag,
  tip,
}: {
  label: string;
  value: string;
  flag?: boolean;
  tip?: string;
}) {
  return (
    <div
      title={tip}
      className={`rounded-md border px-2.5 py-1.5 ${
        flag ? "border-warning/40 bg-warning-soft" : "border-border bg-surface-muted"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium tabular-nums ${flag ? "text-warning-foreground" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Attachment({ name, size }: { name: string; size: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-2.5 py-1.5">
      <div className="flex items-center gap-2 text-xs">
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{name}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{size}</span>
    </div>
  );
}

/* -------- Center: Draft -------- */

function DraftPanel({
  student,
  draft,
  setDraft,
  edited,
  approved,
  onApprove,
  warning,
}: {
  student: Student;
  draft: string;
  setDraft: (v: string) => void;
  edited: boolean;
  approved: boolean;
  onApprove: () => void;
  warning: boolean;
}) {
  return (
    <section className="col-span-12 lg:col-span-6 space-y-4">
      <PanelHeader
        icon={Sparkles}
        title="AI-Drafted Feedback"
        subtitle="AI draft for review only · Instructor approval required"
        right={
          <span className="inline-flex items-center gap-1.5 rounded-md bg-info-soft px-2 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Generated 2 min ago
          </span>
        }
      />

      <div className="rounded-lg border border-border bg-surface shadow-sm">
        {/* Reasoning chip */}
        <div className="flex items-start gap-3 border-b border-border bg-info-soft/60 px-5 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-xs leading-relaxed text-foreground/80">
            <span className="font-semibold text-foreground">Why this competency was suggested:</span>{" "}
            {student.competency} mapping is based on chief complaint, interventions performed, and
            the assessment sequence logged in this shift. Suggestion confidence:{" "}
            <span className="font-medium text-foreground">{warning ? "Moderate — partial data" : "High"}</span>.
          </div>
        </div>

        {/* Editable narrative */}
        <div className="px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Narrative feedback {edited && <span className="ml-1 text-primary">· Edited</span>}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {draft.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={approved}
            rows={12}
            className="w-full resize-none rounded-md border border-border bg-surface-muted/40 p-3 font-sans text-sm leading-relaxed text-foreground outline-none ring-ring/20 focus:bg-surface focus:ring-2 disabled:opacity-70"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            You can edit any part of this draft. Highlighted phrases below indicate AI inferences from incomplete fields.
          </p>
        </div>

        {/* Suggested competency */}
        <div className="border-t border-border px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Suggested competency mapping
            </div>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              Draft — not final
            </span>
          </div>
          <div className="rounded-md border border-border bg-surface-muted/60 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{student.competency}</div>
              <div className="text-xs text-muted-foreground">
                Suggested score:{" "}
                <span className="font-semibold text-foreground">{warning ? "3 / 5" : "4 / 5"}</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-primary"
                style={{ width: warning ? "60%" : "80%" }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Final score locked after instructor approval. AI suggestion does not sign off competency.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-5 py-3 md:flex-nowrap">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            AI does not auto-publish. Instructor approval required.
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <button
              disabled={approved}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
            >
              Edit Draft
            </button>
            <button
              disabled={approved}
              className="rounded-md border border-warning/40 bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning-foreground hover:bg-warning/15 disabled:opacity-60"
            >
              Mark Needs Correction
            </button>
            <button
              onClick={onApprove}
              disabled={approved}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {approved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Approved
                </>
              ) : (
                <>
                  Approve Final Feedback <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------- Right: Rubric -------- */

function RubricPanel({ approved }: { approved: boolean }) {
  const items = [
    { label: "Scene size-up & safety", state: "met" as const, evidence: "PCR §1" },
    { label: "Primary assessment (ABCs)", state: "met" as const, evidence: "PCR §2" },
    { label: "Vitals trend documentation", state: "partial" as const, evidence: "Vitals log" },
    { label: "Intervention rationale", state: "met" as const, evidence: "Narrative" },
    { label: "Medication verification", state: "missing" as const, evidence: "—" },
    { label: "Reassessment after intervention", state: "partial" as const, evidence: "Vitals log" },
    { label: "Handoff / transfer of care", state: "met" as const, evidence: "PCR §6" },
  ];
  return (
    <section className="col-span-12 lg:col-span-3 space-y-4">
      <PanelHeader icon={CheckCircle2} title="Rubric & Competency" subtitle="Evidence checklist" />
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          National EMS Rubric — Adult Respiratory
        </div>
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.label} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="flex items-start gap-2.5">
                <RubricDot state={it.state} />
                <div>
                  <div className="text-sm">{it.label}</div>
                  <div className="text-[11px] text-muted-foreground">Evidence: {it.evidence}</div>
                </div>
              </div>
              <RubricTag state={it.state} />
            </li>
          ))}
        </ul>
        <div className="border-t border-border bg-surface-muted/60 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall coverage</span>
            <span className="font-semibold tabular-nums">5 / 7</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary" style={{ width: "71%" }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          Instructor private notes
        </div>
        <textarea
          rows={4}
          disabled={approved}
          placeholder="Add a note visible only to instructors…"
          className="w-full resize-none rounded-md border border-border bg-surface-muted/40 p-2 text-xs outline-none focus:bg-surface focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="rounded-lg border border-border bg-info-soft p-3 text-[11px] leading-relaxed text-primary">
        <div className="mb-1 flex items-center gap-1.5 font-semibold">
          <HelpCircle className="h-3.5 w-3.5" /> About this draft
        </div>
        Generated by FISDAP Copilot from logged encounter data. Drafts are advisory only.
        The instructor remains the source of record for feedback and competency sign-off.
      </div>
    </section>
  );
}

function RubricDot({ state }: { state: "met" | "partial" | "missing" }) {
  const cls = {
    met: "bg-success",
    partial: "bg-warning",
    missing: "bg-destructive/70",
  }[state];
  return <span className={`mt-1.5 inline-block h-2 w-2 rounded-full ${cls}`} />;
}
function RubricTag({ state }: { state: "met" | "partial" | "missing" }) {
  const map = {
    met: { label: "Met", cls: "bg-success-soft text-success ring-success/30" },
    partial: { label: "Partial", cls: "bg-warning-soft text-warning-foreground ring-warning/30" },
    missing: { label: "Missing", cls: "bg-destructive/10 text-destructive ring-destructive/30" },
  }[state];
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map.cls}`}>
      {map.label}
    </span>
  );
}

/* ---------------- Modal ---------------- */

function ApproveModal({
  student,
  onClose,
  onConfirm,
}: {
  student: Student;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
        <div className="px-5 pt-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Confirm final approval</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Instructor review required. AI draft is not published until approved.
              </p>
            </div>
          </div>
        </div>

        <div className="m-5 rounded-md border border-border bg-surface-muted/60 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{student.name}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Competency</span>
            <span className="font-medium">{student.competency}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Final score (locks on approval)</span>
            <span className="font-semibold">{student.complete ? "4 / 5" : "3 / 5"}</span>
          </div>
        </div>

        <ul className="space-y-1.5 px-5 pb-2 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-success" /> Feedback becomes the official record
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-success" /> Competency score locks for this shift
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-success" /> Student is notified
          </li>
        </ul>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-muted/40 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            <Lock className="h-3.5 w-3.5" /> Approve & Publish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Misc ---------------- */

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: typeof Activity;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted/60">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 px-4 py-4 text-[11px] text-muted-foreground md:flex-row md:items-center md:gap-0 md:px-8">
        <div className="flex items-start gap-2 md:items-center">
          <Shield className="h-3.5 w-3.5" />
          FISDAP Copilot follows institutional AI policy. All feedback and competency sign-off remain
          the instructor's responsibility.
        </div>
        <div className="flex items-center gap-4">
          <span>v0.4 · Prototype</span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> Dr. Elena Moss
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Helpers ---------------- */

function buildDraft(s: Student): string {
  if (!s.complete) {
    return `During this shift, ${s.name.split(" ")[0]} cared for an adult female (67y) presenting with shortness of breath of two days' duration. The student completed an initial primary assessment, identified respiratory distress (RR 28, SpO₂ 89% on room air), and initiated a nebulized albuterol treatment.

Strengths: prompt recognition of respiratory compromise and appropriate selection of bronchodilator therapy. Communication with the receiving facility was concise and clinically relevant.

Areas to develop: documentation of repeat vitals following intervention was not captured in the log, and medication dose verification was not noted. A second SpO₂ reading would strengthen the assessment of intervention effectiveness. Recommend reviewing reassessment timing standards and documentation expectations prior to the next shift.

— Draft generated from partial encounter data. Instructor to verify before approval.`;
  }
  return `During this shift, ${s.name.split(" ")[0]} cared for an adult male (58y) presenting with substernal chest pressure radiating to the left arm. The student performed a structured primary assessment, obtained a 12-lead ECG within target timing, and administered ASA 324 mg PO and NTG 0.4 mg SL with appropriate verification of dose and route.

Strengths: methodical assessment sequence, clear clinical reasoning for intervention selection, and a well-organized handoff to the receiving ED team. Repeat vitals were captured and trended appropriately.

Areas to develop: continue building speed on 12-lead interpretation and consider verbalizing differential diagnoses during patient care to support clinical decision-making narrative.

— Draft prepared by Copilot for instructor review.`;
}
