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
    onError: (e: Error) => toast.error(e.message || "Could not generate insights"),
  });

  const insights = mutation.data as Insights | undefined;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask our AI coach to review your last 30 days of spending.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Thinking...</> : "Generate"}
        </Button>
      </div>

      {!insights && !mutation.isPending && (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground mx-auto mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-display font-semibold text-lg">Get personalized financial insights</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Our AI analyzes only your own spending data — no fabricated advice. Click Generate to start.
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
                <TrendingUp className="h-4 w-4 text-primary" /> Patterns we noticed
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
                <Lightbulb className="h-4 w-4 text-accent" /> Recommendations
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
