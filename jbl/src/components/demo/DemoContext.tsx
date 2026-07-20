import { createContext, useContext, useState, type ReactNode } from "react";
import {
  QUIZ_QUESTIONS,
  CRM_MATCHES,
  POLICY_LOG,
  CATALOGS,
  type ItemSource,
} from "@/lib/mockData";

export type Role = "student" | "instructor" | "admin" | "sales";

export type QuizQ = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  paragraph: string;
  status: string;
  topic: string;
  confidence: number;
  source: ItemSource;
  originalQuestion?: string;
  originalOptions?: string[];
  editNote?: string;
};

export type CollectionItem = {
  id: string;
  kind: "quiz" | "flashcards" | "summary" | "review";
  label: string;
  detail: string;
};
export type SavedCollection = { id: string; name: string; items: CollectionItem[] };
export type Match = {
  id: string;
  institution: string;
  crmId: string;
  jblId: string;
  jblIdAlt?: string;
  confidence: number;
  evidence: { emailDomain: boolean; billingAddress: boolean; orderOverlap: boolean };
  status: string;
  conflictNote?: string;
  confirmedAt?: string;
  confirmedBy?: string;
};
export type AuditEntry = { id: string; text: string; time: string };

interface DemoState {
  role: Role;
  setRole: (r: Role) => void;
  quiz: QuizQ[];
  updateQuiz: (id: string, patch: Partial<QuizQ>) => void;
  quizAssigned: boolean;
  setQuizAssigned: (v: boolean) => void;
  titles: typeof import("@/lib/mockData").ADMIN_TITLES;
  toggleAi: (id: string) => void;
  signPolicy: (id: string) => void;
  matches: Match[];
  updateMatch: (id: string, patch: Partial<Match>) => void;
  audit: AuditEntry[];
  addAudit: (text: string) => void;
  // P4 — active catalogue (cross-portal StudyBot)
  catalog: string;
  setCatalog: (id: string) => void;
  // P1 — Study Collection draft + saved collections
  collectionItems: CollectionItem[];
  addCollectionItem: (item: Omit<CollectionItem, "id">) => void;
  removeCollectionItem: (id: string) => void;
  savedCollections: SavedCollection[];
  saveCollection: (name: string) => void;
  clearCollection: () => void;
  // P5 — exposure-policy audit log
  policyLog: AuditEntry[];
  resetDemo: () => void;
}

const Ctx = createContext<DemoState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo outside provider");
  return v;
};

import { ADMIN_TITLES } from "@/lib/mockData";

const initialQuiz = (): QuizQ[] => QUIZ_QUESTIONS.map((q) => ({ ...q }));
const initialTitles = () => ADMIN_TITLES.map((t) => ({ ...t }));
const initialMatches = (): Match[] => CRM_MATCHES.map((m) => ({ ...m }));
const initialPolicyLog = (): AuditEntry[] =>
  POLICY_LOG.map((p) => ({ id: p.id, text: p.text, time: p.time }));

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("student");
  const [quiz, setQuiz] = useState<QuizQ[]>(initialQuiz);
  const [quizAssigned, setQuizAssigned] = useState(false);
  const [titles, setTitles] = useState(initialTitles);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [catalog, setCatalog] = useState<string>(CATALOGS[0].id);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [policyLog, setPolicyLog] = useState<AuditEntry[]>(initialPolicyLog);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const today = () =>
    new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const logPolicy = (text: string) =>
    setPolicyLog((prev) => [{ id: crypto.randomUUID(), text, time: today() }, ...prev]);

  return (
    <Ctx.Provider
      value={{
        role,
        setRole,
        quiz,
        updateQuiz: (id, patch) =>
          setQuiz((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q))),
        quizAssigned,
        setQuizAssigned,
        titles,
        toggleAi: (id) =>
          setTitles((prev) =>
            prev.map((t) => {
              if (t.id !== id || t.policy !== "signed") return t;
              logPolicy(`AI ${!t.aiEnabled ? "enabled" : "disabled"} for “${t.title}”`);
              return { ...t, aiEnabled: !t.aiEnabled };
            }),
          ),
        signPolicy: (id) =>
          setTitles((prev) =>
            prev.map((t) => {
              if (t.id !== id) return t;
              logPolicy(`Exposure policy signed off for “${t.title}” by You, Legal`);
              return { ...t, policy: "signed", policyBy: "You, Legal", policyDate: "Today" };
            }),
          ),
        matches,
        updateMatch: (id, patch) =>
          setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))),
        audit,
        addAudit: (text) =>
          setAudit((prev) =>
            [{ id: crypto.randomUUID(), text, time: now() }, ...prev].slice(0, 5),
          ),
        catalog,
        setCatalog,
        collectionItems,
        addCollectionItem: (item) =>
          setCollectionItems((prev) =>
            prev.some((p) => p.kind === item.kind && p.label === item.label)
              ? prev
              : [...prev, { ...item, id: crypto.randomUUID() }],
          ),
        removeCollectionItem: (id) =>
          setCollectionItems((prev) => prev.filter((p) => p.id !== id)),
        savedCollections,
        saveCollection: (name) =>
          setCollectionItems((items) => {
            if (items.length === 0) return items;
            setSavedCollections((prev) => [
              { id: crypto.randomUUID(), name, items },
              ...prev,
            ]);
            return [];
          }),
        clearCollection: () => setCollectionItems([]),
        policyLog,
        resetDemo: () => {
          setQuiz(initialQuiz());
          setQuizAssigned(false);
          setTitles(initialTitles());
          setMatches(initialMatches());
          setAudit([]);
          setCatalog(CATALOGS[0].id);
          setCollectionItems([]);
          setSavedCollections([]);
          setPolicyLog(initialPolicyLog());
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
