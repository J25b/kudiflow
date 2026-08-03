import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsSkeleton } from "@/components/Skeletons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { expensesQuery, profileQuery } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { PieChart as PieChartIcon } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(expensesQuery());
    context.queryClient.ensureQueryData(profileQuery());
  },
  head: () => ({ meta: [{ title: "Analytics — KudiFlow" }] }),
  component: AnalyticsPage,
  pendingComponent: AnalyticsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});

function AnalyticsPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery());
  const { data: profile } = useSuspenseQuery(profileQuery());
  const currency = profile?.currency ?? "NGN";

  if (expenses.length === 0) {
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Where your money goes</h1>
        <EmptyState
          icon={PieChartIcon}
          title="Your charts are waiting"
          description="Log a handful of expenses and this page fills in with clear pictures of your spending by category, day and month."
          tips={[
            "About five entries is enough for the category breakdown to be useful.",
            "Keep logging for a few weeks to see day-of-week and monthly trends.",
          ]}
        />

      </div>
    );
  }


  // By category
  const catMap = new Map<string, { name: string; value: number; color: string }>();
  for (const e of expenses) {
    const cat = e.category as { name: string; color: string } | null;
    const name = cat?.name ?? "Uncategorized";
    const prev = catMap.get(name);
    catMap.set(name, {
      name,
      value: (prev?.value ?? 0) + Number(e.amount),
      color: cat?.color ?? "#64748b",
    });
  }
  const byCategory = [...catMap.values()].sort((a, b) => b.value - a.value);

  // Last 14 days
  const now = new Date();
  const dailyData: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const total = expenses.filter((e) => e.transaction_date === iso).reduce((s, e) => s + Number(e.amount), 0);
    dailyData.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), total });
  }

  // Last 6 months
  const monthlyData: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    const total = expenses.filter((e) => e.transaction_date >= start && e.transaction_date < end).reduce((s, e) => s + Number(e.amount), 0);
    monthlyData.push({ month: d.toLocaleDateString("en-US", { month: "short" }), total });
  }

  const fmt = (v: number) => formatCurrency(v, currency);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Where your money goes</h1>
        <p className="text-sm text-muted-foreground mt-1">A closer look at your habits over time.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">What you spend most on</h3>

          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {byCategory.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto font-medium">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Your last two weeks</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">How you're trending month to month</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
