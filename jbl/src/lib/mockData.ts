// ============================================================================
// MOCK DATA — Edit here before presentation
// ============================================================================

export const CHAPTER = {
  title: "Chapter 7: Managing Sepsis in Adult Patients",
  book: "Foundations of Adult Critical Care Nursing, 4th Edition",
  authors: "Reyes, M., Okafor, T., & Lindqvist, A.",
  sections: [
    {
      id: "s1",
      heading: "7.1 Recognition and Early Assessment",
      paragraphs: [
        {
          id: "p1",
          text: "Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection. Early recognition remains the single most impactful nursing intervention, as mortality increases by approximately 7% for every hour antibiotics are delayed after hypotension onset. Nurses at the bedside are typically the first to identify subtle changes in mental status, respiratory rate, or capillary refill that precede overt hemodynamic collapse.",
        },
        {
          id: "p2",
          text: "The qSOFA screening tool (respiratory rate ≥22, altered mentation, systolic BP ≤100 mmHg) provides a rapid, non-laboratory-based method for identifying at-risk patients outside the ICU. A score of ≥2 warrants immediate escalation and sepsis workup, including serum lactate, blood cultures drawn prior to antibiotics, and a comprehensive metabolic panel.",
        },
      ],
    },
    {
      id: "s2",
      heading: "7.2 The Hour-1 Bundle",
      paragraphs: [
        {
          id: "p3",
          text: "The Surviving Sepsis Campaign Hour-1 Bundle consolidates five core interventions: measure lactate, obtain blood cultures before antibiotics, administer broad-spectrum antibiotics, begin 30 mL/kg crystalloid for hypotension or lactate ≥4 mmol/L, and initiate vasopressors if MAP remains below 65 mmHg after fluid resuscitation. Bundle compliance is associated with a statistically significant reduction in in-hospital mortality across observational cohorts.",
        },
        {
          id: "p4",
          text: "Norepinephrine is the first-line vasopressor for septic shock, titrated to maintain a mean arterial pressure of at least 65 mmHg. Vasopressin may be added as a second agent to reduce norepinephrine requirements. Dopamine is generally avoided due to increased arrhythmogenicity in this population.",
        },
      ],
    },
    {
      id: "s3",
      heading: "7.3 Source Control and Antimicrobial Stewardship",
      paragraphs: [
        {
          id: "p5",
          text: "Source control — the physical removal or drainage of an infectious focus — must be pursued as rapidly as clinically feasible. Common examples include drainage of intra-abdominal abscesses, removal of infected vascular catheters, and debridement of necrotic soft tissue. Delays beyond 6-12 hours are associated with worse outcomes.",
        },
        {
          id: "p6",
          text: "Antimicrobial de-escalation should be considered once culture and sensitivity data return, typically within 48-72 hours. Nurses play a key role in stewardship by ensuring timely specimen collection, accurate documentation of allergies, and monitoring for adverse drug reactions.",
        },
      ],
    },
    {
      id: "s4",
      heading: "7.4 Nursing Considerations and Family Communication",
      paragraphs: [
        {
          id: "p7",
          text: "Beyond the acute resuscitation phase, nursing care focuses on preventing secondary complications: strict glycemic control (target 140-180 mg/dL), DVT and stress ulcer prophylaxis, elevation of the head of the bed to 30 degrees, and daily sedation interruption trials. Structured family communication using tools such as SBAR reduces reported family anxiety and improves shared decision-making.",
        },
      ],
    },
  ],
};

export const STUDENT_QA = [
  {
    q: "What is the qSOFA score and when should I use it?",
    a: "qSOFA is a rapid bedside screening tool for identifying patients at risk of poor outcomes from suspected infection outside the ICU. It uses three criteria: respiratory rate ≥22, altered mentation, and systolic BP ≤100 mmHg. A score of 2 or more should trigger immediate sepsis workup and escalation.",
    citation: "p2",
    excerpt: "The qSOFA screening tool (respiratory rate ≥22, altered mentation, systolic BP ≤100 mmHg) provides a rapid, non-laboratory-based method for identifying at-risk patients outside the ICU.",
    confidence: 96,
  },
  {
    q: "Which vasopressor is first-line for septic shock?",
    a: "Norepinephrine is the first-line vasopressor for septic shock. It should be titrated to maintain a MAP of at least 65 mmHg. Vasopressin can be added as a second agent to reduce norepinephrine requirements, while dopamine is generally avoided because of increased arrhythmogenicity.",
    citation: "p4",
    excerpt: "Norepinephrine is the first-line vasopressor for septic shock, titrated to maintain a mean arterial pressure of at least 65 mmHg.",
    confidence: 98,
  },
  {
    q: "How quickly does source control need to happen?",
    a: "Source control should be pursued as rapidly as clinically feasible. Delays beyond 6–12 hours are associated with worse patient outcomes. Common examples include draining intra-abdominal abscesses, removing infected vascular catheters, and debriding necrotic tissue.",
    citation: "p5",
    excerpt: "Delays beyond 6-12 hours are associated with worse outcomes.",
    confidence: 92,
  },
  {
    q: "What are the current ACLS guidelines for pediatric cardiac arrest?",
    a: "I can only answer questions grounded in this chapter's content. Chapter 7 focuses on managing sepsis in adult patients and doesn't cover pediatric ACLS. Try asking about qSOFA, the Hour-1 Bundle, vasopressors, or nursing considerations in adult sepsis.",
    citation: null,
    excerpt: null,
    confidence: 0,
    outOfScope: true,
  },
];

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "A patient presents with a respiratory rate of 24, GCS of 13, and a systolic BP of 96 mmHg. What is the appropriate next step?",
    options: [
      "Reassess in 30 minutes",
      "Initiate a sepsis workup and escalate care",
      "Administer PRN acetaminophen",
      "Discharge with outpatient follow-up",
    ],
    correct: 1,
    paragraph: "p2",
    status: "pending",
  },
  {
    id: "q2",
    question: "Which of the following is NOT part of the Hour-1 Sepsis Bundle?",
    options: [
      "Obtain blood cultures before antibiotics",
      "Measure serum lactate",
      "Administer prophylactic corticosteroids",
      "Begin 30 mL/kg crystalloid for hypotension",
    ],
    correct: 2,
    paragraph: "p3",
    status: "pending",
  },
  {
    id: "q3",
    question: "First-line vasopressor for septic shock is:",
    options: ["Dopamine", "Epinephrine", "Norepinephrine", "Phenylephrine"],
    correct: 2,
    paragraph: "p4",
    status: "pending",
  },
  {
    id: "q4",
    question: "The recommended target MAP in septic shock is at least:",
    options: ["55 mmHg", "65 mmHg", "75 mmHg", "85 mmHg"],
    correct: 1,
    paragraph: "p4",
    status: "edited",
    originalQuestion: "The recommended target MAP in septic shock is:",
    originalOptions: ["55", "65", "75", "85"],
    editNote: "Added units to the stem and answer choices for clarity.",
  },
  {
    id: "q5",
    question: "Which glycemic target is recommended for post-resuscitation septic patients?",
    options: ["80–110 mg/dL", "110–140 mg/dL", "140–180 mg/dL", "180–220 mg/dL"],
    correct: 2,
    paragraph: "p7",
    status: "pending",
  },
];

export const FLASHCARDS = [
  { front: "qSOFA criteria", back: "RR ≥22, altered mentation, SBP ≤100 mmHg. Score ≥2 triggers sepsis workup." },
  { front: "Hour-1 Bundle (5 elements)", back: "Lactate, cultures before antibiotics, broad-spectrum antibiotics, 30 mL/kg crystalloid, vasopressors if MAP <65." },
  { front: "First-line vasopressor", back: "Norepinephrine, titrated to MAP ≥65 mmHg." },
  { front: "Source control window", back: "As rapidly as feasible; delays beyond 6–12 hours worsen outcomes." },
  { front: "Glycemic target", back: "140–180 mg/dL in post-resuscitation septic patients." },
];

export const SUMMARY_BULLETS = [
  "Sepsis mortality rises ~7% per hour of delayed antibiotics; bedside nurses are the first line of recognition.",
  "qSOFA (RR ≥22, altered mentation, SBP ≤100) rapidly flags at-risk patients outside the ICU.",
  "The Hour-1 Bundle: lactate, cultures, antibiotics, 30 mL/kg fluid, vasopressors for persistent hypotension.",
  "Norepinephrine is first-line for septic shock, titrated to MAP ≥65 mmHg; vasopressin is second-line.",
  "Source control within 6–12 hours plus stewardship, glycemic control, and structured family communication drive outcomes.",
];

export const ADMIN_TITLES = [
  { id: "t1", title: "Foundations of Adult Critical Care Nursing, 4e", aiEnabled: true, policy: "signed", policyBy: "L. Chen, Legal", policyDate: "May 14, 2026", usage: 1204 },
  { id: "t2", title: "EMS Field Operations, 3e", aiEnabled: true, policy: "signed", policyBy: "L. Chen, Legal", policyDate: "Apr 2, 2026", usage: 862 },
  { id: "t3", title: "Pharmacology for Nurses, 6e", aiEnabled: false, policy: "pending", policyBy: null, policyDate: null, usage: 0 },
  { id: "t4", title: "Paramedic Care: Principles & Practice, 5e", aiEnabled: true, policy: "signed", policyBy: "R. Alvarez, Legal", policyDate: "Jun 20, 2026", usage: 517 },
  { id: "t5", title: "Health Assessment in Nursing, 8e", aiEnabled: false, policy: "pending", policyBy: null, policyDate: null, usage: 0 },
];

export const CRM_MATCHES = [
  { id: "m1", institution: "State University College of Nursing", crmId: "CRM-40218", jblId: "JBL-88213", confidence: 97, evidence: { emailDomain: true, billingAddress: true, orderOverlap: true }, status: "pending" },
  { id: "m2", institution: "Riverside Community College — EMS Program", crmId: "CRM-40412", jblId: "JBL-88540", confidence: 94, evidence: { emailDomain: true, billingAddress: true, orderOverlap: true }, status: "pending" },
  { id: "m3", institution: "Northgate Medical Center Nursing School", crmId: "CRM-40589", jblId: "JBL-88711", confidence: 91, evidence: { emailDomain: true, billingAddress: true, orderOverlap: false }, status: "pending" },
  { id: "m4", institution: "Coastal Regional Fire Academy", crmId: "CRM-40733", jblId: "JBL-88902", confidence: 88, evidence: { emailDomain: true, billingAddress: true, orderOverlap: true }, status: "pending" },
  { id: "m5", institution: "Prairie Valley Health Institute", crmId: "CRM-40901", jblId: "JBL-89044", confidence: 72, evidence: { emailDomain: false, billingAddress: true, orderOverlap: true }, status: "pending" },
  {
    id: "m6",
    institution: "Summit Allied Health College",
    crmId: "CRM-41055",
    jblId: "JBL-89210",
    jblIdAlt: "JBL-89217",
    confidence: 54,
    evidence: { emailDomain: false, billingAddress: false, orderOverlap: true },
    status: "conflict",
    conflictNote: "This CRM account maps to two candidate JBL accounts. Manual review required.",
  },
];
