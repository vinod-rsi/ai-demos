// Realistic placeholder data for the Swift River Adaptive Clinical Simulation Engine prototype.

export type Readiness = "developing" | "approaching" | "ready" | "advanced";

export const readinessMeta: Record<Readiness, { label: string; tone: string }> = {
  developing: { label: "Developing", tone: "warning" },
  approaching: { label: "Approaching", tone: "info" },
  ready: { label: "Ready", tone: "success" },
  advanced: { label: "Advanced", tone: "ai" },
};

export interface AssignedScenario {
  id: string;
  title: string;
  specialty: string;
  status: "not_started" | "in_progress" | "completed";
  due: string;
  progress: number;
  mode: "Beginner" | "Standard" | "Advanced";
  cjmiScore?: number;
  estMinutes: number;
}

export const studentScenarios: AssignedScenario[] = [
  {
    id: "sr-104",
    title: "Post-Op Sepsis Recognition",
    specialty: "Med-Surg",
    status: "in_progress",
    due: "Due in 2 days",
    progress: 40,
    mode: "Standard",
    estMinutes: 25,
  },
  {
    id: "sr-088",
    title: "Acute Respiratory Distress",
    specialty: "Critical Care",
    status: "not_started",
    due: "Due Fri",
    progress: 0,
    mode: "Beginner",
    estMinutes: 20,
  },
  {
    id: "sr-061",
    title: "Diabetic Ketoacidosis Management",
    specialty: "Med-Surg",
    status: "completed",
    due: "Completed",
    progress: 100,
    mode: "Standard",
    cjmiScore: 82,
    estMinutes: 22,
  },
  {
    id: "sr-052",
    title: "Postpartum Hemorrhage",
    specialty: "OB",
    status: "completed",
    due: "Completed",
    progress: 100,
    mode: "Advanced",
    cjmiScore: 91,
    estMinutes: 28,
  },
];

export const studentSkills = [
  { skill: "Recognize cues", score: 78 },
  { skill: "Analyze cues", score: 64 },
  { skill: "Prioritize", score: 58 },
  { skill: "Generate solutions", score: 71 },
  { skill: "Take action", score: 83 },
  { skill: "Evaluate outcomes", score: 69 },
];

export const cjmiTrend = [
  { attempt: "Wk 1", score: 54 },
  { attempt: "Wk 2", score: 61 },
  { attempt: "Wk 3", score: 58 },
  { attempt: "Wk 4", score: 67 },
  { attempt: "Wk 5", score: 72 },
  { attempt: "Wk 6", score: 78 },
];

// ---------- Faculty ----------
export interface StudentRow {
  id: string;
  name: string;
  initials: string;
  section: string;
  completed: number;
  assigned: number;
  cjmi: number;
  readiness: Readiness;
  weakestSkill: string;
  lastActive: string;
  flag?: "at_risk" | "improving" | null;
  // BoardVitals forgetfulness / decay: risk that a mastered concept is being forgotten.
  decayRisk: "high" | "medium" | "low";
  decayNote: string;
}

export const roster: StudentRow[] = [
  { id: "s1", name: "Maya Ellison", initials: "ME", section: "A", completed: 6, assigned: 8, cjmi: 78, readiness: "ready", weakestSkill: "Decimal accuracy", lastActive: "2h ago", flag: "improving", decayRisk: "low", decayNote: "Unit conversions reviewed 2 days ago" },
  { id: "s2", name: "Devon Carter", initials: "DC", section: "A", completed: 3, assigned: 8, cjmi: 52, readiness: "developing", weakestSkill: "Pediatric dosing", lastActive: "1d ago", flag: "at_risk", decayRisk: "high", decayNote: "Pediatric dosing last correct 14 days ago" },
  { id: "s3", name: "Aisha Rahman", initials: "AR", section: "A", completed: 8, assigned: 8, cjmi: 91, readiness: "advanced", weakestSkill: "High-alert protocol", lastActive: "5h ago", decayRisk: "low", decayNote: "All concepts practiced this week" },
  { id: "s4", name: "Liam O'Brien", initials: "LO", section: "B", completed: 4, assigned: 8, cjmi: 61, readiness: "approaching", weakestSkill: "IV drip rate", lastActive: "3h ago", decayRisk: "medium", decayNote: "IV drip rate last correct 8 days ago" },
  { id: "s5", name: "Sofia Reyes", initials: "SR", section: "B", completed: 7, assigned: 8, cjmi: 84, readiness: "ready", weakestSkill: "Safe-range check", lastActive: "1h ago", decayRisk: "low", decayNote: "Safe-range check reviewed 3 days ago" },
  { id: "s6", name: "Noah Kim", initials: "NK", section: "B", completed: 2, assigned: 8, cjmi: 47, readiness: "developing", weakestSkill: "Decimal accuracy", lastActive: "2d ago", flag: "at_risk", decayRisk: "high", decayNote: "Decimal accuracy last correct 16 days ago" },
  { id: "s7", name: "Grace Thompson", initials: "GT", section: "A", completed: 6, assigned: 8, cjmi: 74, readiness: "ready", weakestSkill: "Unit conversion", lastActive: "6h ago", decayRisk: "medium", decayNote: "Unit conversion last correct 9 days ago" },
  { id: "s8", name: "Ethan Walsh", initials: "EW", section: "B", completed: 5, assigned: 8, cjmi: 68, readiness: "approaching", weakestSkill: "High-alert protocol", lastActive: "8h ago", decayRisk: "medium", decayNote: "High-alert protocol last correct 7 days ago" },
];

export const skillHeatmap: { skill: string; sectionA: number; sectionB: number }[] = [
  { skill: "Order interpretation", sectionA: 18, sectionB: 24 },
  { skill: "Unit conversion", sectionA: 22, sectionB: 38 },
  { skill: "Decimal accuracy", sectionA: 48, sectionB: 44 },
  { skill: "Safe-range check", sectionA: 34, sectionB: 29 },
  { skill: "Pediatric dosing", sectionA: 58, sectionB: 52 },
  { skill: "High-alert protocol", sectionA: 41, sectionB: 40 },
];

export const debriefQuestions = [
  "Devon exceeded the safe range in 3 of 4 pediatric cases — which single check (mg/kg vs mg) most reliably catches a 10× error?",
  "Walk through where a misplaced decimal changes the order of magnitude, and the independent double-check that would catch it before administration.",
  "The cohort skipped the high-alert second-check under time pressure. When is that check mandatory, and who performs it?",
  "Rebuild a weight-based dose using dimensional analysis: which unit cancels first, and why does that guard the answer?",
];

export const remediationGroups = [
  { name: "Dimensional-Analysis Lab", size: 4, focus: "Decimal accuracy + unit conversion", members: ["Devon C.", "Noah K.", "Liam O.", "Ethan W."] },
  { name: "High-Alert Safety Workshop", size: 3, focus: "Independent double-check + pediatric dosing", members: ["Devon C.", "Noah K.", "Grace T."] },
];

// ---------- Admin ----------
export const programKpis = [
  { label: "Active learners", value: "1,284", delta: "+6.4%", tone: "success" },
  { label: "Avg CJMI readiness", value: "73", delta: "+4 pts", tone: "success" },
  { label: "Scenario completion", value: "88%", delta: "+2.1%", tone: "success" },
  { label: "At-risk learners", value: "47", delta: "-11", tone: "success" },
];

export const cohortComparison = [
  { cohort: "2024", readiness: 64, completion: 81, atRisk: 12 },
  { cohort: "2025", readiness: 69, completion: 85, atRisk: 9 },
  { cohort: "2026", readiness: 73, completion: 88, atRisk: 7 },
];

export const readinessTrend = [
  { month: "Aug", readiness: 58, benchmark: 62 },
  { month: "Sep", readiness: 61, benchmark: 63 },
  { month: "Oct", readiness: 66, benchmark: 64 },
  { month: "Nov", readiness: 69, benchmark: 65 },
  { month: "Dec", readiness: 71, benchmark: 66 },
  { month: "Jan", readiness: 73, benchmark: 67 },
];

export const timeInSim = [
  { section: "Med-Surg", minutes: 412 },
  { section: "Critical Care", minutes: 388 },
  { section: "OB", minutes: 296 },
  { section: "Peds", minutes: 341 },
  { section: "Mental Health", minutes: 274 },
];

export const readinessDistribution = [
  { name: "Advanced", value: 18, tone: "ai" },
  { name: "Ready", value: 46, tone: "success" },
  { name: "Approaching", value: 24, tone: "info" },
  { name: "Developing", value: 12, tone: "warning" },
];

export const riskFlags = [
  { name: "Noah Kim", section: "BSN 2026-B", reason: "3 overdue scenarios · declining CJMI", severity: "critical" },
  { name: "Devon Carter", section: "BSN 2026-A", reason: "Repeated late escalation pattern", severity: "critical" },
  { name: "Marcus Lee", section: "ADN 2025-C", reason: "Low engagement (2 logins / 3 wks)", severity: "warning" },
  { name: "Hannah Park", section: "BSN 2026-B", reason: "Plateaued readiness for 4 weeks", severity: "warning" },
];

// ---------- Author ----------
export const learningObjectives = [
  "Recognize early cues of sepsis in a post-operative patient",
  "Prioritize interventions using an escalation framework",
  "Communicate a structured SBAR handoff",
];

export interface AdaptiveRule {
  id: string;
  condition: string;
  action: string;
  active: boolean;
  tone: "info" | "success" | "critical";
}

export const adaptiveRules: AdaptiveRule[] = [
  {
    id: "r1",
    condition: "IF learner misses cue \"rising lactate\" twice",
    action: "THEN increase support — surface a guided assessment prompt",
    active: true,
    tone: "info",
  },
  {
    id: "r2",
    condition: "IF learner is high-performing (CJMI > 80)",
    action: "THEN reduce hints and add a competing-priority distractor",
    active: true,
    tone: "success",
  },
  {
    id: "r3",
    condition: "IF learner selects an unsafe priority",
    action: "THEN trigger debrief path B and flag for remediation",
    active: true,
    tone: "critical",
  },
  {
    id: "r4",
    condition: "IF confidence rating is high but action is incorrect",
    action: "THEN insert a metacognitive reflection checkpoint",
    active: false,
    tone: "info",
  },
];

// ── Lesson 10: Dosage Calculations & Medication Errors (Pharmacology) ──────────

export type MasteryState = "strong" | "fragile" | "at_risk";

export const masteryMeta: Record<MasteryState, { label: string; tone: string; glyph: string }> = {
  strong: { label: "Strong", tone: "success", glyph: "●" },
  fragile: { label: "Fragile", tone: "warning", glyph: "◐" },
  at_risk: { label: "At risk", tone: "critical", glyph: "⚠" },
};

export interface ConceptMastery {
  concept: string;
  state: MasteryState;
  detail: string;
}

export const lesson10Mastery: ConceptMastery[] = [
  { concept: "Unit conversions (mg ↔ mcg ↔ g)", state: "strong", detail: "6/6 correct across last 3 sessions" },
  { concept: "IV drip rate (gtt/min)", state: "fragile", detail: "Correct but slow; 1 recent slip on drop factor" },
  { concept: "Pediatric weight-based dosing", state: "at_risk", detail: "2 of last 3 attempts exceeded safe range" },
  { concept: "Decimal placement & rounding", state: "fragile", detail: "Trailing-zero error flagged once" },
];

export interface ForgetForecast {
  topic: string;
  risk: "high" | "medium" | "low";
  explain: string;
}

export const lesson10Forecast: ForgetForecast[] = [
  { topic: "Pediatric weight-based dosing", risk: "high", explain: "Last correct: 12 days ago · Topic difficulty: high · Reviewed once" },
  { topic: "IV drip rate (gtt/min)", risk: "medium", explain: "Last correct: 6 days ago · Topic difficulty: medium · Reviewed twice" },
];

export const lesson10NextBestAction = {
  label: "Start review set: Pediatric dosing",
  detail: "8 items · targets your highest decay risk",
};

export const lesson10DebriefTimeline = [
  { t: "0:00", step: "Order interpretation", result: "correct", detail: "Correctly parsed the ordered dose and available concentration", tone: "success" },
  { t: "1:48", step: "Pediatric dose calculation", result: "error", detail: "Mis-placed the decimal — computed 25 mg instead of 2.5 mg", tone: "critical" },
  { t: "4:12", step: "High-alert double-check", result: "partial", detail: "Recognized the med as high-alert but skipped the independent second-check", tone: "warning" },
];

export const lesson10MissedCues = [
  { cue: "Weight-based safe-range mismatch", when: "Pediatric calculation", impact: "High" },
  { cue: "High-alert medication flag", when: "Verification", impact: "High" },
  { cue: "Trailing zero on the MAR", when: "Documentation", impact: "Medium" },
];

export const lesson10DebriefQuestions = [
  "You read the order correctly — walk through where the decimal shifted, and what check would have caught it before administration.",
  "This medication is high-alert. What is the independent double-check protocol, and at which step should it have happened?",
  "Rewrite the pediatric dose using dimensional analysis. Which unit cancels first, and how does that guard against a 10× error?",
];

export const lesson10Remediation = [
  { title: "Dimensional-Analysis Drill", type: "Guided practice", mins: 12, focus: "Decimal & unit safety", tone: "critical" },
  { title: "High-Alert Medication Safety", type: "Interactive module", mins: 10, focus: "Independent double-check", tone: "warning" },
  { title: "Replay: Pediatric Dosing (Advanced)", type: "Adaptive scenario", mins: 20, focus: "Apply under pressure", tone: "ai" },
];

export const lesson10Skills = [
  { skill: "Order interpretation", score: 88 },
  { skill: "Unit conversion", score: 82 },
  { skill: "Decimal accuracy", score: 54 },
  { skill: "Safe-range check", score: 60 },
  { skill: "High-alert protocol", score: 66 },
];
