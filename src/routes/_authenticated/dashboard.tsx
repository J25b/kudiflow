import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { expensesQuery, budgetsQuery, profileQuery } from "@/lib/queries";
import { formatCurrency, startOfMonth, startOfWeek, toISODate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, Plus, Receipt, TrendingUp, Wallet, Target } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(expensesQuery(50));
    context.queryClient.ensureQueryData(budgetsQuery());
    context.queryClient.ensureQueryData(profileQuery());
  },
  head: () => ({ meta: [{ title: "Dashboard — KudiFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: expenses } = useSuspenseQuery(expensesQuery(50));
  const { data: budgets } = useSuspenseQuery(budgetsQuery());
  const { data: profile } = useSuspenseQuery(profileQuery());
  const currency = profile?.currency ?? "NGN";

  const today = toISODate(new Date());
  const weekStart = toISODate(startOfWeek());
  const monthStart = toISODate(startOfMonth());

  const totalToday = expenses.filter((e) => e.transaction_date === today).reduce((s, e) => s + Number(e.amount), 0);
  const totalWeek = expenses.filter((e) => e.transaction_date >= weekStart).reduce((s, e) => s + Number(e.amount), 0);
  const totalMonth = expenses.filter((e) => e.transaction_date >= monthStart).reduce((s, e) => s + Number(e.amount), 0);

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalMonth / totalBudget) * 100) : 0;

  // Category breakdown (this month)
  const catMap = new Map<string, { total: number; color: string; name: string }>();
  for (const e of expenses) {
    if (e.transaction_date < monthStart) continue;
    const cat = e.category as { id: string; name: string; color: string } | null;
    const key = cat?.id ?? "uncat";
    const prev = catMap.get(key);
    catMap.set(key, {
      total: (prev?.total ?? 0) + Number(e.amount),
      color: cat?.color ?? "#64748b",
      name: cat?.name ?? "Uncategorized",
    });
  }
  const topCategories = [...catMap.values()].sort((a, b) => b.total - a.total).slice(0, 4);

  const empty = expenses.length === 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">
            {greeting()}, {profile?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's how your money is doing today.</p>
        </div>
        <Button asChild>
          <Link to="/expenses"><Plus className="h-4 w-4 mr-1" /> Add expense</Link>
        </Button>
      </div>

      {empty ? (
        <EmptyState
          icon={Wallet}
          title="Welcome to KudiFlow"
          description="Add one expense and this page comes alive — daily totals, budget progress, and where your money actually goes."
          action={
            <Button asChild size="lg"><Link to="/expenses"><Plus className="h-4 w-4 mr-1" /> Log my first expense</Link></Button>
          }
        />

      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard label="Spent today" value={formatCurrency(totalToday, currency)} icon={Receipt} />
            <StatCard label="So far this week" value={formatCurrency(totalWeek, currency)} icon={TrendingUp} />
            <StatCard label="So far this month" value={formatCurrency(totalMonth, currency)} icon={Wallet} highlight />
            <StatCard label="Budgeted this month" value={formatCurrency(totalBudget, currency)} icon={Target} />
          </div>

          {totalBudget > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">How your month is tracking</h3>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(totalMonth, currency)} of {formatCurrency(totalBudget, currency)}
                </span>
              </div>
              <Progress value={budgetPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {budgetPct >= 100
                  ? "You've gone past your total budget this month — worth a quick look at your categories."
                  : `You still have ${formatCurrency(totalBudget - totalMonth, currency)} to spend before you reach your limit.`}
              </p>
            </Card>
          )}


          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Where it went this month</h3>
                <Link to="/analytics" className="text-xs text-primary flex items-center gap-1">See more <ArrowUpRight className="h-3 w-3" /></Link>
              </div>
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing logged this month yet.</p>
              ) : (

                <div className="space-y-3">
                  {topCategories.map((c) => {
                    const pct = totalMonth > 0 ? (c.total / totalMonth) * 100 : 0;
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                            {c.name}
                          </span>
                          <span className="font-medium">{formatCurrency(c.total, currency)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your latest entries</h3>
                <Link to="/expenses" className="text-xs text-primary flex items-center gap-1">See all <ArrowUpRight className="h-3 w-3" /></Link>
              </div>

              <div className="space-y-3">
                {expenses.slice(0, 6).map((e) => {
                  const cat = e.category as { name: string; color: string } | null;
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                             style={{ background: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}>
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.description}</p>
                          <p className="text-xs text-muted-foreground">{cat?.name ?? "Uncategorized"} · {e.transaction_date}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm shrink-0">{formatCurrency(Number(e.amount), currency)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: React.ElementType; highlight?: boolean }) {
  return (
    <Card className={`p-4 ${highlight ? "bg-gradient-brand text-primary-foreground border-transparent" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "opacity-90" : "text-muted-foreground"}`} />
      </div>
      <p className="text-xl lg:text-2xl font-display font-bold">{value}</p>
    </Card>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
