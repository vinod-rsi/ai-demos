import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mic,
  Send,
  Settings,
  X,
  LogOut,
  Monitor,
  Lightbulb,
  CircleHelp,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/lab-session")({
  head: () => ({
    meta: [
      { title: "Live Lab Session — Hatsize" },
      { name: "description", content: "Live lab session with AI Copilot guidance." },
    ],
  }),
  component: LabSession,
});

const HZ_GREEN = "#2E7B38";
const HZ_GREEN_DARK = "#256330";

function LabSession() {
  const [guideOpen, setGuideOpen] = useState(true);
  const [banner, setBanner] = useState(true);
  const [socratic, setSocratic] = useState(true);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f4f5f7] text-[#22272b]"
      style={{ fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Lab View green header (single source of chrome) */}
      <header
        className="h-[56px] flex items-center justify-between pl-5 pr-4 text-white"
        style={{ background: HZ_GREEN }}
      >
        <div className="flex items-center gap-6 min-w-0">
          <div className="flex items-baseline gap-1.5 font-semibold tracking-tight">
            <span className="text-[18px]">Hatsize</span>
            <span className="text-[11px] opacity-80">learning by doing</span>
          </div>
          <div className="h-6 w-px bg-white/25" />
          <div className="min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-[15px] font-semibold truncate">
                SQL Injection: Exploit and Patch
              </h1>
              <span
                className="text-[11px] font-semibold px-2 py-[3px] rounded-full"
                style={{ background: "#d6f0db", color: HZ_GREEN_DARK }}
              >
                In Progress
              </span>
            </div>
            <p className="mt-0.5 max-w-2xl truncate text-[11px] text-white/70">
              Hands-on workspace where you exploit and patch a live SQL injection target, guided step-by-step with Socratic AI Copilot hints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <span className="px-2 py-1 rounded bg-white/10 font-mono">
            Elapsed&nbsp;<span className="font-semibold">18:42</span>
          </span>

          <button className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded bg-white/10 hover:bg-white/15">
            <Monitor className="h-3.5 w-3.5" />
            <span className="text-[12px]">attack-box</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </button>
          <button className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-white/15" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-white/15" aria-label="Exit lab">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 70 / 30 main split */}
      <div className="flex flex-1 min-h-0">
        {/* Lab environment */}
        <section className="flex-1 min-w-0 p-5 flex flex-col gap-4" style={{ flexBasis: "70%" }}>
          {/* Terminal */}
          <div className="bg-white border border-[#e3e5e8] rounded-md overflow-hidden shadow-[0_1px_0_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e3e5e8] bg-[#fafbfc]">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#4a4f55]">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </span>
                attack-box — terminal
              </div>
              <span className="text-[11px] text-[#6b7177] font-mono">10.0.0.4</span>
            </div>
            <div className="bg-[#0d1117] text-[#d6dde3] font-mono text-[13px] leading-6 p-4 min-h-[280px]">
              <Line>
                <Prompt /> curl http://10.0.0.5/login.php
              </Line>
              <div className="text-[#8b949e]">
                curl: (7) Failed to connect to 10.0.0.5 port 80: Connection refused
              </div>
              <Line className="mt-2">
                <Prompt /> sqlmap -u "http://10.0.0.5/login.php" --batch
              </Line>
              <div className="text-[#8b949e]">[*] starting @ 14:18:42</div>
              <div className="text-[#ff7b72]">
                sqlmap: error: Connection refused — target host unreachable
              </div>
              <Line className="mt-2">
                <Prompt />{" "}
                <span className="inline-block w-2 h-4 bg-[#d6dde3] align-middle animate-pulse" />
              </Line>
            </div>
          </div>

          {/* Lab Guide */}
          <div className="bg-white border border-[#e3e5e8] rounded-md">
            <button
              onClick={() => setGuideOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 border-b border-[#e3e5e8]"
            >
              <span className="font-semibold text-[14px]">Lab Guide</span>
              <span className="flex items-center gap-2 text-[12px] text-[#6b7177]">
                Step 3 of 5
                {guideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>
            {guideOpen && (
              <ol className="p-3 space-y-1.5">
                {[
                  { n: 1, t: "Recon the target environment", done: true },
                  { n: 2, t: "Enumerate exposed services on 10.0.0.5", done: true },
                  { n: 3, t: "Identify vulnerable input field", current: true },
                  { n: 4, t: "Exploit the SQL injection with sqlmap", locked: true },
                  { n: 5, t: "Patch the vulnerable query and re-test", locked: true },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="flex items-start gap-3 pl-3 pr-3 py-2.5 rounded-md"
                    style={
                      s.current
                        ? {
                            background: "#eaf6ee",
                            borderLeft: `3px solid ${HZ_GREEN}`,
                          }
                        : { borderLeft: "3px solid transparent" }
                    }
                  >
                    <span
                      className="flex items-center justify-center h-5 w-5 mt-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
                      style={
                        s.done
                          ? { background: HZ_GREEN, color: "white" }
                          : s.current
                            ? { background: "white", color: HZ_GREEN_DARK, border: `1.5px solid ${HZ_GREEN}` }
                            : { background: "#eef0f2", color: "#9aa0a6" }
                      }
                    >
                      {s.done ? "✓" : s.n}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-[13px] ${s.current ? "font-semibold text-[#22272b]" : s.locked ? "text-[#9aa0a6]" : "text-[#4a4f55]"}`}
                      >
                        Step {s.n}: {s.t}
                      </div>
                      {s.current && (
                        <div className="text-[12px] text-[#4a4f55] mt-0.5">
                          Probe the login form to find which parameter reflects unescaped input.
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* Copilot sidebar */}
        <aside
          className="border-l border-[#e3e5e8] bg-white flex flex-col"
          style={{ flexBasis: "30%", minWidth: 360 }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#e3e5e8]">
            <div className="flex items-center gap-2">
              <span
                className="h-7 w-7 rounded-md flex items-center justify-center text-white"
                style={{ background: HZ_GREEN }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="text-[15px] font-semibold">Lab Copilot</div>
              <span
                className="text-[10px] font-bold tracking-wide px-1.5 py-[2px] rounded"
                style={{ background: "#eaf6ee", color: HZ_GREEN_DARK }}
              >
                AI
              </span>
            </div>
            <div className="text-[12px] text-[#6b7177] mt-1">
              Guides you with hints and questions — not direct answers.
            </div>
          </div>

          {/* Context chips */}
          <div className="px-5 py-3 border-b border-[#e3e5e8] flex flex-wrap gap-1.5">
            <Chip>Step 3 of 5</Chip>
            <Chip mono>Last command: sqlmap …</Chip>
            <Chip warn>Status: Possibly stuck</Chip>
          </div>

          {/* Chat region */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {/* Inline stuck banner — single source above thread */}
            {banner && (
              <div
                className="rounded-md border px-3 py-2.5 text-[13px]"
                style={{ background: "#fff8e1", borderColor: "#f1d98a" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 mt-0.5 text-[#a87a00] flex-shrink-0" />
                    <span className="text-[#5a4500]">
                      You haven't progressed on Step 3 in a few minutes. Need a hint?
                    </span>
                  </div>
                  <button
                    onClick={() => setBanner(false)}
                    className="text-[#a87a00] hover:text-[#5a4500] flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pl-6 text-[12px]">
                  <button
                    className="font-semibold hover:underline"
                    style={{ color: HZ_GREEN_DARK }}
                  >
                    Show subtle hint
                  </button>
                  <button
                    className="font-semibold hover:underline"
                    style={{ color: HZ_GREEN_DARK }}
                  >
                    Show detailed explanation
                  </button>
                  <button
                    className="text-[#6b7177] hover:underline"
                    onClick={() => setBanner(false)}
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            <CopilotBubble faded>
              I noticed your last command failed to connect to the target. Let's debug this
              together — can you check if you can ping the server at{" "}
              <span className="font-mono">10.0.0.5</span> first?
            </CopilotBubble>

            <StudentBubble>Why did my sqlmap command fail?</StudentBubble>

            <CopilotBubble>
              Look at the error message in your terminal — what does "Connection refused" tell
              you about the network path? Try explaining it in your own words.
            </CopilotBubble>

            <div className="pl-9">
              <button className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-[#d4d7db] bg-white hover:bg-[#f4f5f7]">
                <CircleHelp className="h-3.5 w-3.5" style={{ color: HZ_GREEN }} />
                Hint: Check basic network connectivity (ping) before running sqlmap.
              </button>
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-[#e3e5e8] px-5 py-3 space-y-2.5">
            <div
              className="flex items-center gap-2 border rounded-md bg-white px-2 py-1.5"
              style={{ borderColor: "#d4d7db" }}
            >
              <button
                onClick={() => setListening((v) => !v)}
                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={
                  listening
                    ? { background: HZ_GREEN, color: "white" }
                    : { color: "#6b7177" }
                }
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>

              {listening ? (
                <div className="flex-1 flex items-center gap-2 text-[13px] text-[#4a4f55]">
                  <span className="font-semibold" style={{ color: HZ_GREEN_DARK }}>
                    Listening…
                  </span>
                  <span className="flex items-end gap-[2px] h-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="w-[2px] rounded-sm animate-pulse"
                        style={{
                          background: HZ_GREEN,
                          height: `${35 + ((i * 23) % 65)}%`,
                          animationDelay: `${i * 110}ms`,
                        }}
                      />
                    ))}
                  </span>
                </div>
              ) : (
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this lab or your last command…"
                  className="flex-1 outline-none text-[13px] bg-transparent placeholder:text-[#9aa0a6]"
                />
              )}

              <button
                className="h-8 w-8 rounded-md text-white flex items-center justify-center flex-shrink-0"
                style={{ background: HZ_GREEN }}
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Socratic toggle */}
            <div className="flex items-start gap-2.5">
              <button
                onClick={() => setSocratic((v) => !v)}
                className="relative inline-block w-8 h-4 rounded-full transition-colors mt-0.5 flex-shrink-0"
                style={{ background: socratic ? HZ_GREEN : "#cfd3d7" }}
                aria-pressed={socratic}
              >
                <span
                  className="absolute top-0.5 h-3 w-3 bg-white rounded-full transition-all shadow-sm"
                  style={{ left: socratic ? "16px" : "2px" }}
                />
              </button>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold text-[#22272b]">Socratic mode</div>
                <div className="text-[11px] text-[#6b7177]">
                  Gives hints and questions instead of direct answers.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Prompt() {
  return (
    <>
      <span className="text-[#7ee787]">student@attack-box</span>
      <span className="text-[#d6dde3]">:</span>
      <span className="text-[#79c0ff]">~</span>
      <span className="text-[#d6dde3]">$</span>
    </>
  );
}

function Line({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function Chip({
  children,
  warn,
  mono,
}: {
  children: React.ReactNode;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <span
      className={`text-[11px] px-2 py-[3px] rounded-full border whitespace-nowrap ${mono ? "font-mono" : ""}`}
      style={
        warn
          ? { background: "#fff4e0", borderColor: "#f0c98a", color: "#8a5a00" }
          : { background: "#f4f5f7", borderColor: "#e3e5e8", color: "#4a4f55" }
      }
    >
      {children}
    </span>
  );
}

function CopilotBubble({
  children,
  faded,
}: {
  children: React.ReactNode;
  faded?: boolean;
}) {
  return (
    <div className="flex gap-2 items-start">
      <span
        className="h-7 w-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
        style={{ background: HZ_GREEN, opacity: faded ? 0.75 : 1 }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div
        className={`text-[13px] leading-relaxed rounded-md rounded-tl-sm px-3 py-2 border ${faded ? "opacity-80" : ""}`}
        style={{ background: "#f4f7f5", borderColor: "#e1e8e3", color: "#22272b" }}
      >
        {children}
      </div>
    </div>
  );
}

function StudentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div
        className="text-[13px] leading-relaxed rounded-md rounded-tr-sm px-3 py-2 max-w-[85%] border"
        style={{ background: "#eef2f5", borderColor: "#dde2e7", color: "#22272b" }}
      >
        {children}
      </div>
    </div>
  );
}
