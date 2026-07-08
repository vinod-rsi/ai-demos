// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

/* ─── INJECT GLOBAL CSS ─────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #0B1F3A;
    --navy2:     #1A3A5C;
    --teal:      #0891B2;
    --teal10:    rgba(8,145,178,.10);
    --teal20:    rgba(8,145,178,.20);
    --teal-bg:   #E0F7FA;
    --green:     #059669;
    --green-bg:  #D1FAE5;
    --amber:     #D97706;
    --amber-bg:  #FEF3C7;
    --red:       #DC2626;
    --red-bg:    #FEE2E2;
    --purple:    #7C3AED;
    --bg:        #F0F4F8;
    --surface:   #FFFFFF;
    --border:    #E2E8F0;
    --border2:   #CBD5E1;
    --t1:        #0F172A;
    --t2:        #475569;
    --tm:        #94A3B8;
    --ff:        'Inter', system-ui, sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --shadow:    0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.05);
    --shadow-hv: 0 4px 16px rgba(0,0,0,.12);
  }

  html, body, #root { height: 100%; font-family: var(--ff); background: var(--bg); color: var(--t1); font-size: 13px; }

  .screen-enter  { animation: fadeSlide .22s ease both; }
  @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .bar-animate { animation: barGrow .6s cubic-bezier(.4,0,.2,1) both; }
  @keyframes barGrow { from { width:0 !important; } }

  .ring-animate { animation: ringDraw .8s cubic-bezier(.4,0,.2,1) both; }
  @keyframes ringDraw { from { stroke-dashoffset: 119.4 !important; } }

  .flag-resolve { animation: flagOut .3s ease forwards; }
  @keyframes flagOut { to { opacity:0; max-height:0; padding:0; margin:0; overflow:hidden; } }

  .panel-open { animation: panelDown .25s ease both; overflow:hidden; }
  @keyframes panelDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:400px; } }

  .card-hover { transition: box-shadow .18s, transform .18s; cursor:default; }
  .card-hover:hover { box-shadow: var(--shadow-hv); transform: translateY(-1px); }

  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:8px; }

  .tab-item { position:relative; transition: color .15s; }
  .tab-item::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--teal); transform:scaleX(0); transition:transform .2s; border-radius:2px 2px 0 0; }
  .tab-item.active::after { transform:scaleX(1); }

  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }

  button:active { transform: scale(.97); }

  [contenteditable]:focus { outline: 2px solid var(--teal); border-radius:6px; }
`;

function InjectStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

/* ─── DESIGN TOKENS ───────────────────────────────────────── */
const C = {
  navy:"#0B1F3A", navy2:"#1A3A5C", teal:"#0891B2", tealBg:"#E0F7FA",
  green:"#059669", greenBg:"#D1FAE5", amber:"#D97706", amberBg:"#FEF3C7",
  red:"#DC2626", redBg:"#FEE2E2", border:"#E2E8F0", border2:"#CBD5E1",
  bg:"#F0F4F8", surface:"#fff", t1:"#0F172A", t2:"#475569", tm:"#94A3B8",
};

/* ─── SHARED COMPONENTS ───────────────────────────────────── */
function Badge({ type="gray", children, pulse=false }) {
  const map = {
    teal: { bg:C.tealBg, color:C.teal },
    green: { bg:C.greenBg, color:C.green },
    amber: { bg:C.amberBg, color:C.amber },
    red: { bg:C.redBg, color:C.red },
    navy: { bg:"#EFF6FF", color:C.navy2 },
    gray: { bg:"#F1F5F9", color:C.t2 },
  };
  const s = map[type] || map.gray;
  return (
    <span className={pulse?"pulse":""} style={{
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"3px 8px", borderRadius:4, fontSize:10, fontWeight:700,
      background:s.bg, color:s.color
    }}>{children}</span>
  );
}

function Btn({ variant="ghost", size="md", onClick, children, style:sx={}, disabled=false }) {
  const base = { display:"inline-flex", alignItems:"center", gap:5, borderRadius:6,
    fontFamily:"inherit", fontWeight:600, cursor:disabled?"not-allowed":"pointer", border:"none",
    transition:"all .15s", whiteSpace:"nowrap", opacity:disabled?.55:1, ...sx };
  const sz = size==="sm" ? { padding:"5px 12px", fontSize:11 } : { padding:"8px 16px", fontSize:12 };
  const vars = {
    navy:  { background:C.navy, color:"#fff" },
    teal:  { background:C.teal, color:"#fff" },
    green: { background:C.green, color:"#fff" },
    ghost: { background:"transparent", color:C.t2, border:`1px solid ${C.border2}` },
    danger:{ background:C.redBg, color:C.red, border:`1px solid #FCA5A5` },
  };
  return <button disabled={disabled} onClick={disabled?undefined:onClick} style={{...base,...sz,...(vars[variant]||vars.ghost)}}>{children}</button>;
}

function Card({ children, style:sx={}, className="" }) {
  return (
    <div className={`card-hover ${className}`} style={{
      background:C.surface, borderRadius:10, border:`1px solid ${C.border}`,
      boxShadow:"0 1px 3px rgba(0,0,0,.06)", ...sx
    }}>{children}</div>
  );
}

function CardHd({ title, sub, right, children }) {
  return (
    <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
      <div>
        {title && <div style={{ fontSize:13, fontWeight:700 }}>{title}</div>}
        {sub && <div style={{ fontSize:10, color:C.tm, marginTop:2 }}>{sub}</div>}
        {children}
      </div>
      {right}
    </div>
  );
}

function CardBd({ children, style:sx={} }) {
  return <div style={{ padding:"16px 18px", ...sx }}>{children}</div>;
}

function SecLabel({ children, style:sx={} }) {
  return <div style={{ fontSize:9, fontWeight:700, letterSpacing:".8px", textTransform:"uppercase",
    color:C.tm, marginBottom:7, ...sx }}>{children}</div>;
}

function AiChip({ children="AI Draft" }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
      background:"linear-gradient(135deg,#E0F7FA,#EDE9FE)", border:"1px solid #B2EBF2",
      borderRadius:4, padding:"2px 8px", fontSize:9, fontWeight:700, color:C.teal,
      letterSpacing:".3px", textTransform:"uppercase" }}>🤖 {children}</span>
  );
}

/* ─── EVIDENCE GAUGE ──────────────────────────────────────── */
const EV_DATA = [
  { domain:"Scene Safety & Approach",        level:"strong",  pct:95 },
  { domain:"Primary Patient Assessment",     level:"strong",  pct:88 },
  { domain:"Cardiac Assessment & 12-Lead",   level:"strong",  pct:84 },
  { domain:"Vital Signs Documentation",      level:"partial", pct:52 },
  { domain:"Patient Communication",          level:"partial", pct:42 },
  { domain:"Handoff Documentation (PCR)",    level:"none",    pct:0  },
];

function EvidenceGauge({ animate, simple=false }) {
  const colors = { strong:C.green, partial:C.amber, none:"transparent" };
  const labels = { strong:"Strong", partial:"Partial", none:"Not captured" };
  const textColors = { strong:C.green, partial:C.amber, none:C.red };
  return (
    <div>
      {!simple && (
        <div style={{ fontSize:11, color:C.t2, marginBottom:12, lineHeight:1.6 }}>
          AI mapped this encounter to competency domains below. <strong>Strong</strong> = fully documented. <strong>Partial</strong> = incomplete. <strong>None</strong> = not captured.
        </div>
      )}
      {EV_DATA.map((e, i) => (
        <div key={e.domain} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, fontWeight:600, maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.domain}</span>
            {!simple && <span style={{ fontSize:10, fontWeight:700, color:textColors[e.level] }}>{labels[e.level]}</span>}
          </div>
          <div style={{ height:7, background:C.border, borderRadius:4, overflow:"hidden" }}>
            <div
              className={animate ? "bar-animate" : ""}
              style={{
                height:"100%", width:`${e.pct}%`, background:colors[e.level] === "transparent" ? C.border2 : colors[e.level],
                borderRadius:4, animationDelay:`${i*0.07}s`
              }}
            />
          </div>
        </div>
      ))}
      {!simple && (
        <div style={{ display:"flex", gap:12, marginTop:8 }}>
          {[["strong",C.green],["partial",C.amber],["none",C.border2]].map(([k,col])=>(
            <div key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:C.tm }}>
              <div style={{ width:8, height:8, borderRadius:2, background:col, border:k==="none"?`1px solid ${C.border2}`:"none" }} />
              {k==="strong"?"Strong":k==="partial"?"Partial":"Not captured"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── COMPLETENESS RING ───────────────────────────────────── */
function CompletenessRing({ pct, animate, size=60 }) {
  const r = size/2 - 5, circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#B2EBF2" strokeWidth="6" />
        <circle
          className={animate ? "ring-animate" : ""}
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={pct < 50 ? C.amber : pct < 80 ? C.teal : C.green}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition:"stroke-dashoffset .4s, stroke .3s" }}
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:size/4, fontWeight:800,
        color: pct<50?C.amber:pct<80?C.teal:C.green }}>{pct}%</div>
    </div>
  );
}

/* ─── DATA ────────────────────────────────────────────────── */
const SHIFTS = [
  { id:1, name:"Marcus Reyes",   initials:"MR", color:"#0891B2", cohort:"Paramedic Fall '24", loc:"St. Luke's ED",     date:"Oct 14", enc:3, comp:"Respiratory Assessment", tier:"urgent", tags:["pediatric","airway"],   missing:2, deadline:"Milestone due Oct 16" },
  { id:2, name:"Priya Anand",    initials:"PA", color:"#7C3AED", cohort:"Paramedic Fall '24", loc:"AMR Field",         date:"Oct 14", enc:2, comp:"Cardiac Assessment",     tier:"ready",  tags:["cardiac","12-lead"],    missing:0 },
  { id:3, name:"Jordan Lee",     initials:"JL", color:"#059669", cohort:"EMT Spring '25",     loc:"County Hospital",   date:"Oct 13", enc:4, comp:"Trauma Assessment",      tier:"ready",  tags:["trauma","multi-system"],missing:0 },
  { id:4, name:"Sam Torres",     initials:"ST", color:"#D97706", cohort:"AEMT Cohort B",      loc:"Fire Station 7",    date:"Oct 12", enc:1, comp:"OB/Pediatric",           tier:"pending",tags:["ob","neonatal"],       missing:0 },
  { id:5, name:"Elena Cruz",     initials:"EC", color:"#DC2626", cohort:"Paramedic Fall '24", loc:"St. Luke's ED",     date:"Oct 11", enc:3, comp:"Respiratory Assessment", tier:"approved",tags:["asthma","cpap"],      missing:0 },
];

const FLAGS_INIT = [
  { id:1, text:"Serial vitals not documented — only one set recorded at 14:22" },
  { id:2, text:"PCR handoff documentation not captured in shift log" },
  { id:3, text:"Medication administration time missing from intervention log" },
];

/* ─── SCREEN 1: QUEUE ─────────────────────────────────────── */
function QueueScreen({ onOpenShift }) {
  const tiers = [
    { key:"urgent", label:"⚠  Needs Attention First",    labelColor:C.red,  borderColor:C.red },
    { key:"ready",  label:"●  AI Drafts Ready to Review", labelColor:C.teal, borderColor:C.teal },
    { key:"pending",label:"○  Awaiting Submission",       labelColor:C.tm,   borderColor:C.border2 },
    { key:"approved",label:"✓  Approved",                 labelColor:C.green,borderColor:C.green },
  ];

  return (
    <div className="screen-enter" style={{ padding:"22px 24px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:4 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800 }}>Shift Review Queue</div>
          <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>Dr. Elena Moss · Lead Instructor, Paramedic Program</div>
          <div style={{ fontSize:11, color:C.tm, marginTop:4, maxWidth:560, lineHeight:1.5 }}>Triage every student shift submission by status and open its AI-drafted feedback to review, resolve data gaps, and approve.</div>
        </div>
        <Btn variant="teal" size="sm">Export Report</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, margin:"16px 0" }}>
        {[
          { n:14, l:"Awaiting Review",      s:"3 overdue",              col:C.teal,  hi:true  },
          { n:9,  l:"AI Drafts Ready",      s:"Review & approve",       col:C.navy2, hi:false },
          { n:3,  l:"Data Checks Flagged",  s:"Student follow-up needed",col:C.amber,hi:false },
          { n:27, l:"Approved This Week",   s:"↑ 12% vs last week",     col:C.green, hi:false },
        ].map(m => (
          <div key={m.l} style={{
            background: m.hi ? C.tealBg : C.surface,
            border: `1px solid ${m.hi ? C.teal : C.border}`,
            borderRadius:10, padding:"13px 15px"
          }}>
            <div style={{ fontSize:26, fontWeight:800, color:m.col }}>{m.n}</div>
            <div style={{ fontSize:11, fontWeight:600, color:C.t2, marginTop:3 }}>{m.l}</div>
            <div style={{ fontSize:10, color:C.tm, marginTop:2 }}>{m.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:7, marginBottom:18, flexWrap:"wrap" }}>
        <input placeholder="Search by student, location, competency…" style={{
          flex:1, minWidth:160, padding:"7px 12px", borderRadius:6,
          border:`1px solid ${C.border}`, fontFamily:"inherit", fontSize:12, background:C.surface
        }} />
        {["All Cohorts","All Competencies","Last 7 days"].map(p => (
          <select key={p} style={{ padding:"7px 11px", borderRadius:6, border:`1px solid ${C.border}`,
            fontSize:11, color:C.t2, background:C.surface, fontFamily:"inherit", cursor:"pointer" }}>
            <option>{p}</option>
          </select>
        ))}
      </div>

      {tiers.map(tier => {
        const shifts = SHIFTS.filter(s => s.tier === tier.key);
        if (!shifts.length) return null;
        return (
          <div key={tier.key} style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:".8px", textTransform:"uppercase",
              color:tier.labelColor, marginBottom:9, display:"flex", alignItems:"center", gap:5 }}>
              {tier.label}
            </div>
            {shifts.map(s => <ShiftCard key={s.id} shift={s} borderColor={tier.borderColor} onOpen={() => onOpenShift(s)} />)}
          </div>
        );
      })}
    </div>
  );
}

function ShiftCard({ shift:s, borderColor, onOpen }) {
  return (
    <div className="card-hover" style={{
      background:C.surface, borderRadius:9, border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${borderColor}`, padding:"13px 15px",
      display:"flex", alignItems:"center", gap:12, marginBottom:8,
      opacity: s.tier==="approved" ? .75 : 1
    }}>
      <div style={{ width:36, height:36, borderRadius:"50%", background:s.color,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>{s.initials}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>{s.name}</div>
        <div style={{ fontSize:11, color:C.t2, marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {s.cohort} · {s.loc} · {s.date} · {s.enc} encounter{s.enc>1?"s":""}
        </div>
        <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
          <Badge type="navy">{s.comp}</Badge>
          {s.tags.map(t => <Badge key={t} type="gray">{t}</Badge>)}
          {s.missing > 0 && <Badge type="amber" pulse>⚠ {s.missing} data gaps</Badge>}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
        {s.deadline && <div style={{ fontSize:10, fontWeight:600, color:C.red, whiteSpace:"nowrap" }}>⏱ {s.deadline}</div>}
        {s.tier === "approved"
          ? <Badge type="green">✓ Approved</Badge>
          : <Btn variant="navy" size="sm" onClick={onOpen}>
              {s.tier==="urgent" ? "Resolve Flags →" : s.tier==="ready" ? "Review Draft →" : "Review →"}
            </Btn>}
      </div>
    </div>
  );
}

/* ─── SCREEN 2: REVIEW ────────────────────────────────────── */
const DEFAULT_DRAFT = `Student demonstrated sound clinical reasoning during a cardiac emergency. Encounter began with appropriate scene size-up and rapid identification of a 58-year-old male in acute distress. Assessment was systematic and competency-aligned: history obtained, 12-lead ECG acquired and transmitted, IV access established efficiently.

Intervention sequence was appropriate and protocol-adherent: aspirin administered, oxygen delivered via NRB, IV fluid initiated. Student maintained calm therapeutic communication throughout transport.

Recommendation: Strong evidence for Cardiac Assessment competency. Instructor should verify PCR handoff documentation before marking competency as fully met. Serial vitals not documented — coach student to record vitals at 5-minute intervals on future cardiac calls.`;

function ReviewScreen({ shift, onBack }) {
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [flags, setFlags] = useState(FLAGS_INIT.map(f => ({ ...f, resolved:false, resolving:false })));
  const [approved, setApproved] = useState(false);
  const [gaugeVisible, setGaugeVisible] = useState(false);
  const gaugeRef = useRef();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGaugeVisible(true); }, { threshold:.2 });
    if (gaugeRef.current) obs.observe(gaugeRef.current);
    return () => obs.disconnect();
  }, []);

  const resolveFlag = id => {
    setFlags(prev => prev.map(f => f.id===id ? {...f, resolving:true} : f));
    setTimeout(() => setFlags(prev => prev.map(f => f.id===id ? {...f, resolved:true, resolving:false} : f)), 300);
  };
  const openFlags = flags.filter(f => !f.resolved).length;
  const canApprove = openFlags === 0;

  if (approved) return (
    <div className="screen-enter" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
      <div style={{ textAlign:"center", maxWidth:440 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.greenBg,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 20px" }}>✓</div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Feedback Sent to Student</div>
        <div style={{ fontSize:13, color:C.t2, lineHeight:1.7, marginBottom:20 }}>
          {shift?.name || "Priya Anand"} has been notified. Feedback is logged under your name as the reviewing instructor and attached to their competency record.
        </div>
        <div style={{ padding:"12px 16px", background:C.greenBg, borderRadius:8, fontSize:12,
          color:C.green, fontWeight:600, marginBottom:24, textAlign:"left" }}>
          ✓ Cardiac Assessment competency evidence confirmed<br/>
          ✓ Accreditation thread updated<br/>
          ✓ Student notified via email & in-app
        </div>
        <Btn variant="navy" onClick={() => { setApproved(false); onBack(); }}>← Back to Queue</Btn>
      </div>
    </div>
  );

  return (
    <div className="screen-enter" style={{ padding:"22px 24px", maxWidth:1140, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Queue</Btn>
        <span style={{ color:C.tm }}>/</span>
        <span style={{ fontSize:13, fontWeight:700 }}>{shift?.name || "Priya Anand"}</span>
        <span style={{ color:C.tm }}>·</span>
        <span style={{ fontSize:11, color:C.t2 }}>Oct 14 · AMR Field · Cardiac Assessment</span>
        <div style={{ marginLeft:"auto" }}><AiChip /></div>
      </div>
      <div style={{ fontSize:11, color:C.tm, marginTop:-8, marginBottom:14, maxWidth:640, lineHeight:1.5 }}>Review one encounter's AI-drafted feedback, resolve flagged data gaps, and confirm competency evidence before it's sent to the student under your name.</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 390px", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <Card>
            <CardHd title="Patient Encounter Summary" sub="Auto-extracted from student log · Oct 14, 14:18–15:02"
              right={<Badge type="navy">Cardiac Assessment</Badge>} />
            <CardBd>
              <div style={{ fontSize:12, color:C.t2, lineHeight:1.65, marginBottom:12 }}>
                <strong style={{ color:C.t1 }}>Chief Complaint:</strong> 58M, chest pain radiating to left arm × 45 min. Diaphoretic, pale. PMH: HTN, DM type 2. 12-lead confirmed ST elevation V2–V4.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:14 }}>
                {[
                  { l:"HR",           v:"104",    s:"Tachycardic",   warn:true  },
                  { l:"BP",           v:"158/94", s:"Elevated",      warn:true  },
                  { l:"SpO₂",         v:"96%",    s:"Within range",  warn:false },
                  { l:"GCS",          v:"15",     s:"Alert",         warn:false },
                  { l:"RR",           v:"18",     s:"Normal",        warn:false },
                  { l:"Serial Vitals",v:"—",      s:"Data gap",      warn:true, gap:true },
                ].map(vi => (
                  <div key={vi.l} style={{
                    background: vi.gap ? C.amberBg : "#F8FAFC",
                    borderRadius:6, padding:"8px 10px"
                  }}>
                    <div style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", color:C.tm }}>{vi.l}</div>
                    <div style={{ fontSize:vi.gap?12:15, fontWeight:700, fontFamily:"var(--mono)", marginTop:2,
                      color:vi.gap?C.amber:C.t1 }}>{vi.v}</div>
                    <div style={{ fontSize:9, fontWeight:600, marginTop:1, color:vi.warn?C.amber:C.green }}>{vi.s}</div>
                  </div>
                ))}
              </div>
              <SecLabel>Interventions Logged</SecLabel>
              {["Aspirin 324mg PO administered","12-Lead ECG performed & transmitted to receiving ED","IV access established — 18g right AC","Normal saline 250mL bolus initiated","Oxygen via NRB @ 15 LPM"].map(item => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12,
                  color:C.t2, padding:"6px 10px", background:"#F8FAFC", borderRadius:6, marginBottom:5 }}>
                  <div style={{ width:14, height:14, borderRadius:3, background:C.greenBg,
                    border:`1px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, fontSize:8, color:C.green }}>✓</div>
                  {item}
                </div>
              ))}
            </CardBd>
          </Card>

          <Card>
            <CardHd title="AI-Drafted Feedback" sub="Review, edit, and approve — your name will be on record" right={<AiChip />} />
            <CardBd>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:600, color:C.t2 }}>Draft confidence</span>
                <div style={{ flex:1, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
                  <div className="bar-animate" style={{ height:"100%", width:"82%",
                    background:`linear-gradient(90deg,${C.teal},${C.green})`, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:C.teal }}>82%</span>
              </div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={8}
                style={{ width:"100%", minHeight:148, resize:"vertical",
                  border:`1px solid ${C.border}`, borderRadius:6, padding:"12px",
                  fontSize:12, fontFamily:"inherit", lineHeight:1.7, color:C.t1,
                  background:"#FAFCFF", transition:"border-color .15s", outline:"none" }}
                onFocus={e => e.target.style.borderColor = C.teal}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <div style={{ fontSize:10, color:C.tm, display:"flex", alignItems:"center", gap:4, marginTop:5 }}>
                ✏️ Editing this draft saves your changes. Final feedback is attributed to you, not the AI.
              </div>
              <div style={{ display:"flex", gap:8, paddingTop:12, borderTop:`1px solid ${C.border}`, marginTop:12, flexWrap:"wrap", alignItems:"center" }}>
                <Btn variant="green" disabled={!canApprove} onClick={() => setApproved(true)}>
                  ✓ Approve & Send to Student
                </Btn>
                <Btn variant="ghost">Save as Draft</Btn>
                <Btn variant="danger" size="sm">Flag for Second Review</Btn>
                {!canApprove && (
                  <span style={{ fontSize:10, color:C.amber, fontWeight:600, marginLeft:"auto" }}>
                    Resolve {openFlags} data gap{openFlags>1?"s":""} to approve →
                  </span>
                )}
              </div>
            </CardBd>
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <Card>
            <CardHd title="Competency Evidence Map" right={<span style={{ fontSize:10, color:C.tm }}>NRP Framework</span>} />
            <CardBd>
              <div ref={gaugeRef}>
                <EvidenceGauge animate={gaugeVisible} />
              </div>
              <div style={{ marginTop:10, padding:"9px 11px", background:C.amberBg,
                borderRadius:6, fontSize:10, color:C.amber, fontWeight:500, lineHeight:1.6 }}>
                ⚠ Handoff documentation required to fully meet CAAHEP Appendix G standard. Instructor note recommended before sign-off.
              </div>
            </CardBd>
          </Card>

          <Card>
            <CardHd title="Data Gaps" right={<Badge type={openFlags>0?"amber":"green"}>{openFlags} open</Badge>} />
            <CardBd>
              <div style={{ fontSize:11, color:C.t2, marginBottom:8 }}>
                Detected in student's log. Resolve or note before approving.
              </div>
              {flags.map(f => (
                <div key={f.id} className={f.resolving?"flag-resolve":""} style={{
                  display:"flex", alignItems:"flex-start", gap:8, padding:"9px 11px",
                  background: f.resolved ? C.greenBg : C.amberBg,
                  borderRadius:6, marginBottom:6,
                  borderLeft:`3px solid ${f.resolved ? C.green : C.amber}`,
                  transition:"all .3s", overflow:"hidden"
                }}>
                  <span style={{ fontSize:13 }}>{f.resolved?"✓":"⚠"}</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:500, color:f.resolved?C.green:C.t1 }}>
                      {f.resolved?"Resolved: ":""}{f.text}
                    </div>
                    {!f.resolved && (
                      <div onClick={() => resolveFlag(f.id)} style={{ fontSize:10, color:C.amber,
                        marginTop:3, cursor:"pointer", fontWeight:700 }}>
                        Mark as noted / resolved →
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {canApprove && (
                <div style={{ padding:"9px 11px", background:C.greenBg, borderRadius:6,
                  fontSize:11, color:C.green, fontWeight:600, textAlign:"center" }}>
                  ✓ All flags resolved — ready to approve
                </div>
              )}
            </CardBd>
          </Card>

          <Card>
            <CardHd title="Accreditation Thread" right={<AiChip>Auto-tracked</AiChip>} />
            <CardBd>
              <div style={{ fontSize:11, color:C.t2, marginBottom:8 }}>Approving this encounter will update Priya's program record:</div>
              {[
                { l:"Cardiac encounters (required: 8)", v:"6/8 → 7/8", col:C.amber },
                { l:"12-Lead ECG documentation",       v:"4/4 ✓",     col:C.green },
                { l:"Appendix G — Cardiac domain",     v:"Partial → Met*", col:C.amber },
              ].map(r => (
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"7px 10px", background:C.bg, borderRadius:6, marginBottom:5 }}>
                  <span style={{ fontSize:11, color:C.t2 }}>{r.l}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:r.col, whiteSpace:"nowrap" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ fontSize:10, color:C.tm, marginTop:4 }}>*Pending handoff note from instructor</div>
            </CardBd>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── SCREEN 3: STUDENT LOG ───────────────────────────────── */
const STU_CHECKS = [
  { label:"Chief complaint documented", field:"cc",
    why:"Chief complaint anchors the whole encounter. Instructors use it to judge whether your assessment addressed what the patient actually presented with.",
    good:"e.g. \"58-year-old male, chest pain radiating to left arm, onset 45 minutes ago, 8/10 severity, diaphoretic.\"" },
  { label:"Patient history obtained",   field:"hx",
    why:"PMH shapes differential diagnosis and treatment decisions. Missing history is one of the top competency deductions on cardiac calls.",
    good:"e.g. \"PMH: HTN, Type 2 DM. Meds: metoprolol, metformin. Allergies: NKDA. Last meal 2h ago.\"" },
  { label:"HR recorded",   field:"hr",
    why:"Heart rate is a required vital for every encounter and part of the Vital Signs Documentation competency.",
    good:"Enter a number (e.g. 104). If irregular, note rhythm in interventions." },
  { label:"BP recorded",   field:"bp",
    why:"Blood pressure is required and directly maps to hemodynamic status assessment.",
    good:"Format: systolic/diastolic (e.g. 158/94). Log serial BPs in interventions field on cardiac calls." },
  { label:"SpO₂ recorded", field:"spo2",
    why:"Oxygen saturation is a required vital and justifies oxygen therapy decisions.",
    good:"Enter as % (e.g. 96). Note delivery method used in interventions if supplemental O₂ given." },
  { label:"Interventions listed", field:"int",
    why:"Interventions are the primary evidence for skill-based competencies. Instructors cannot credit skills you don't document.",
    good:"List each intervention with dose/route/time. e.g. \"12-Lead ECG at 14:22 · Aspirin 324mg PO at 14:24 · IV 18g R-AC.\"" },
  { label:"PCR / Handoff documented",   field:"pcr",
    why:"Handoff documentation is required by CAAHEP Appendix G and is the #1 reason encounters get flagged incomplete. Without it, competency cannot be signed off.",
    good:"e.g. \"Handoff to Dr. Chen at St. Luke's ED at 15:02. SBAR given. All interventions and vitals communicated. Report signed.\"" },
];

function StudentScreen() {
  const [vals, setVals] = useState({ cc:"58M, chest pain radiating to left arm", hx:"HTN, DM type 2. Onset 45 min ago.", hr:"104", bp:"158/94", spo2:"96", int:"12-Lead ECG, Aspirin 324mg, IV access 18g", pcr:"" });
  const [submitted, setSubmitted] = useState(false);
  const [openGuide, setOpenGuide] = useState(null);

  const set = (k, v) => setVals(p => ({ ...p, [k]:v }));
  const done = STU_CHECKS.filter(c => vals[c.field] && vals[c.field].trim().length > 3);
  const pct = Math.round((done.length / STU_CHECKS.length) * 100);
  const hasPcr = vals.pcr.trim().length > 3;
  const canSubmit = done.length >= 6;

  const cov = [
    { name:"Scene Safety",       pct:90,             col:C.green },
    { name:"Patient Assessment", pct:80,             col:C.green },
    { name:"Cardiac Mgmt",       pct:75,             col:C.teal  },
    { name:"Vitals Docs",        pct: (vals.hr && vals.bp && vals.spo2)?75:40,  col:(vals.hr && vals.bp && vals.spo2)?C.green:C.amber },
    { name:"Handoff (PCR)",      pct:hasPcr?80:8,    col:hasPcr?C.green:C.red },
  ];

  if (submitted) return (
    <div className="screen-enter" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:24 }}>
      <div style={{ textAlign:"center", maxWidth:460 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.tealBg,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 20px" }}>📋</div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Submitted</div>
        <div style={{ fontSize:13, color:C.t2, lineHeight:1.7, marginBottom:24 }}>
          Your shift is with <strong>Dr. Elena Moss</strong> for review. You'll be notified when feedback is ready.
        </div>
        <Btn variant="navy" onClick={() => { setSubmitted(false); setVals(p=>({...p,pcr:""})); }}>← Log Another Shift</Btn>
      </div>
    </div>
  );

  return (
    <div className="screen-enter" style={{ padding:"22px 24px", maxWidth:1180, margin:"0 auto" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:800 }}>Log a Patient Encounter</div>
        <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>AI checks your log in real time and previews competency coverage before you submit.</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:18, alignItems:"start" }}>

        {/* LEFT: Log form */}
        <Card>
          <CardHd title="New Encounter Log" sub="Oct 14 · AMR Field Shift · Preceptor: J. Calderon" />
          <CardBd>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              <div>
                <SecLabel>Chief Complaint</SecLabel>
                <textarea value={vals.cc} onChange={e=>set("cc",e.target.value)} rows={2}
                  placeholder="Age, sex, presenting complaint, duration, severity…"
                  style={{ width:"100%", padding:"9px 11px", borderRadius:6, border:`1px solid ${C.border}`,
                    fontSize:12, fontFamily:"inherit", resize:"vertical", outline:"none", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor=C.teal}
                  onBlur={e=>e.target.style.borderColor=C.border}
                />
              </div>

              <div>
                <SecLabel>Patient History / PMH</SecLabel>
                <textarea value={vals.hx} onChange={e=>set("hx",e.target.value)} rows={2}
                  placeholder="PMH, medications, allergies, last meal, onset…"
                  style={{ width:"100%", padding:"9px 11px", borderRadius:6, border:`1px solid ${C.border}`,
                    fontSize:12, fontFamily:"inherit", resize:"vertical", outline:"none", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor=C.teal}
                  onBlur={e=>e.target.style.borderColor=C.border}
                />
              </div>

              <div>
                <SecLabel>Vitals</SecLabel>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { k:"hr",   l:"HR (bpm)" },
                    { k:"bp",   l:"BP (mmHg)" },
                    { k:"spo2", l:"SpO₂ (%)" },
                    { k:"rr",   l:"RR (/min)" },
                  ].map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize:10, color:C.tm, marginBottom:3, fontWeight:600 }}>{f.l}</div>
                      <input value={vals[f.k]||""} onChange={e=>set(f.k,e.target.value)}
                        placeholder={f.l.split(" ")[0]}
                        style={{ width:"100%", padding:"9px 11px", borderRadius:6, border:`1px solid ${C.border}`,
                          fontSize:13, fontFamily:"var(--mono)", fontWeight:700, outline:"none" }}
                        onFocus={e=>e.target.style.borderColor=C.teal}
                        onBlur={e=>e.target.style.borderColor=C.border}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SecLabel>Interventions</SecLabel>
                <textarea value={vals.int} onChange={e=>set("int",e.target.value)} rows={3}
                  placeholder="List each intervention with dose, route, and time…"
                  style={{ width:"100%", padding:"9px 11px", borderRadius:6, border:`1px solid ${C.border}`,
                    fontSize:12, fontFamily:"inherit", resize:"vertical", outline:"none", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor=C.teal}
                  onBlur={e=>e.target.style.borderColor=C.border}
                />
              </div>

              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                  <SecLabel style={{ marginBottom:0 }}>PCR / Handoff Documentation</SecLabel>
                  {!hasPcr && <Badge type="red">Required</Badge>}
                </div>
                <textarea value={vals.pcr} onChange={e=>set("pcr",e.target.value)} rows={3}
                  placeholder="SBAR handoff, receiving provider, time, key items communicated…"
                  style={{ width:"100%", padding:"9px 11px", borderRadius:6,
                    border:`2px solid ${!hasPcr?C.red:C.border}`,
                    background: !hasPcr ? "#FEF2F2" : C.surface,
                    fontSize:12, fontFamily:"inherit", resize:"vertical", outline:"none", lineHeight:1.6,
                    transition:"border-color .2s, background .2s" }}
                  onFocus={e=>e.target.style.borderColor=C.teal}
                  onBlur={e=>e.target.style.borderColor=(!hasPcr?C.red:C.border)}
                />
              </div>

              {/* Submit */}
              <div style={{ paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                <button
                  disabled={!canSubmit}
                  onClick={() => canSubmit && setSubmitted(true)}
                  style={{
                    width:"100%", padding:"14px", borderRadius:8, border:"none",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    background: canSubmit ? C.green : "#E2E8F0",
                    color: canSubmit ? "#fff" : C.tm,
                    fontSize:14, fontWeight:700, fontFamily:"inherit",
                    transition:"all .2s"
                  }}>
                  {canSubmit ? "Submit for Review →" : `Fix issues first — ${STU_CHECKS.length-done.length} incomplete`}
                </button>
              </div>
            </div>
          </CardBd>
        </Card>

        {/* RIGHT: AI Completeness Assistant */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:22 }}>

          {/* Score card */}
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
            background:C.tealBg, borderRadius:10, border:`1px solid #B2EBF2` }}>
            <CompletenessRing pct={pct} animate size={64} />
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>Log Completeness</div>
              <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{done.length} of {STU_CHECKS.length} items complete</div>
              <div style={{ fontSize:10, color:C.teal, fontWeight:700, marginTop:3 }}>
                {canSubmit ? "✓ Ready to submit" : `${STU_CHECKS.length-done.length} item${STU_CHECKS.length-done.length>1?"s":""} to go`}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <Card>
            <CardHd><div style={{ fontSize:12, fontWeight:700 }}>Completeness Checklist</div></CardHd>
            <div style={{ padding:"8px 12px" }}>
              {STU_CHECKS.map((c) => {
                const isDone = vals[c.field] && vals[c.field].trim().length > 3;
                const isOpen = openGuide === c.field;
                return (
                  <div key={c.field}>
                    <div style={{ display:"flex", alignItems:"center", gap:8,
                      padding:"8px 10px", borderRadius:6,
                      background: isDone ? C.greenBg : "#FEF7ED",
                      marginBottom:4, transition:"all .2s" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%",
                        background: isDone ? C.green : C.amber,
                        color:"#fff", fontSize:9, fontWeight:800, flexShrink:0,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {isDone ? "✓" : "!"}
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, color: isDone ? C.green : C.t1, flex:1 }}>
                        {c.label}
                      </span>
                      {!isDone && (
                        <button onClick={() => setOpenGuide(isOpen ? null : c.field)} style={{
                          padding:"3px 9px", borderRadius:4, border:`1px solid ${C.amber}`,
                          background: isOpen ? C.amber : C.surface,
                          color: isOpen ? "#fff" : C.amber,
                          fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit"
                        }}>
                          {isOpen ? "Close" : "Fix →"}
                        </button>
                      )}
                    </div>
                    {isOpen && !isDone && (
                      <div className="panel-open" style={{
                        margin:"0 4px 8px", padding:"12px 14px",
                        background: C.surface, border:`1px solid ${C.amber}`,
                        borderLeft:`3px solid ${C.amber}`, borderRadius:7
                      }}>
                        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
                          letterSpacing:".5px", color:C.amber, marginBottom:5 }}>Why this matters</div>
                        <div style={{ fontSize:11, color:C.t2, lineHeight:1.6, marginBottom:10 }}>{c.why}</div>
                        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
                          letterSpacing:".5px", color:C.teal, marginBottom:5 }}>What good looks like</div>
                        <div style={{ fontSize:11, color:C.t2, lineHeight:1.6,
                          padding:"8px 10px", background:C.tealBg, borderRadius:5,
                          fontStyle:"italic", marginBottom:10 }}>{c.good}</div>
                        <button onClick={() => setOpenGuide(null)} style={{
                          padding:"5px 12px", borderRadius:5, border:"none",
                          background:C.navy, color:"#fff", fontSize:11, fontWeight:700,
                          cursor:"pointer", fontFamily:"inherit"
                        }}>Got it</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Competency Coverage Preview */}
          <Card>
            <CardHd right={<AiChip>Live preview</AiChip>}>
              <div style={{ fontSize:12, fontWeight:700 }}>Competency Coverage</div>
            </CardHd>
            <div style={{ padding:"10px 14px 12px" }}>
              {cov.map(c => (
                <div key={c.name} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10, fontWeight:600, color:C.t2 }}>{c.name}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:c.col, fontFamily:"var(--mono)" }}>{c.pct}%</span>
                  </div>
                  <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${c.pct}%`, background:c.col,
                      borderRadius:3, transition:"width .5s cubic-bezier(.4,0,.2,1), background .3s" }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize:10, color:C.tm, marginTop:8, lineHeight:1.5 }}>
                Estimate updates as you fill fields. Instructor makes the final competency decision.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── SCREEN 4: MY FEEDBACK ────────────────────────────────── */
function MyFeedbackScreen() {
  return (
    <div className="screen-enter" style={{ padding:"32px 24px", maxWidth:720, margin:"0 auto" }}>

      {/* Section 1: Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
          <Badge type="green">✓ Reviewed & Approved</Badge>
          <span style={{ fontSize:11, color:C.tm }}>Delivered Oct 15, 09:24</span>
        </div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Feedback from Dr. Elena Moss</div>
        <div style={{ fontSize:12, color:C.t2, lineHeight:1.7 }}>
          Oct 14 · AMR Field Shift · <strong>Cardiac Assessment</strong>
        </div>
        <div style={{ fontSize:11, color:C.tm, marginTop:6, maxWidth:560, lineHeight:1.5 }}>Read your instructor's approved feedback for this shift, see how it mapped to competency, and get your coaching next steps.</div>
      </div>

      {/* Section 2: Feedback narrative */}
      <Card style={{ marginBottom:20, borderLeft:`4px solid ${C.navy}` }}>
        <CardBd style={{ padding:"20px 24px" }}>
          <SecLabel style={{ color:C.navy2, marginBottom:12 }}>Instructor Feedback</SecLabel>
          <div style={{ fontSize:13, color:C.t1, lineHeight:1.8 }}>
            <p style={{ marginBottom:12 }}>
              You demonstrated sound clinical reasoning during a challenging cardiac emergency. Your scene size-up was rapid and appropriate, and you correctly identified this 58-year-old male as a high-acuity STEMI presentation within the first two minutes.
            </p>
            <p style={{ marginBottom:12 }}>
              Your intervention sequence was protocol-adherent and confident: aspirin, oxygen, IV access, and 12-lead ECG were all executed in the right order. You also maintained calm, therapeutic communication with the patient during transport — this is the kind of bedside presence that makes a real difference.
            </p>
            <p>
              <strong>To grow from here:</strong> record serial vitals at 5-minute intervals on future cardiac calls, and always complete your PCR handoff before you leave the receiving facility. Both are required before I can fully sign off your Cardiac Assessment competency.
            </p>
          </div>
          <div style={{ marginTop:16, paddingTop:12, borderTop:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:C.navy,
              color:"#fff", fontSize:10, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center" }}>EM</div>
            <div>
              <div style={{ fontSize:11, fontWeight:700 }}>Dr. Elena Moss</div>
              <div style={{ fontSize:10, color:C.tm }}>Lead Instructor · Paramedic Program</div>
            </div>
          </div>
        </CardBd>
      </Card>

      {/* Section 3: Competency evidence */}
      <Card style={{ marginBottom:20 }}>
        <CardHd title="How your encounter mapped to competency" />
        <CardBd>
          <EvidenceGauge animate simple />
        </CardBd>
      </Card>

      {/* Section 4: What's next */}
      <Card style={{ marginBottom:16 }}>
        <CardHd title="What's next" sub="Coaching notes from this encounter + your program progress" />
        <div style={{ padding:"8px 8px 14px" }}>
          {[
            {
              icon:"❤️", iconBg:C.redBg, iconCol:C.red,
              title:"Log serial vitals on your next cardiac call",
              desc:"Coaching note from this encounter — record vitals every 5 minutes.",
              tag:"Coaching note"
            },
            {
              icon:"📄", iconBg:C.amberBg, iconCol:C.amber,
              title:"Complete your PCR documentation",
              desc:"Required before Cardiac Assessment competency is fully signed off.",
              tag:"Required"
            },
            {
              icon:"📊", iconBg:C.tealBg, iconCol:C.teal,
              title:"You need 1 more cardiac encounter",
              desc:"Program quota: 7 of 8 cardiac encounters logged so far.",
              tag:"Progress"
            },
          ].map(item => (
            <div key={item.title} style={{ display:"flex", gap:12, alignItems:"flex-start",
              padding:"12px 16px", margin:"4px 8px", borderRadius:8,
              transition:"background .15s", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width:36, height:36, borderRadius:8, background:item.iconBg,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                {item.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{item.title}</div>
                  <span style={{ fontSize:9, fontWeight:700, color:item.iconCol,
                    padding:"1px 7px", borderRadius:3, background:item.iconBg,
                    textTransform:"uppercase", letterSpacing:".4px" }}>{item.tag}</span>
                </div>
                <div style={{ fontSize:11, color:C.t2, lineHeight:1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, textAlign:"right" }}>
          <a href="#" onClick={e=>e.preventDefault()} style={{ fontSize:11, fontWeight:700,
            color:C.teal, textDecoration:"none" }}>View All Requirements →</a>
        </div>
      </Card>
    </div>
  );
}

/* ─── ROOT APP ────────────────────────────────────────────── */
const TABS = [
  { id:"queue",     role:"Instructor", label:"Shift Queue"     },
  { id:"review",    role:"Instructor", label:"AI Draft Review" },
  { id:"student",   role:"Student",    label:"Log & Submit"    },
  { id:"feedback",  role:"Student",    label:"My Feedback"     },
];

function FISDAQCopilot() {
  const [tab, setTab] = useState("queue");
  const [selectedShift, setSelectedShift] = useState(null);
  const [key, setKey] = useState(0);

  const go = (id) => { setTab(id); setKey(k => k+1); };

  const handleOpenShift = (shift) => {
    setSelectedShift(shift);
    go("review");
  };

  const currentUser = tab.startsWith("student") || tab === "student" || tab === "feedback"
    ? { initials:"PA", name:"Priya Anand", role:"Student · Paramedic Fall '24", color:"#7C3AED" }
    : { initials:"EM", name:"Dr. Elena Moss", role:"Lead Instructor · Paramedic Program", color:C.teal };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", fontFamily:"var(--ff)" }}>
      <InjectStyles />

      {/* Top Nav */}
      <div style={{ background:C.navy, color:"#fff", display:"flex", alignItems:"center",
        padding:"0 24px", height:54, gap:16, flexShrink:0 }}>
        <div style={{ fontWeight:800, fontSize:16, letterSpacing:"-.3px", display:"flex", alignItems:"center", gap:8 }}>
          FISDAP
          <span style={{ color:C.teal }}>·</span>
          <span style={{ background:C.teal, color:"#fff", fontSize:9, fontWeight:700,
            padding:"2px 7px", borderRadius:4, letterSpacing:".5px" }}>AI COPILOT</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:currentUser.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:700, color:"#fff" }}>{currentUser.initials}</div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{currentUser.name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>{currentUser.role}</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background:C.navy2, display:"flex", padding:"0 24px", gap:2,
        flexShrink:0, borderBottom:"1px solid rgba(255,255,255,.06)", overflowX:"auto" }}>
        {TABS.map(t => (
          <div
            key={t.id}
            className={`tab-item ${tab===t.id?"active":""}`}
            onClick={() => go(t.id)}
            style={{
              padding:"10px 16px", fontSize:11, fontWeight:500, cursor:"pointer",
              color: tab===t.id ? C.teal : "rgba(255,255,255,.45)",
              borderBottom: `2px solid ${tab===t.id ? C.teal : "transparent"}`,
              whiteSpace:"nowrap", userSelect:"none", transition:"color .15s",
            }}
          >
            <span style={{
              display:"inline-block", borderRadius:3,
              padding:"1px 5px", fontSize:8, fontWeight:700, letterSpacing:".3px",
              textTransform:"uppercase", marginRight:5,
              color: tab===t.id ? C.teal : "rgba(255,255,255,.3)",
              background: tab===t.id ? "rgba(8,145,178,.15)" : "rgba(255,255,255,.08)",
            }}>{t.role}</span>
            {t.label}
          </div>
        ))}
      </div>

      {/* Screen area */}
      <div style={{ flex:1, overflow:"auto" }}>
        {tab==="queue"    && <QueueScreen    key={key} onOpenShift={handleOpenShift} />}
        {tab==="review"   && <ReviewScreen   key={key} shift={selectedShift} onBack={() => go("queue")} />}
        {tab==="student"  && <StudentScreen  key={key} />}
        {tab==="feedback" && <MyFeedbackScreen key={key} />}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: FISDAQCopilot,
});
