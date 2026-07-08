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
}

export const roster: StudentRow[] = [
  { id: "s1", name: "Maya Ellison", initials: "ME", section: "A", completed: 6, assigned: 8, cjmi: 78, readiness: "ready", weakestSkill: "Prioritize", lastActive: "2h ago", flag: "improving" },
  { id: "s2", name: "Devon Carter", initials: "DC", section: "A", completed: 3, assigned: 8, cjmi: 52, readiness: "developing", weakestSkill: "Analyze cues", lastActive: "1d ago", flag: "at_risk" },
  { id: "s3", name: "Aisha Rahman", initials: "AR", section: "A", completed: 8, assigned: 8, cjmi: 91, readiness: "advanced", weakestSkill: "Evaluate outcomes", lastActive: "5h ago" },
  { id: "s4", name: "Liam O'Brien", initials: "LO", section: "B", completed: 4, assigned: 8, cjmi: 61, readiness: "approaching", weakestSkill: "Prioritize", lastActive: "3h ago" },
  { id: "s5", name: "Sofia Reyes", initials: "SR", section: "B", completed: 7, assigned: 8, cjmi: 84, readiness: "ready", weakestSkill: "Generate solutions", lastActive: "1h ago" },
  { id: "s6", name: "Noah Kim", initials: "NK", section: "B", completed: 2, assigned: 8, cjmi: 47, readiness: "developing", weakestSkill: "Recognize cues", lastActive: "2d ago", flag: "at_risk" },
  { id: "s7", name: "Grace Thompson", initials: "GT", section: "A", completed: 6, assigned: 8, cjmi: 74, readiness: "ready", weakestSkill: "Analyze cues", lastActive: "6h ago" },
  { id: "s8", name: "Ethan Walsh", initials: "EW", section: "B", completed: 5, assigned: 8, cjmi: 68, readiness: "approaching", weakestSkill: "Take action", lastActive: "8h ago" },
];

export const skillHeatmap: { skill: string; sectionA: number; sectionB: number }[] = [
  { skill: "Recognize cues", sectionA: 22, sectionB: 38 },
  { skill: "Analyze cues", sectionA: 41, sectionB: 47 },
  { skill: "Prioritize", sectionA: 58, sectionB: 52 },
  { skill: "Generate solutions", sectionA: 34, sectionB: 29 },
  { skill: "Take action", sectionA: 18, sectionB: 24 },
  { skill: "Evaluate outcomes", sectionA: 44, sectionB: 40 },
];

export const debriefQuestions = [
  "Devon delayed escalation in 3 of 4 sepsis cases — what cluster of cues most reliably signals early decompensation?",
  "Compare a SIRS response to sepsis: which single vital sign changed the priority order in today's scenario?",
  "The cohort struggled to reprioritize after the patient's SpO₂ dropped. Walk through your revised plan and rationale.",
  "When would a handoff be premature? Identify two cues that must be stable before transfer.",
];

export const remediationGroups = [
  { name: "Cue Prioritization Lab", size: 4, focus: "Prioritize + Analyze cues", members: ["Devon C.", "Noah K.", "Liam O.", "Ethan W."] },
  { name: "Early Escalation Workshop", size: 3, focus: "Recognize cues + timing", members: ["Devon C.", "Noah K.", "Grace T."] },
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
