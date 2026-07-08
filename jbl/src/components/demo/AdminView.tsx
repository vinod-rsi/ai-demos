import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, Lock, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useDemo } from "./DemoContext";

export function AdminView() {
  const { titles, toggleAi, signPolicy } = useDemo();
  const [modalId, setModalId] = useState<string | null>(null);
  const active = titles.find((t) => t.id === modalId);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-start justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">AI Feature Governance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage StudyBot exposure per title. AI can only be enabled after Legal has
            signed off on the content exposure policy.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Governance policy v2.4 · active
        </div>
      </div>

      <TooltipProvider delayDuration={100}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3 font-semibold">Title</th>
              <th className="px-6 py-3 font-semibold">AI-Enabled</th>
              <th className="px-6 py-3 font-semibold">Exposure Policy</th>
              <th className="px-6 py-3 text-right font-semibold">Usage · 30d</th>
            </tr>
          </thead>
          <tbody>
            {titles.map((t) => {
              const locked = t.policy !== "signed";
              return (
                <tr
                  key={t.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-4 font-medium text-foreground">{t.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {locked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Switch checked={false} disabled />
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            AI cannot be enabled until Legal signs off on the content
                            exposure policy for this title.
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Switch
                          checked={t.aiEnabled}
                          onCheckedChange={() => {
                            toggleAi(t.id);
                            toast.success(
                              `AI ${!t.aiEnabled ? "enabled" : "disabled"} for ${t.title}`,
                            );
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setModalId(t.id)}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      {t.policy === "signed" ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
                          Signed Off
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--warning)]" />
                          Pending Legal Review
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {t.usage > 0 ? `${t.usage.toLocaleString()} questions` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TooltipProvider>

      <Dialog open={!!modalId} onOpenChange={(o) => !o && setModalId(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Content Exposure Policy
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{active.title}</p>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <PolicyRow tone="ok" label="Allow">
                  Chapter summaries, flashcards (max 50 words per card), question
                  generation grounded in the licensed text.
                </PolicyRow>
                <PolicyRow tone="deny" label="Disallow">
                  Full-text export, image OCR, verbatim reproduction of more than 60
                  consecutive words.
                </PolicyRow>
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    {active.policy === "signed" ? (
                      <>
                        Signed off by <strong>{active.policyBy}</strong> on{" "}
                        {active.policyDate}.
                      </>
                    ) : (
                      <>
                        Pending Legal review. Policy must be signed off before AI
                        features can be enabled for this title.
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                {active.policy !== "signed" && (
                  <Button
                    onClick={() => {
                      signPolicy(active.id);
                      toast.success(`Policy signed off for ${active.title}`);
                    }}
                  >
                    Sign off (demo)
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PolicyRow({
  tone,
  label,
  children,
}: {
  tone: "ok" | "deny";
  label: string;
  children: React.ReactNode;
}) {
  const c =
    tone === "ok"
      ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5"
      : "border-destructive/30 bg-destructive/5";
  const dot =
    tone === "ok"
      ? "text-[color:var(--success)]"
      : "text-destructive";
  return (
    <div className={`rounded-md border p-3 ${c}`}>
      <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${dot}`}>
        {tone === "deny" && <AlertTriangle className="h-3 w-3" />}
        {label}
      </div>
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  );
}
