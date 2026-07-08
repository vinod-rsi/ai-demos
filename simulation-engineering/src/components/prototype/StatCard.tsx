import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

const toneText: Record<string, string> = {
  success: "text-success",
  warning: "text-warning-foreground",
  critical: "text-critical",
  info: "text-info",
  ai: "text-ai",
  primary: "text-primary",
};

const toneBg: Record<string, string> = {
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning-foreground",
  critical: "bg-critical-muted text-critical",
  info: "bg-info-muted text-info",
  ai: "bg-ai-muted text-ai",
  primary: "bg-primary-muted text-primary",
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "success",
  icon: Icon,
  iconTone = "primary",
  hint,
  className,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: string;
  icon?: LucideIcon;
  iconTone?: string;
  hint?: string;
  className?: string;
}) {
  const positive = delta?.trim().startsWith("+") || deltaTone === "success";
  return (
    <Card className={cn("gap-0 p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneBg[iconTone])}>
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        {delta && (
          <span className={cn("mb-1 inline-flex items-center gap-0.5 text-xs font-semibold", toneText[deltaTone])}>
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
