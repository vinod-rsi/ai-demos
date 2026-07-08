import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function AiCard({
  title = "AI Adaptive Note",
  children,
  className,
  compact = false,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-ai/20 bg-ai-muted/60",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-ai text-ai-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-bold tracking-wide text-ai uppercase">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
