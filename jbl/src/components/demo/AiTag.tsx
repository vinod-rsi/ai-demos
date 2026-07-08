import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiTag({ className, label = "AI" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[color:var(--ai-border)] bg-[color:var(--ai-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ai)]",
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function AiThinking({ label = "StudyBot is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="ai-dot" />
      <span
        className="ai-dot"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="ai-dot"
        style={{ animationDelay: "0.3s" }}
      />
      <span className="ml-1">{label}…</span>
    </div>
  );
}
