import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiTag, AiThinking } from "./AiTag";
import { useDemo, type Match } from "./DemoContext";
import { cn } from "@/lib/utils";

const CURRENT_USER = "Jordan Park (Sales Ops)";

export function SalesOpsView() {
  const { matches, updateMatch, audit, addAudit } = useDemo();
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState<Match | null>(null);
  const [suggestDismissed, setSuggestDismissed] = useState(false);

  const pending = matches.filter((m) => m.status === "pending" || m.status === "conflict");
  const confirmed = matches.filter((m) => m.status === "confirmed");
  const rejected = matches.filter((m) => m.status === "rejected");

  const acceptedDomainMatches = useMemo(
    () => confirmed.filter((m) => m.evidence.emailDomain).length,
    [confirmed],
  );
  const showSuggest = acceptedDomainMatches >= 2 && !suggestDismissed;

  const runMatch = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
      toast.success("Match job complete · 6 candidates surfaced");
    }, 2000);
  };

  const acceptRow = (m: Match) => {
    if (m.status === "conflict") {
      setConflictOpen(m);
      return;
    }
    const stamp = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    updateMatch(m.id, {
      status: "confirmed",
      confirmedAt: stamp,
      confirmedBy: CURRENT_USER,
    });
    addAudit(`Accepted: ${m.institution} match`);
    toast.success(`Match confirmed · ${m.institution}`);
  };

  const rejectRow = (m: Match) => {
    updateMatch(m.id, { status: "rejected" });
    addAudit(`Rejected: ${m.institution}`);
    toast("Match rejected");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">CRM ↔ Catalogue Match Assistant</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Reconcile Salesforce institutional accounts against JBL catalogue accounts.
          </p>
        </div>
        <Button onClick={runMatch} disabled={running} size="lg">
          {running ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Running match…
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {ran ? "Re-run Match Job" : "Run Match Job"}
            </>
          )}
        </Button>
      </div>

      {showSuggest && (
        <div className="animate-fade-in flex items-start justify-between gap-4 rounded-lg border border-[color:var(--ai-border)] bg-[color:var(--ai-soft)]/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-background text-[color:var(--ai)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Noticed a pattern
                </span>
                <AiTag label="Suggestion" />
              </div>
              <p className="mt-1 text-sm text-foreground/80">
                You've accepted {acceptedDomainMatches} matches sharing an email domain.
                Auto-suggest matches with matching email domain going forward?
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuggestDismissed(true)}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSuggestDismissed(true);
                toast.success("Rule enabled: auto-suggest matches on shared email domain");
              }}
            >
              Accept rule
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          {!ran && !running && (
            <div className="rounded-lg border border-dashed bg-card p-16 text-center text-sm text-muted-foreground">
              Click <strong>Run Match Job</strong> to surface candidate account matches.
            </div>
          )}

          {running && (
            <div className="rounded-lg border bg-card p-16 text-center">
              <AiThinking label="Reconciling 6,412 CRM accounts against catalogue" />
              <div className="mx-auto mt-4 h-1 w-64 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 animate-pulse bg-[color:var(--ai)]" />
              </div>
            </div>
          )}

          {ran && (
            <>
              {pending.length > 0 && (
                <Section title="Needs review" count={pending.length}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="w-6" />
                        <th className="px-3 py-2 font-semibold">Institution</th>
                        <th className="px-3 py-2 font-semibold">CRM ID</th>
                        <th className="px-3 py-2 font-semibold">JBL ID</th>
                        <th className="px-3 py-2 font-semibold">Confidence</th>
                        <th className="px-3 py-2 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((m) => (
                        <Fragment key={m.id}>
                          <tr
                            onClick={() =>
                              setExpanded((e) => (e === m.id ? null : m.id))
                            }
                            className={cn(
                              "cursor-pointer border-b transition-colors hover:bg-muted/40",
                              m.status === "conflict" &&
                                "bg-destructive/5 hover:bg-destructive/10",
                            )}
                          >
                            <td className="pl-3">
                              {expanded === m.id ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                {m.status === "conflict" && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <span className="font-medium text-foreground">
                                  {m.institution}
                                </span>
                                <AiTag />
                              </div>
                            </td>
                            <td className="px-3 py-3 text-muted-foreground">{m.crmId}</td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {m.status === "conflict" ? (
                                <span className="text-destructive">
                                  {m.jblId} / {m.jblIdAlt}
                                </span>
                              ) : (
                                m.jblId
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <ConfidenceBar value={m.confidence} />
                            </td>
                            <td
                              className="px-3 py-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex gap-1">
                                <RowBtn
                                  tone="success"
                                  icon={Check}
                                  label={m.status === "conflict" ? "Resolve" : "Accept"}
                                  onClick={() => acceptRow(m)}
                                />
                                <RowBtn
                                  tone="destructive"
                                  icon={X}
                                  label="Reject"
                                  onClick={() => rejectRow(m)}
                                />
                                <RowBtn
                                  tone="muted"
                                  icon={Sparkles}
                                  label="Edit Rule"
                                  onClick={() =>
                                    toast("Rule editor — demo only")
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                          {expanded === m.id && (
                            <tr className="border-b bg-muted/20">
                              <td colSpan={6} className="px-6 py-4">
                                <EvidencePanel m={m} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {confirmed.length > 0 && (
                <Section title="Confirmed" count={confirmed.length} tone="success">
                  <table className="w-full text-sm">
                    <tbody>
                      {confirmed.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-[color:var(--success)]" />
                              <span className="font-medium text-foreground">
                                {m.institution}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {m.crmId} → {m.jblId}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                            {m.confirmedAt} · by {m.confirmedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {rejected.length > 0 && (
                <Section title="Rejected" count={rejected.length}>
                  <table className="w-full text-sm">
                    <tbody>
                      {rejected.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="px-4 py-2.5 text-muted-foreground line-through">
                            {m.institution}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                            {m.crmId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}
            </>
          )}
        </div>

        <aside className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">Audit Log</div>
          <div className="p-3">
            {audit.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No actions yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {audit.map((a) => (
                  <li
                    key={a.id}
                    className="animate-fade-in rounded-md border-l-2 border-[color:var(--ai)]/50 bg-muted/30 px-3 py-2 text-xs"
                  >
                    <div className="text-foreground">{a.text}</div>
                    <div className="mt-0.5 text-muted-foreground">{a.time}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Dialog
        open={!!conflictOpen}
        onOpenChange={(o) => !o && setConflictOpen(null)}
      >
        <DialogContent className="max-w-2xl">
          {conflictOpen && (
            <ConflictModal
              m={conflictOpen}
              onPick={(jblId) => {
                const stamp = new Date().toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });
                updateMatch(conflictOpen.id, {
                  jblId,
                  status: "confirmed",
                  confirmedAt: stamp,
                  confirmedBy: CURRENT_USER,
                });
                addAudit(`Resolved conflict: ${conflictOpen.institution} → ${jblId}`);
                toast.success(`Conflict resolved · ${conflictOpen.institution}`);
                setConflictOpen(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  count,
  children,
  tone,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  tone?: "success";
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5 text-sm font-semibold",
          tone === "success" && "bg-[color:var(--success)]/5",
        )}
      >
        <span>{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 85
      ? "var(--success)"
      : value >= 60
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: `color-mix(in oklab, ${color} 100%, transparent)` }}
        />
      </div>
      <span className="w-9 text-xs font-medium tabular-nums text-foreground">{value}%</span>
    </div>
  );
}

function EvidencePanel({ m }: { m: Match }) {
  const items = [
    { label: "Matched email domain (@nursing.stateu.edu)", ok: m.evidence.emailDomain },
    { label: "Billing address similarity (94% token overlap)", ok: m.evidence.billingAddress },
    { label: "Recent order ID overlap (3 shared invoices in 12mo)", ok: m.evidence.orderOverlap },
  ];
  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <AiTag label="Evidence" />
        Match signals
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-sm">
            {it.ok ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <X className="h-3 w-3" />
              </span>
            )}
            <span className={it.ok ? "text-foreground/90" : "text-muted-foreground"}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
      {m.status === "conflict" && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          <strong>Conflict: </strong>
          {m.conflictNote}
        </div>
      )}
    </div>
  );
}

function RowBtn({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone: "success" | "destructive" | "muted";
}) {
  const cls =
    tone === "success"
      ? "border-[color:var(--success)]/30 text-[color:var(--success)] hover:bg-[color:var(--success)]/10"
      : tone === "destructive"
        ? "border-destructive/30 text-destructive hover:bg-destructive/10"
        : "border-border text-muted-foreground hover:bg-muted";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function ConflictModal({
  m,
  onPick,
}: {
  m: Match;
  onPick: (jblId: string) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const opts = [
    { id: m.jblId, label: "JBL Option A", detail: "Summit Allied Health College · Nursing Div." },
    { id: m.jblIdAlt!, label: "JBL Option B", detail: "Summit Allied Health College · EMS Div." },
  ];
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Resolve conflicting match
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          {m.institution} — pick the correct catalogue account.
        </p>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-2">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => setPick(o.id)}
            className={cn(
              "rounded-lg border-2 p-4 text-left transition-all",
              pick === o.id
                ? "border-primary bg-primary-soft"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {o.label}
            </div>
            <div className="mt-1 text-sm font-semibold">{o.id}</div>
            <div className="mt-1 text-xs text-muted-foreground">{o.detail}</div>
          </button>
        ))}
      </div>
      <DialogFooter>
        <Button disabled={!pick} onClick={() => pick && onPick(pick)}>
          Confirm selection
        </Button>
      </DialogFooter>
    </>
  );
}
