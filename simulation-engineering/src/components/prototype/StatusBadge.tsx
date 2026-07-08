import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning-foreground border-warning/30",
  critical: "bg-critical-muted text-critical border-critical/20",
  info: "bg-info-muted text-info border-info/20",
  ai: "bg-ai-muted text-ai border-ai/20",
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary-muted text-primary border-primary/20",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: keyof typeof toneMap | string;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneMap[tone] ?? toneMap.neutral,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
