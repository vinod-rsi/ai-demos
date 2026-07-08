import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  ListChecks,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AiTag, AiThinking } from "./AiTag";
import { ChapterReader } from "./ChapterReader";
import { FLASHCARDS, STUDENT_QA, SUMMARY_BULLETS, CHAPTER } from "@/lib/mockData";
import { useDemo } from "./DemoContext";

type ChatMsg = {
  id: string;
  role: "user" | "ai";
  text: string;
  citation?: string | null;
  excerpt?: string | null;
  confidence?: number;
  outOfScope?: boolean;
};

const suggestedQuestions = STUDENT_QA.map((q) => q.q);

export function StudentView() {
  const { quiz } = useDemo();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizShown, setQuizShown] = useState(false);

  const [cardsOpen, setCardsOpen] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsShown, setCardsShown] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const [sumOpen, setSumOpen] = useState(false);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumShown, setSumShown] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    setInput("");
    const uMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, uMsg]);
    setThinking(true);
    const match =
      STUDENT_QA.find((q) => q.q.toLowerCase() === text.toLowerCase().trim()) ??
      STUDENT_QA[STUDENT_QA.length - 1]; // out-of-scope fallback
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: match.a,
          citation: match.citation,
          excerpt: match.excerpt,
          confidence: match.confidence,
          outOfScope: match.outOfScope,
        },
      ]);
    }, 1500);
  };

  const jumpTo = (paraId: string) => {
    setHighlight(paraId);
    const el = document.getElementById(`para-${paraId}`);
    if (el && readerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlight(null), 2000);
  };

  const runQuiz = () => {
    setQuizOpen(true);
    setQuizLoading(true);
    setQuizShown(false);
    setTimeout(() => {
      setQuizLoading(false);
      setQuizShown(true);
      toast.success("Quiz generated — 5 questions ready");
    }, 1600);
  };
  const runCards = () => {
    setCardsOpen(true);
    setCardsLoading(true);
    setCardsShown(false);
    setTimeout(() => {
      setCardsLoading(false);
      setCardsShown(true);
    }, 1400);
  };
  const runSummary = () => {
    setSumOpen(true);
    setSumLoading(true);
    setSumShown(false);
    setTimeout(() => {
      setSumLoading(false);
      setSumShown(true);
    }, 1400);
  };

  return (
    <div className="grid grid-cols-[65fr_35fr] gap-4">
      <ChapterReader ref={readerRef} highlightId={highlight} />

      <div className="flex h-[calc(100vh-140px)] flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--ai-soft)] text-[color:var(--ai)]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">StudyBot</div>
              <div className="text-[11px] text-muted-foreground">
                Grounded in Chapter 7 only
              </div>
            </div>
          </div>
          <AiTag />
        </div>

        <div className="flex flex-wrap gap-1.5 border-b bg-muted/40 px-3 py-2">
          <ArtifactBtn icon={ListChecks} label="Generate Quiz" onClick={runQuiz} />
          <ArtifactBtn icon={Layers} label="Generate Flashcards" onClick={runCards} />
          <ArtifactBtn icon={FileText} label="Summarize Chapter" onClick={runSummary} />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !quizOpen && !cardsOpen && !sumOpen && (
            <div className="animate-fade-in space-y-3">
              <div className="text-sm text-muted-foreground">
                Ask a question about this chapter or try one of these:
              </div>
              <div className="space-y-1.5">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="w-full rounded-md border border-dashed px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:border-[color:var(--ai-border)] hover:bg-[color:var(--ai-soft)]/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sumOpen && (
            <ArtifactCard
              title="Chapter summary"
              onClose={() => setSumOpen(false)}
              loading={sumLoading}
              loadingLabel="Summarizing chapter"
            >
              {sumShown && (
                <ul className="space-y-2 text-sm text-foreground/90">
                  {SUMMARY_BULLETS.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--ai)]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ArtifactCard>
          )}

          {cardsOpen && (
            <ArtifactCard
              title="Flashcards"
              onClose={() => setCardsOpen(false)}
              loading={cardsLoading}
              loadingLabel="Generating flashcards"
            >
              {cardsShown && (
                <div className="grid grid-cols-2 gap-2">
                  {FLASHCARDS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setFlipped((f) => ({ ...f, [i]: !f[i] }))
                      }
                      className="group relative h-24 rounded-md border bg-background p-3 text-left text-xs transition-all hover:border-[color:var(--ai-border)] hover:shadow-sm"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {flipped[i] ? "Back" : "Front"} · {i + 1}/{FLASHCARDS.length}
                      </div>
                      <div className="mt-1 line-clamp-3 text-foreground">
                        {flipped[i] ? c.back : c.front}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ArtifactCard>
          )}

          {quizOpen && (
            <ArtifactCard
              title="Practice quiz"
              onClose={() => setQuizOpen(false)}
              loading={quizLoading}
              loadingLabel="Drafting quiz"
            >
              {quizShown && (
                <ol className="space-y-3 text-sm">
                  {quiz.map((q, i) => (
                    <li key={q.id} className="rounded-md border bg-background p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="font-medium text-foreground">
                          {i + 1}. {q.question}
                        </div>
                        <span className="flex-shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          from {q.paragraph.replace("p", "¶ ")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className="rounded border px-2 py-1 text-xs text-foreground/80"
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </ArtifactCard>
          )}

          {messages.map((m) => (
            <div key={m.id} className="animate-fade-in">
              {m.role === "user" ? (
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {m.text}
                </div>
              ) : (
                <div className="max-w-[95%] space-y-2">
                  <div className="flex items-center gap-2">
                    <AiTag />
                    {typeof m.confidence === "number" && !m.outOfScope && (
                      <ConfidenceDot value={m.confidence} />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl rounded-tl-sm border px-3 py-2 text-sm",
                      m.outOfScope
                        ? "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-foreground"
                        : "bg-[color:var(--ai-soft)]/40 text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  {m.excerpt && m.citation && (
                    <button
                      onClick={() => jumpTo(m.citation!)}
                      className="block w-full rounded-md border-l-2 border-[color:var(--ai)] bg-muted/60 px-3 py-2 text-left text-xs italic text-foreground/80 transition-colors hover:bg-muted"
                    >
                      "{m.excerpt}"
                      <span className="ml-1 not-italic text-[color:var(--ai)]">
                        → jump to source
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="animate-fade-in">
              <AiThinking />
            </div>
          )}
        </div>

        <form
          className="border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this chapter…"
              className="h-10"
            />
            <Button type="submit" size="icon" className="h-10 w-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground">
            Answers are grounded only in "{CHAPTER.title}".
          </div>
        </form>
      </div>
    </div>
  );
}

function ArtifactBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--ai-border)]/60 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-[color:var(--ai-border)] hover:bg-[color:var(--ai-soft)]"
    >
      <Icon className="h-3.5 w-3.5 text-[color:var(--ai)]" />
      {label}
    </button>
  );
}

function ArtifactCard({
  title,
  children,
  onClose,
  loading,
  loadingLabel,
}: {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  loading: boolean;
  loadingLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-[color:var(--ai-border)]/60 bg-[color:var(--ai-soft)]/30">
      <div className="flex items-center justify-between border-b border-[color:var(--ai-border)]/40 bg-[color:var(--ai-soft)]/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <AiTag />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-muted-foreground hover:bg-background"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded px-1.5 text-xs text-muted-foreground hover:bg-background"
          >
            ×
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3">{loading ? <AiThinking label={loadingLabel} /> : children}</div>
      )}
    </div>
  );
}

function ConfidenceDot({ value }: { value: number }) {
  const color =
    value >= 90
      ? "var(--success)"
      : value >= 75
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 100%, transparent)` }}
      />
      {value}% confidence
    </div>
  );
}
