import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ITEM_SOURCES, type ItemSource } from "@/lib/mockData";

const toneCls: Record<ItemSource, string> = {
  studybot: "border-[color:var(--ai-border)] bg-[color:var(--ai-soft)] text-[color:var(--ai)]",
  mentor: "border-sky-300/60 bg-sky-50 text-sky-700",
  cab: "border-amber-300/60 bg-amber-50 text-amber-700",
};

// Makes the shared, de-duplicated item bank visible: every generated item shows
// which service it came from (StudyBot / Student Mentor / CAB) — a direct nod to
// the #24 item-generation dedup boundary.
export function ProvenanceBadge({ source }: { source: ItemSource }) {
  const meta = ITEM_SOURCES[source];
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex cursor-default items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${toneCls[source]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {meta.tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
