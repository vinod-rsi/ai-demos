import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderPlus,
  Layers,
  Library,
  ListChecks,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AiTag, AiThinking } from "./AiTag";
import { ProvenanceBadge } from "./Provenance";
import { ChapterReader } from "./ChapterReader";
import {
  FLASHCARDS,
  STUDENT_QA,
  SUMMARY_BULLETS,
  CHAPTER,
  CATALOGS,
  SUGGESTED_COLLECTION,
} from "@/lib/mockData";
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
  const {
    quiz,
    catalog,
    setCatalog,
    collectionItems,
    addCollectionItem,
    removeCollectionItem,
    savedCollections,
    saveCollection,
    clearCollection,
  } = useDemo();
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

  // P2 — interactive quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);

  // P1 — collection tray
  const [trayOpen, setTrayOpen] = useState(false);
  const [collectionName, setCollectionName] = useState(SUGGESTED_COLLECTION.name);

  const activeCatalog = CATALOGS.find((c) => c.id === catalog) ?? CATALOGS[0];

  const weakTopics = useMemo(() => {
    if (!graded) return [] as string[];
    const missed = quiz
      .filter((q) => answers[q.id] !== q.correct)
      .map((q) => q.topic);
    return Array.from(new Set(missed));
  }, [graded, answers, quiz]);

  const score = useMemo(
    () => quiz.filter((q) => answers[q.id] === q.correct).length,
    [answers, quiz],
  );

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

  const runQuiz = (cb?: () => void) => {
    setQuizOpen(true);
    setQuizLoading(true);
    setQuizShown(false);
    setAnswers({});
    setGraded(false);
    setTimeout(() => {
      setQuizLoading(false);
      setQuizShown(true);
      toast.success("Quiz generated — 5 questions ready");
      cb?.();
    }, 1600);
  };
  const runCards = (cb?: () => void) => {
    setCardsOpen(true);
    setCardsLoading(true);
    setCardsShown(false);
    setTimeout(() => {
      setCardsLoading(false);
      setCardsShown(true);
      cb?.();
    }, 1400);
  };
  const runSummary = (cb?: () => void) => {
    setSumOpen(true);
    setSumLoading(true);
    setSumShown(false);
    setTimeout(() => {
      setSumLoading(false);
      setSumShown(true);
      cb?.();
    }, 1400);
  };

  const gradeQuiz = () => {
    setGraded(true);
    const correct = quiz.filter((q) => answers[q.id] === q.correct).length;
    toast.success(`Scored ${correct}/${quiz.length}`);
  };

  // P1 — build the whole suggested collection in one click
  const buildSuggestedCollection = (name: string, topics?: string[]) => {
    setCollectionName(name);
    runQuiz();
    runCards();
    runSummary();
    addCollectionItem({
      kind: "quiz",
      label: "Practice quiz",
      detail: `${quiz.length} questions`,
    });
    addCollectionItem({
      kind: "flashcards",
      label: "Flashcard set",
      detail: `${FLASHCARDS.length} cards`,
    });
    addCollectionItem({
      kind: "summary",
      label: "Chapter summary",
      detail: `${SUMMARY_BULLETS.length} key points`,
    });
    if (topics && topics.length) {
      addCollectionItem({
        kind: "review",
        label: "Targeted review",
        detail: topics.join(", "),
      });
    }
    setTrayOpen(true);
    toast.success(`Collection “${name}” built — ${topics?.length ? 4 : 3} items`);
  };

  const addRemediation = () => {
    addCollectionItem({
      kind: "review",
      label: "Targeted review set",
      detail: weakTopics.join(", "),
    });
    setCollectionName(`Targeted Review — ${weakTopics[0] ?? "Sepsis"}`);
    setTrayOpen(true);
    toast.success("Targeted review added to your collection");
  };

  return (
    <div className="grid grid-cols-[62fr_38fr] gap-4">
      <ChapterReader ref={readerRef} highlightId={highlight} />

      <div className="flex h-[calc(100vh-140px)] flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[color:var(--ai-soft)] text-[color:var(--ai)]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">StudyBot</div>
              <div className="truncate text-[11px] text-muted-foreground">
                Grounded in {activeCatalog.name} · {activeCatalog.sampleTitle}
              </div>
            </div>
          </div>
          {/* P4 — cross-portal catalogue switcher */}
          <Select
            value={catalog}
            onValueChange={(v) => {
              setCatalog(v);
              const c = CATALOGS.find((x) => x.id === v);
              toast.success(`StudyBot switched to ${c?.name} catalogue`);
            }}
          >
            <SelectTrigger className="h-8 w-[150px] flex-shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATALOGS.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                  <span className="ml-1 text-muted-foreground">· {c.titles} titles</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
          <ArtifactBtn icon={ListChecks} label="Generate Quiz" onClick={() => runQuiz()} />
          <ArtifactBtn icon={Layers} label="Generate Flashcards" onClick={() => runCards()} />
          <ArtifactBtn icon={FileText} label="Summarize Chapter" onClick={() => runSummary()} />
          <button
            onClick={() => setTrayOpen((o) => !o)}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
              collectionItems.length > 0
                ? "border-[color:var(--ai-border)] bg-[color:var(--ai-soft)] text-[color:var(--ai)]"
                : "border-dashed text-muted-foreground hover:bg-muted",
            )}
          >
            <Library className="h-3.5 w-3.5" />
            Study Collection
            {collectionItems.length > 0 && (
              <span className="rounded-full bg-[color:var(--ai)] px-1.5 text-[10px] font-bold text-white">
                {collectionItems.length}
              </span>
            )}
          </button>
        </div>

        {trayOpen && (
          <CollectionTray
            name={collectionName}
            setName={setCollectionName}
            items={collectionItems}
            onRemove={removeCollectionItem}
            onSave={() => {
              saveCollection(collectionName || "Untitled Collection");
              toast.success(`Saved “${collectionName || "Untitled Collection"}”`);
              setCollectionName(SUGGESTED_COLLECTION.name);
            }}
            onClear={clearCollection}
            saved={savedCollections}
          />
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !quizOpen && !cardsOpen && !sumOpen && (
            <div className="animate-fade-in space-y-3">
              {/* P1 — Claire proactive collection suggestion */}
              <SuggestedCollectionCard
                weakTopics={weakTopics}
                onBuild={buildSuggestedCollection}
              />
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
              onAdd={
                sumShown
                  ? () =>
                      addCollectionItem({
                        kind: "summary",
                        label: "Chapter summary",
                        detail: `${SUMMARY_BULLETS.length} key points`,
                      })
                  : undefined
              }
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
              onAdd={
                cardsShown
                  ? () =>
                      addCollectionItem({
                        kind: "flashcards",
                        label: "Flashcard set",
                        detail: `${FLASHCARDS.length} cards`,
                      })
                  : undefined
              }
            >
              {cardsShown && (
                <div className="grid grid-cols-2 gap-2">
                  {FLASHCARDS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
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
              onAdd={
                quizShown
                  ? () =>
                      addCollectionItem({
                        kind: "quiz",
                        label: "Practice quiz",
                        detail: `${quiz.length} questions`,
                      })
                  : undefined
              }
            >
              {quizShown && (
                <div className="space-y-3">
                  <ol className="space-y-3 text-sm">
                    {quiz.map((q, i) => {
                      const picked = answers[q.id];
                      return (
                        <li key={q.id} className="rounded-md border bg-background p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="font-medium text-foreground">
                              {i + 1}. {q.question}
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                              <ProvenanceBadge source={q.source} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            {q.options.map((opt, oi) => {
                              const isPicked = picked === oi;
                              const isCorrect = oi === q.correct;
                              const show = graded;
                              return (
                                <button
                                  key={oi}
                                  disabled={graded}
                                  onClick={() =>
                                    setAnswers((a) => ({ ...a, [q.id]: oi }))
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded border px-2 py-1 text-left text-xs transition-colors",
                                    !show &&
                                      (isPicked
                                        ? "border-[color:var(--ai-border)] bg-[color:var(--ai-soft)] text-foreground"
                                        : "text-foreground/80 hover:bg-muted"),
                                    show &&
                                      isCorrect &&
                                      "border-[color:var(--success)]/50 bg-[color:var(--success)]/10 text-foreground",
                                    show &&
                                      isPicked &&
                                      !isCorrect &&
                                      "border-destructive/50 bg-destructive/10 text-foreground",
                                    show &&
                                      !isCorrect &&
                                      !isPicked &&
                                      "text-foreground/50",
                                  )}
                                >
                                  <span className="font-semibold">
                                    {String.fromCharCode(65 + oi)}.
                                  </span>
                                  {opt}
                                  {show && isCorrect && (
                                    <Check className="ml-auto h-3 w-3 text-[color:var(--success)]" />
                                  )}
                                  {show && isPicked && !isCorrect && (
                                    <X className="ml-auto h-3 w-3 text-destructive" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {!graded ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={Object.keys(answers).length < quiz.length}
                      onClick={gradeQuiz}
                    >
                      {Object.keys(answers).length < quiz.length
                        ? `Answer all ${quiz.length} to check`
                        : "Check my answers"}
                    </Button>
                  ) : (
                    <RemediationCard
                      score={score}
                      total={quiz.length}
                      weakTopics={weakTopics}
                      onJump={(topic) => {
                        const q = quiz.find((x) => x.topic === topic);
                        if (q) jumpTo(q.paragraph);
                      }}
                      onAddReview={addRemediation}
                      onRetry={() => {
                        setAnswers({});
                        setGraded(false);
                      }}
                    />
                  )}
                </div>
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

// ---------------------------------------------------------------------------

function SuggestedCollectionCard({
  weakTopics,
  onBuild,
}: {
  weakTopics: string[];
  onBuild: (name: string, topics?: string[]) => void;
}) {
  const targeted = weakTopics.length > 0;
  const name = targeted
    ? `Targeted Review — ${weakTopics[0]}`
    : SUGGESTED_COLLECTION.name;
  return (
    <div className="rounded-lg border border-[color:var(--ai-border)]/60 bg-gradient-to-br from-[color:var(--ai-soft)]/70 to-[color:var(--ai-soft)]/20 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ai)]">
          <Sparkles className="h-3.5 w-3.5" />
          Claire suggests a Study Collection
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground">{name}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {targeted
          ? `Based on ${weakTopics.length} topic${weakTopics.length > 1 ? "s" : ""} you missed (${weakTopics.join(", ")}), bundle a focused review set.`
          : `Based on ${SUGGESTED_COLLECTION.rationale}, bundle a quiz, flashcards, and a summary into one saved collection.`}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(targeted
          ? [{ label: "Targeted quiz + flashcards" }, { label: "Weak-area summary" }]
          : SUGGESTED_COLLECTION.parts
        ).map((p) => (
          <span
            key={p.label}
            className="rounded-full border bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {p.label}
          </span>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-2.5 h-8 w-full"
        onClick={() => onBuild(name, targeted ? weakTopics : undefined)}
      >
        <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
        Build this collection
      </Button>
    </div>
  );
}

function CollectionTray({
  name,
  setName,
  items,
  onRemove,
  onSave,
  onClear,
  saved,
}: {
  name: string;
  setName: (v: string) => void;
  items: ReturnType<typeof useDemo>["collectionItems"];
  onRemove: (id: string) => void;
  onSave: () => void;
  onClear: () => void;
  saved: ReturnType<typeof useDemo>["savedCollections"];
}) {
  const kindIcon = {
    quiz: ListChecks,
    flashcards: Layers,
    summary: FileText,
    review: Target,
  } as const;
  return (
    <div className="border-b bg-[color:var(--ai-soft)]/20 px-3 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Library className="h-3.5 w-3.5 text-[color:var(--ai)]" />
        <span className="text-xs font-semibold text-foreground">
          Study Collection
        </span>
        <span className="text-[11px] text-muted-foreground">
          — bundle generated material into one saved set
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-background/60 px-3 py-3 text-center text-xs text-muted-foreground">
          Empty. Generate a quiz, flashcards, or a summary, then hit{" "}
          <span className="font-medium text-foreground">＋ Add to collection</span>.
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {items.map((it) => {
              const Icon = kindIcon[it.kind];
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-[color:var(--ai)]" />
                  <span className="font-medium text-foreground">{it.label}</span>
                  <span className="text-muted-foreground">· {it.detail}</span>
                  <button
                    onClick={() => onRemove(it.id)}
                    className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this collection…"
              className="h-8 text-xs"
            />
            <Button size="sm" className="h-8" onClick={onSave}>
              Save
            </Button>
            <button
              onClick={onClear}
              title="Clear"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      {saved.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Saved collections
          </div>
          <div className="space-y-1">
            {saved.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs"
              >
                <Check className="h-3 w-3 text-[color:var(--success)]" />
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-muted-foreground">
                  · {c.items.length} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RemediationCard({
  score,
  total,
  weakTopics,
  onJump,
  onAddReview,
  onRetry,
}: {
  score: number;
  total: number;
  weakTopics: string[];
  onJump: (topic: string) => void;
  onAddReview: () => void;
  onRetry: () => void;
}) {
  const perfect = weakTopics.length === 0;
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        perfect
          ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/5"
          : "border-[color:var(--ai-border)]/60 bg-[color:var(--ai-soft)]/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          You scored {score}/{total}
        </div>
        <button
          onClick={onRetry}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          Retry
        </button>
      </div>
      {perfect ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Full marks — no weak areas to remediate. Nicely done.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            StudyBot found {weakTopics.length} topic
            {weakTopics.length > 1 ? "s" : ""} to review:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {weakTopics.map((t) => (
              <button
                key={t}
                onClick={() => onJump(t)}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-2 py-0.5 text-[11px] text-foreground transition-colors hover:bg-[color:var(--warning)]/20"
              >
                <Target className="h-3 w-3" />
                {t}
                <span className="text-[color:var(--ai)]">→ source</span>
              </button>
            ))}
          </div>
          <Button size="sm" className="mt-2.5 h-8 w-full" onClick={onAddReview}>
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
            Add targeted review to my collection
          </Button>
        </>
      )}
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
  onAdd,
}: {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  loading: boolean;
  loadingLabel: string;
  onAdd?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-[color:var(--ai-border)]/60 bg-[color:var(--ai-soft)]/30">
      <div className="flex items-center justify-between border-b border-[color:var(--ai-border)]/40 bg-[color:var(--ai-soft)]/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <AiTag />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onAdd && (
            <button
              onClick={() => {
                onAdd();
                setAdded(true);
                setTimeout(() => setAdded(false), 1400);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                added
                  ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                  : "border-[color:var(--ai-border)]/60 bg-background text-[color:var(--ai)] hover:bg-[color:var(--ai-soft)]",
              )}
            >
              {added ? (
                <>
                  <Check className="h-3 w-3" /> Added
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> Add to collection
                </>
              )}
            </button>
          )}
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
