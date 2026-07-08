import { createContext, useContext, useState, type ReactNode } from "react";
import { QUIZ_QUESTIONS, CRM_MATCHES } from "@/lib/mockData";

export type Role = "student" | "instructor" | "admin" | "sales";

export type QuizQ = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  paragraph: string;
  status: string;
  originalQuestion?: string;
  originalOptions?: string[];
  editNote?: string;
};
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

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("student");
  const [quiz, setQuiz] = useState<QuizQ[]>(initialQuiz);
  const [quizAssigned, setQuizAssigned] = useState(false);
  const [titles, setTitles] = useState(initialTitles);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();

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
            prev.map((t) =>
              t.id === id && t.policy === "signed" ? { ...t, aiEnabled: !t.aiEnabled } : t,
            ),
          ),
        signPolicy: (id) =>
          setTitles((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, policy: "signed", policyBy: "You, Legal", policyDate: "Today" }
                : t,
            ),
          ),
        matches,
        updateMatch: (id, patch) =>
          setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))),
        audit,
        addAudit: (text) =>
          setAudit((prev) =>
            [{ id: crypto.randomUUID(), text, time: now() }, ...prev].slice(0, 5),
          ),
        resetDemo: () => {
          setQuiz(initialQuiz());
          setQuizAssigned(false);
          setTitles(initialTitles());
          setMatches(initialMatches());
          setAudit([]);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
