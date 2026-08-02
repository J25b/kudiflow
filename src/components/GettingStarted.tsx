import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";

const DISMISS_KEY = "kudiflow_getting_started_dismissed";

type Step = {
  label: string;
  hint: string;
  done: boolean;
  to: "/expenses" | "/budgets" | "/analytics" | "/insights";
  cta: string;
};

export function GettingStarted({
  hasExpense,
  hasBudget,
  hasInsight,
}: {
  hasExpense: boolean;
  hasBudget: boolean;
  hasInsight: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const steps: Step[] = [
    {
      label: "Log your first expense",
      hint: "Anything you spent on today — it takes about ten seconds.",
      done: hasExpense,
      to: "/expenses",
      cta: "Add expense",
    },
    {
      label: "Set one monthly budget",
      hint: "Pick a category you overspend on and give it a comfortable limit.",
      done: hasBudget,
      to: "/budgets",
      cta: "Set a budget",
    },
    {
      label: "Ask for your first insight",
      hint: "We'll read your spending and suggest a couple of easy wins.",
      done: hasInsight,
      to: "/insights",
      cta: "Get insights",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (dismissed || doneCount === steps.length) return null;

  const next = steps.find((s) => !s.done)!;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card className="p-5 relative overflow-hidden">
      <button
        onClick={dismiss}
        aria-label="Hide getting started"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground rounded-lg p-1"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 pr-8">
        <span className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-primary-foreground shrink-0">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display font-semibold">Getting set up</h3>
          <p className="text-xs text-muted-foreground">
            {doneCount} of {steps.length} done — {next.hint}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span
              className={
                "h-5 w-5 shrink-0 rounded-full flex items-center justify-center " +
                (s.done ? "bg-primary text-primary-foreground" : "border border-dashed border-muted-foreground/40")
              }
            >
              {s.done && <Check className="h-3 w-3" />}
            </span>
            <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.label}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-4 w-full sm:w-auto">
        <Link to={next.to}>
          {next.cta} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}
