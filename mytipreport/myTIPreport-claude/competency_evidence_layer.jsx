import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Quote,
  Users,
  LayoutGrid,
  ClipboardCheck,
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";

/* ----------------------------------------------------------------
   DESIGN TOKENS
   myTIPreport is a clinical, point-of-care tool used by busy
   clinicians on mobile between patients. Existing surfaces
   (Progress Dashboards, Competency Dashboards) favor a clean,
   low-clutter, data-forward layout. These tokens are a best-guess
   clinical-SaaS palette (cool blue/teal, restrained, high-contrast
   data viz) — swap for exact brand hex values when available.
------------------------------------------------------------------*/
const tokens = {
  colors: {
    bg: "#F6F8FA",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    primary: "#1E5E8C",
    primarySoft: "#E8F1F8",
    accent: "#2C8C7C",
    accentSoft: "#E5F4F1",
    text: "#1E293B",
    textMuted: "#64748B",
    textFaint: "#94A3B8",
    success: "#2F9E64",
    successSoft: "#E7F6ED",
    warning: "#C77B22",
    warningSoft: "#FBF0E3",
    danger: "#C0392B",
  },
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/* ----------------------------------------------------------------
   MOCK DATA
   Realistic but synthetic — no real names/institutions.
------------------------------------------------------------------*/
const competencies = [
  {
    id: "patient-care",
    name: "Patient Care",
    category: "Core Competency",
    evidenceCount: 14,
    trend: "up",
    sufficiency: "strong",
    lastEvidence: "2 days ago",
    comments: [
      { id: "c1", author: "Dr. R. Adeyemi", date: "Jun 28", text: "Demonstrated thorough pre-procedure assessment and clearly explained risks to the patient before consent.", rating: 4 },
      { id: "c2", author: "Dr. L. Chen", date: "Jun 24", text: "Managed a deteriorating patient calmly, escalated appropriately and reassessed within 10 minutes.", rating: 5 },
      { id: "c3", author: "Dr. M. Osei", date: "Jun 19", text: "Good bedside manner, patient and family felt informed throughout the encounter.", rating: 4 },
    ],
  },
  {
    id: "medical-knowledge",
    name: "Medical Knowledge",
    category: "Core Competency",
    evidenceCount: 9,
    trend: "flat",
    sufficiency: "strong",
    lastEvidence: "5 days ago",
    comments: [
      { id: "c4", author: "Dr. S. Patel", date: "Jun 25", text: "Solid grasp of differential diagnosis on a complex chest pain presentation, cited relevant guidelines accurately.", rating: 4 },
      { id: "c5", author: "Dr. R. Adeyemi", date: "Jun 21", text: "Knowledge gaps around second-line antibiotic choices in sepsis, recommend review.", rating: 3 },
    ],
  },
  {
    id: "communication",
    name: "Interpersonal & Communication Skills",
    category: "Core Competency",
    evidenceCount: 11,
    trend: "up",
    sufficiency: "strong",
    lastEvidence: "1 day ago",
    comments: [
      { id: "c6", author: "Dr. L. Chen", date: "Jun 29", text: "Delivered a difficult diagnosis with empathy, checked understanding twice, family appreciated the clarity.", rating: 5 },
      { id: "c7", author: "Dr. M. Osei", date: "Jun 22", text: "Clear, concise presentation on rounds, easy for the team to follow.", rating: 4 },
    ],
  },
  {
    id: "professionalism",
    name: "Professionalism",
    category: "Core Competency",
    evidenceCount: 6,
    trend: "down",
    sufficiency: "limited",
    lastEvidence: "9 days ago",
    comments: [
      { id: "c8", author: "Dr. S. Patel", date: "Jun 20", text: "Arrived late to handoff twice this week without flagging it to the team in advance.", rating: 2 },
      { id: "c9", author: "Dr. R. Adeyemi", date: "Jun 14", text: "Took ownership of a missed order promptly and corrected it without prompting.", rating: 4 },
    ],
  },
  {
    id: "systems-based-practice",
    name: "Systems-Based Practice",
    category: "Core Competency",
    evidenceCount: 4,
    trend: "flat",
    sufficiency: "limited",
    lastEvidence: "14 days ago",
    comments: [
      { id: "c10", author: "Dr. M. Osei", date: "Jun 15", text: "Engaged well with social work on a complex discharge plan.", rating: 4 },
    ],
  },
  {
    id: "handoffs",
    name: "Handoff Communication",
    category: "Sub-Competency",
    evidenceCount: 0,
    trend: "none",
    sufficiency: "none",
    lastEvidence: null,
    comments: [],
  },
];

const classificationQueue = [
  {
    id: "q1",
    text: "Walked through the discharge summary clearly with the patient and confirmed they understood the follow-up plan and medication changes.",
    author: "Dr. S. Patel",
    date: "Today",
    suggested: "Interpersonal & Communication Skills",
    confidence: 0.93,
    status: "pending",
  },
  {
    id: "q2",
    text: "Good job today.",
    author: "Dr. L. Chen",
    date: "Today",
    suggested: "Professionalism",
    confidence: 0.41,
    status: "pending",
  },
  {
    id: "q3",
    text: "Recognized early signs of clinical deterioration and escalated to the attending within minutes, then reassessed the patient after intervention.",
    author: "Dr. M. Osei",
    date: "Today",
    suggested: "Patient Care",
    confidence: 0.97,
    status: "pending",
  },
  {
    id: "q4",
    text: "Coordinated with pharmacy and case management to resolve a medication access issue before discharge.",
    author: "Dr. R. Adeyemi",
    date: "Yesterday",
    suggested: "Systems-Based Practice",
    confidence: 0.62,
    status: "pending",
  },
];

const cohort = [
  { id: "l1", name: "J. Alvarez, PGY-2", thinEvidenceCount: 1, overallSufficiency: "strong" },
  { id: "l2", name: "T. Nakamura, PGY-1", thinEvidenceCount: 3, overallSufficiency: "limited" },
  { id: "l3", name: "P. Okonkwo, PGY-3", thinEvidenceCount: 0, overallSufficiency: "strong" },
  { id: "l4", name: "S. Bianchi, PGY-2", thinEvidenceCount: 2, overallSufficiency: "limited" },
  { id: "l5", name: "R. Fitzgerald, PGY-1", thinEvidenceCount: 4, overallSufficiency: "none" },
];

/* ----------------------------------------------------------------
   SHARED UI PRIMITIVES
------------------------------------------------------------------*/
function Pill({ children, tone = "muted" }) {
  const tones = {
    muted: { bg: "#EEF2F6", color: tokens.colors.textMuted },
    success: { bg: tokens.colors.successSoft, color: tokens.colors.success },
    warning: { bg: tokens.colors.warningSoft, color: tokens.colors.warning },
    primary: { bg: tokens.colors.primarySoft, color: tokens.colors.primary },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.color,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp size={16} color={tokens.colors.success} />;
  if (trend === "down") return <TrendingDown size={16} color={tokens.colors.danger} />;
  if (trend === "flat") return <Minus size={16} color={tokens.colors.textMuted} />;
  return null;
}

function sufficiencyPill(sufficiency) {
  if (sufficiency === "strong") return <Pill tone="success">Strong evidence</Pill>;
  if (sufficiency === "limited") return <Pill tone="warning">Limited evidence</Pill>;
  return <Pill tone="muted">No recent evidence</Pill>;
}

function NavBar({ view, setView }) {
  const items = [
    { id: "dashboard", label: "Learner Evidence", icon: LayoutGrid },
    { id: "review", label: "Classification Review", icon: ClipboardCheck },
    { id: "program", label: "Program Overview", icon: Users },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        width: "fit-content",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: tokens.font,
              background: active ? tokens.colors.primary : "transparent",
              color: active ? "#fff" : tokens.colors.textMuted,
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={15} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------
   SCREEN 1 — LEARNER EVIDENCE DASHBOARD
------------------------------------------------------------------*/
function LearnerDashboard() {
  const [expanded, setExpanded] = useState("patient-care");

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: tokens.colors.textMuted, marginBottom: 2 }}>
          PGY-2 · Internal Medicine
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: tokens.colors.text }}>
          J. Alvarez — Competency Evidence
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {competencies.map((c) => {
          const isOpen = expanded === c.id;
          const isEmpty = c.sufficiency === "none";
          return (
            <div
              key={c.id}
              style={{
                background: tokens.colors.surface,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: tokens.font,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {isOpen ? (
                    <ChevronDown size={18} color={tokens.colors.textMuted} />
                  ) : (
                    <ChevronRight size={18} color={tokens.colors.textMuted} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: tokens.colors.text }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: tokens.colors.textFaint, marginTop: 2 }}>
                      {c.category}
                      {c.lastEvidence ? ` · last evidence ${c.lastEvidence}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {!isEmpty && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: tokens.colors.textMuted }}>
                      <TrendIcon trend={c.trend} />
                      {c.evidenceCount} entries
                    </div>
                  )}
                  {sufficiencyPill(c.sufficiency)}
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: "0 18px 18px 18px" }}>
                  {isEmpty ? (
                    <div
                      style={{
                        background: tokens.colors.warningSoft,
                        borderRadius: 10,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <AlertCircle size={18} color={tokens.colors.warning} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: tokens.colors.text }}>
                          No evidence recorded yet for this competency
                        </div>
                        <div style={{ fontSize: 13, color: tokens.colors.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                          The system won't generate a trend here — there isn't enough data to support one.
                          Consider requesting feedback specifically on handoff communication.
                        </div>
                        <button
                          style={{
                            marginTop: 10,
                            background: tokens.colors.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "7px 14px",
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontFamily: tokens.font,
                          }}
                        >
                          Request feedback on this competency <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {c.sufficiency === "limited" && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12.5,
                            color: tokens.colors.warning,
                            marginBottom: 4,
                          }}
                        >
                          <AlertCircle size={14} />
                          Fewer than 8 evidence entries — trend shown with lower confidence
                        </div>
                      )}
                      {c.comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            display: "flex",
                            gap: 10,
                            padding: "10px 12px",
                            background: tokens.colors.bg,
                            borderRadius: 10,
                            border: `1px solid ${tokens.colors.border}`,
                          }}
                        >
                          <Quote size={14} color={tokens.colors.textFaint} style={{ flexShrink: 0, marginTop: 3 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, color: tokens.colors.text, lineHeight: 1.5 }}>
                              {comment.text}
                            </div>
                            <div style={{ fontSize: 11.5, color: tokens.colors.textFaint, marginTop: 4 }}>
                              {comment.author} · {comment.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   SCREEN 2 — EVIDENCE CLASSIFICATION REVIEW
------------------------------------------------------------------*/
function ClassificationReview() {
  const [queue, setQueue] = useState(classificationQueue);
  const competencyOptions = competencies.map((c) => c.name);

  function confirm(id) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, status: "confirmed" } : item)));
  }

  function correct(id, newCategory) {
    setQueue((q) =>
      q.map((item) =>
        item.id === id ? { ...item, suggested: newCategory, status: "confirmed", corrected: true } : item
      )
    );
  }

  const remaining = queue.filter((q) => q.status === "pending").length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: tokens.colors.text }}>
          Evidence Classification Review
        </h2>
        <div style={{ fontSize: 13.5, color: tokens.colors.textMuted, marginTop: 4 }}>
          {remaining > 0
            ? `${remaining} new comment${remaining > 1 ? "s" : ""} need a quick confirmation before joining the learner's record.`
            : "All caught up — nothing pending review."}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {queue.map((item) => {
          const isHighConfidence = item.confidence >= 0.8;
          const isConfirmed = item.status === "confirmed";
          return (
            <div
              key={item.id}
              style={{
                background: tokens.colors.surface,
                border: `1px solid ${isConfirmed ? tokens.colors.success : tokens.colors.border}`,
                borderRadius: 14,
                padding: 16,
                opacity: isConfirmed ? 0.75 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontSize: 13.5, color: tokens.colors.text, lineHeight: 1.5, flex: 1 }}>
                  “{item.text}”
                  <div style={{ fontSize: 11.5, color: tokens.colors.textFaint, marginTop: 6 }}>
                    {item.author} · {item.date}
                  </div>
                </div>
                {isConfirmed && (
                  <Pill tone="success">
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> Added to record
                    </span>
                  </Pill>
                )}
              </div>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid ${tokens.colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: tokens.colors.textMuted }}>Suggested:</span>
                  <Pill tone="primary">{item.suggested}</Pill>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: isHighConfidence ? tokens.colors.success : tokens.colors.warning,
                    }}
                  >
                    {Math.round(item.confidence * 100)}% confidence
                  </span>
                </div>

                {!isConfirmed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isHighConfidence ? (
                      <button
                        onClick={() => confirm(item.id)}
                        style={{
                          background: tokens.colors.success,
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "7px 14px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: tokens.font,
                        }}
                      >
                        Accept
                      </button>
                    ) : (
                      <>
                        <select
                          defaultValue=""
                          onChange={(e) => e.target.value && correct(item.id, e.target.value)}
                          style={{
                            fontSize: 12.5,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: `1px solid ${tokens.colors.border}`,
                            color: tokens.colors.text,
                            fontFamily: tokens.font,
                          }}
                        >
                          <option value="" disabled>
                            Reassign…
                          </option>
                          {competencyOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => confirm(item.id)}
                          style={{
                            background: tokens.colors.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "7px 14px",
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: tokens.font,
                          }}
                        >
                          Confirm
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isHighConfidence && !isConfirmed && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: tokens.colors.warning,
                  }}
                >
                  <AlertCircle size={13} /> Low confidence — please confirm or reassign before this counts as evidence
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   SCREEN 3 — PROGRAM-LEVEL COMPETENCY OVERVIEW
------------------------------------------------------------------*/
function ProgramOverview() {
  const [sortBy, setSortBy] = useState("name");

  const sorted = useMemo(() => {
    const list = [...cohort];
    if (sortBy === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "most-thin") return list.sort((a, b) => b.thinEvidenceCount - a.thinEvidenceCount);
    if (sortBy === "least-thin") return list.sort((a, b) => a.thinEvidenceCount - b.thinEvidenceCount);
    return list;
  }, [sortBy]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: tokens.colors.text }}>
            Program Competency Overview
          </h2>
          <div style={{ fontSize: 13.5, color: tokens.colors.textMuted, marginTop: 4 }}>
            Internal Medicine Residency · PGY-1–3
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: tokens.colors.textMuted }}>Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              fontSize: 12.5,
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${tokens.colors.border}`,
              fontFamily: tokens.font,
              color: tokens.colors.text,
            }}
          >
            <option value="name">Learner name</option>
            <option value="most-thin">Most thin-evidence areas</option>
            <option value="least-thin">Least thin-evidence areas</option>
          </select>
        </div>
      </div>

      <div
        style={{
          background: tokens.colors.surface,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.2fr 1.6fr 1fr",
            padding: "12px 18px",
            fontSize: 11.5,
            fontWeight: 700,
            color: tokens.colors.textFaint,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <div>Learner</div>
          <div>Overall</div>
          <div>Thin-evidence competencies</div>
          <div></div>
        </div>
        {sorted.map((l, i) => (
          <div
            key={l.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.2fr 1.6fr 1fr",
              padding: "14px 18px",
              alignItems: "center",
              fontSize: 13.5,
              borderBottom: i < sorted.length - 1 ? `1px solid ${tokens.colors.border}` : "none",
            }}
          >
            <div style={{ fontWeight: 600, color: tokens.colors.text }}>{l.name}</div>
            <div>{sufficiencyPill(l.overallSufficiency)}</div>
            <div style={{ color: l.thinEvidenceCount > 2 ? tokens.colors.warning : tokens.colors.textMuted, fontWeight: l.thinEvidenceCount > 2 ? 600 : 400 }}>
              {l.thinEvidenceCount === 0 ? "None" : `${l.thinEvidenceCount} competenc${l.thinEvidenceCount > 1 ? "ies" : "y"}`}
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: tokens.colors.primary,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: tokens.font,
                }}
              >
                View <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 12.5,
          color: tokens.colors.textFaint,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <AlertCircle size={13} />
        2 of 5 learners have 2+ competencies with limited or no recent evidence this rotation block.
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   APP SHELL
------------------------------------------------------------------*/
export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <div
      style={{
        fontFamily: tokens.font,
        background: tokens.colors.bg,
        minHeight: "100vh",
        padding: "28px 24px",
        color: tokens.colors.text,
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: tokens.colors.primary,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            TR
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text, lineHeight: 1.2 }}>
              myTIPreport
            </div>
            <div style={{ fontSize: 11.5, color: tokens.colors.textFaint, lineHeight: 1.2 }}>
              Competency Evidence Intelligence Layer · Prototype
            </div>
          </div>
        </div>

        <NavBar view={view} setView={setView} />

        {view === "dashboard" && <LearnerDashboard />}
        {view === "review" && <ClassificationReview />}
        {view === "program" && <ProgramOverview />}
      </div>
    </div>
  );
}
