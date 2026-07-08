import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiTag } from "./AiTag";
import { ChapterReader } from "./ChapterReader";
import { useDemo, type QuizQ } from "./DemoContext";

export function InstructorView() {
  const { quiz, updateQuiz, quizAssigned, setQuizAssigned } = useDemo();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState<Record<string, boolean>>({});

  const allResolved = useMemo(
    () => quiz.every((q) => q.status === "approved" || q.status === "edited"),
    [quiz],
  );

  return (
    <div className="grid grid-cols-[55fr_45fr] gap-4">
      <ChapterReader />
      <div className="flex h-[calc(100vh-140px)] flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Review AI-Generated Quiz</span>
              <AiTag />
            </div>
            <div className="text-[11px] text-muted-foreground">
              {quiz.filter((q) => q.status === "approved" || q.status === "edited").length} of{" "}
              {quiz.length} resolved
            </div>
          </div>
          <Button
            disabled={!allResolved || quizAssigned}
            onClick={() => {
              setQuizAssigned(true);
              toast.success("Quiz assigned to NURS 340 · Section 02 (34 students)");
            }}
          >
            {quizAssigned ? "Assigned ✓" : "Assign to class"}
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {quiz.map((q, i) => (
            <div
              key={q.id}
              className="animate-fade-in overflow-hidden rounded-lg border bg-background transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-muted-foreground">Q{i + 1}</span>
                  <StatusBadge status={q.status} />
                  <span className="text-muted-foreground">
                    based on paragraph {q.paragraph.replace("p", "")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {q.status === "edited" && q.originalQuestion && (
                    <button
                      onClick={() =>
                        setShowDiff((s) => ({ ...s, [q.id]: !s[q.id] }))
                      }
                      className="rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                    >
                      {showDiff[q.id] ? "Hide diff" : "View diff"}
                    </button>
                  )}
                  <IconAction
                    icon={Pencil}
                    label="Edit"
                    onClick={() => setEditingId(q.id)}
                  />
                  <IconAction
                    icon={Check}
                    label="Approve"
                    tone="success"
                    active={q.status === "approved"}
                    onClick={() => {
                      updateQuiz(q.id, { status: "approved" });
                      toast.success(`Q${i + 1} approved`);
                    }}
                  />
                  <IconAction
                    icon={X}
                    label="Reject"
                    tone="destructive"
                    onClick={() => {
                      updateQuiz(q.id, { status: "rejected" });
                      toast("Q" + (i + 1) + " rejected — hidden from set");
                    }}
                  />
                </div>
              </div>

              <div className="p-3">
                {showDiff[q.id] && q.originalQuestion ? (
                  <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                      <div className="mb-1 text-[10px] font-semibold uppercase text-destructive">
                        AI original
                      </div>
                      <div className="text-foreground/80">{q.originalQuestion}</div>
                    </div>
                    <div className="rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-2">
                      <div className="mb-1 text-[10px] font-semibold uppercase text-[color:var(--success)]">
                        Instructor edit
                      </div>
                      <div className="text-foreground">{q.question}</div>
                      {q.editNote && (
                        <div className="mt-1 text-[10px] italic text-muted-foreground">
                          Note: {q.editNote}
                        </div>
                      )}
                    </div>
                  </div>
                ) : editingId === q.id ? (
                  <EditQuiz
                    q={q}
                    onCancel={() => setEditingId(null)}
                    onSave={(text) => {
                      updateQuiz(q.id, {
                        question: text,
                        originalQuestion: q.originalQuestion ?? q.question,
                        editNote: "Edited by instructor",
                        status: "edited",
                      });
                      setEditingId(null);
                      toast.success(`Q${i + 1} edit saved`);
                    }}
                  />
                ) : (
                  <>
                    <div className="mb-2 font-medium text-foreground">{q.question}</div>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 rounded border px-2 py-1 text-xs ${
                            oi === q.correct
                              ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/5 text-foreground"
                              : "text-foreground/70"
                          }`}
                        >
                          <span className="font-semibold">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {opt}
                          {oi === q.correct && (
                            <Check className="ml-auto h-3 w-3 text-[color:var(--success)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditQuiz({
  q,
  onSave,
  onCancel,
}: {
  q: QuizQ;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(q.question);
  return (
    <div className="space-y-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(text)}>
          Save edit
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: {
      label: "Pending Review",
      cls: "bg-muted text-muted-foreground",
    },
    approved: {
      label: "Approved",
      cls: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    },
    edited: {
      label: "Edited",
      cls: "bg-[color:var(--warning)]/20 text-[color:oklch(0.45_0.12_75)]",
    },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive" },
  };
  const v = map[status] ?? map.pending;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

function IconAction({
  icon: Icon,
  label,
  onClick,
  tone,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: "success" | "destructive";
  active?: boolean;
}) {
  const toneCls =
    tone === "success"
      ? "hover:bg-[color:var(--success)]/15 hover:text-[color:var(--success)]"
      : tone === "destructive"
        ? "hover:bg-destructive/10 hover:text-destructive"
        : "hover:bg-muted";
  const activeCls =
    active && tone === "success"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
      : "";
  return (
    <button
      title={label}
      onClick={onClick}
      className={`rounded p-1.5 text-muted-foreground transition-colors ${toneCls} ${activeCls}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
