import { Card } from "@/components/ui/card";
import { formatCurrency, startOfMonth, startOfWeek, toISODate } from "@/lib/format";
import { Flame, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

type Expense = { amount: number | string; transaction_date: string; category?: unknown };
type Budget = { amount: number | string };

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function NarrativeSummary({
  expenses,
  budgets,
  currency,
}: {
  expenses: Expense[];
  budgets: Budget[];
  currency: string;
}) {
  const monthStart = toISODate(startOfMonth());
  const weekStart = toISODate(startOfWeek());
  const lastWeekStart = daysAgoISO(13);

  const thisMonth = expenses.filter((e) => e.transaction_date >= monthStart);
  const thisWeek = expenses
    .filter((e) => e.transaction_date >= weekStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const lastWeek = expenses
    .filter((e) => e.transaction_date >= lastWeekStart && e.transaction_date < weekStart)
    .reduce((s, e) => s + Number(e.amount), 0);

  const monthTotal = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);

  // Top category this month
  const catTotals = new Map<string, number>();
  for (const e of thisMonth) {
    const cat = e.category as { name?: string } | null;
    const name = cat?.name ?? "Uncategorized";
    catTotals.set(name, (catTotals.get(name) ?? 0) + Number(e.amount));
  }
  const top = [...catTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPct = top && monthTotal > 0 ? Math.round((top[1] / monthTotal) * 100) : 0;

  // Tracking streak: consecutive days (back from today) with at least one entry
  const dayset = new Set(expenses.map((e) => e.transaction_date));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    if (dayset.has(daysAgoISO(i))) streak++;
    else if (i > 0) break;
  }

  const sentences: string[] = [];
  if (top) {
    sentences.push(
      `${top[0]} is your biggest spend this month — ${formatCurrency(top[1], currency)}, about ${topPct}% of everything you've logged.`,
    );
  }
  if (lastWeek > 0) {
    const delta = ((thisWeek - lastWeek) / lastWeek) * 100;
    const dir = delta >= 0 ? "more" : "less";
    sentences.push(
      `You've spent ${Math.abs(Math.round(delta))}% ${dir} this week than the week before.`,
    );
  } else if (thisWeek > 0) {
    sentences.push(`So far this week you've spent ${formatCurrency(thisWeek, currency)}.`);
  }
  if (totalBudget > 0) {
    const left = totalBudget - monthTotal;
    sentences.push(
      left >= 0
        ? `You're still inside your budget with ${formatCurrency(left, currency)} to go.`
        : `You're ${formatCurrency(Math.abs(left), currency)} over your total budget — worth a quick look.`,
    );
  }

  if (sentences.length === 0) return null;

  const weekDown = lastWeek > 0 && thisWeek < lastWeek;
  const underBudget = totalBudget > 0 && monthTotal <= totalBudget;

  return (
    <Card className="p-5 border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-brand flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="font-semibold">Your month in a sentence</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{sentences.join(" ")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {underBudget && (
              <Chip icon={TrendingDown} tone="good">
                Inside budget
              </Chip>
            )}
            {weekDown && (
              <Chip icon={TrendingDown} tone="good">
                Spending less than last week
              </Chip>
            )}
            {!weekDown && lastWeek > 0 && (
              <Chip icon={TrendingUp} tone="warn">
                Up on last week
              </Chip>
            )}
            {streak >= 3 && (
              <Chip icon={Flame} tone="good">
                {streak}-day tracking streak
              </Chip>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Chip({
  icon: Icon,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "good" | "warn";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        tone === "good"
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
          : "inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-medium"
      }
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}
