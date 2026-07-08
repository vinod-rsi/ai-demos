import { forwardRef } from "react";
import { CHAPTER } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface Props {
  highlightId?: string | null;
}

export const ChapterReader = forwardRef<HTMLDivElement, Props>(function ChapterReader(
  { highlightId },
  ref,
) {
  return (
    <div
      ref={ref}
      className="h-[calc(100vh-140px)] overflow-y-auto rounded-lg border bg-card"
    >
      <div className="mx-auto max-w-3xl px-10 py-10">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          {CHAPTER.book}
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground">
          {CHAPTER.title}
        </h1>
        <div className="mt-2 text-sm text-muted-foreground">{CHAPTER.authors}</div>
        <div className="mt-8 space-y-8">
          {CHAPTER.sections.map((s) => (
            <section key={s.id}>
              <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">
                {s.heading}
              </h2>
              <div className="space-y-4">
                {s.paragraphs.map((p) => (
                  <p
                    key={p.id}
                    id={`para-${p.id}`}
                    className={cn(
                      "font-serif text-[17px] leading-[1.75] text-foreground/90 transition-colors",
                      highlightId === p.id && "flash-highlight",
                    )}
                  >
                    {p.text}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
});
