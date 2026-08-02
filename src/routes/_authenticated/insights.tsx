import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { generateInsights } from "@/lib/insights.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Insights } from "@/lib/insights.server";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "AI Insights — KudiFlow" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const fn = useServerFn(generateInsights);
  const mutation = useMutation({
    mutationFn: () => fn(),
    onSuccess: () => {
      try {
        localStorage.setItem("kudiflow_insight_generated", "1");
      } catch {
        /* storage unavailable */
      }
    },
    onError: () => toast.error("We couldn't put your insights together just now. Please try again in a moment."),
  });


  const insights = mutation.data as Insights | undefined;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Your money coach
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A friendly read on your last 30 days — patterns you might not have noticed.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Reading your numbers...</> : "Show me"}
        </Button>
      </div>

      {!insights && !mutation.isPending && (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-display font-semibold text-lg">Ready when you are</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            We only look at your own spending — no guesswork, no generic advice. Tap “Show me” and we'll walk you through what stands out.
          </p>
        </Card>
      )}


      {insights && (
        <div className="space-y-4">
          <Card className={`p-6 ${insights.tone === "warning" ? "border-destructive/40 bg-destructive/5" : insights.tone === "positive" ? "border-success/40 bg-success/5" : ""}`}>
            <p className="text-base leading-relaxed">{insights.summary}</p>
          </Card>

          {insights.patterns.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" /> What we noticed
              </h3>
              <ul className="space-y-2">
                {insights.patterns.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {insights.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4 text-accent" /> What you could try next
              </h3>
              <ul className="space-y-3">
                {insights.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-6 w-6 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center shrink-0 text-xs font-semibold">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
