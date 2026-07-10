import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { budgetsQuery, categoriesQuery, expensesQuery, profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, startOfMonth, toISODate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/budgets")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(budgetsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
    context.queryClient.ensureQueryData(expensesQuery());
    context.queryClient.ensureQueryData(profileQuery());
  },
  head: () => ({ meta: [{ title: "Budgets — KudiFlow" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: budgets } = useSuspenseQuery(budgetsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: expenses } = useSuspenseQuery(expensesQuery());
  const { data: profile } = useSuspenseQuery(profileQuery());
  const currency = profile?.currency ?? "NGN";
  const qc = useQueryClient();

  const monthStart = toISODate(startOfMonth());
  const spentByCat = new Map<string, number>();
  let totalMonth = 0;
  for (const e of expenses) {
    if (e.transaction_date < monthStart) continue;
    const catId = (e.category as { id: string } | null)?.id ?? "uncat";
    spentByCat.set(catId, (spentByCat.get(catId) ?? 0) + Number(e.amount));
    totalMonth += Number(e.amount);
  }

  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted");
    },
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Monthly spending limits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New budget</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create budget</DialogTitle></DialogHeader>
            <BudgetForm
              categories={categories}
              existingCategoryIds={budgets.map((b) => (b.category as { id: string } | null)?.id).filter(Boolean) as string[]}
              onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["budgets"] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets yet"
          description="Set a monthly budget for a category to track your progress and get warnings before you overspend."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = b.category as { id: string; name: string; color: string } | null;
            const spent = cat ? (spentByCat.get(cat.id) ?? 0) : totalMonth;
            const pct = Math.min(100, (spent / Number(b.amount)) * 100);
            const over = spent > Number(b.amount);
            const warning = pct >= 80 && !over;
            return (
              <Card key={b.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: cat?.color ?? "#64748b" }} />
                    <h3 className="font-semibold">{cat?.name ?? "Overall"}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(b.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-display font-bold">{formatCurrency(spent, currency)}</span>
                  <span className="text-sm text-muted-foreground">of {formatCurrency(Number(b.amount), currency)}</span>
                </div>
                <Progress value={pct} className={`h-2 ${over ? "[&>*]:bg-destructive" : ""}`} />
                {over && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Over budget by {formatCurrency(spent - Number(b.amount), currency)}</p>
                )}
                {warning && (
                  <p className="text-xs text-accent-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {Math.round(pct)}% used — approaching limit</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BudgetForm({
  categories,
  existingCategoryIds,
  onDone,
}: {
  categories: { id: string; name: string }[];
  existingCategoryIds: string[];
  onDone: () => void;
}) {
  const available = categories.filter((c) => !existingCategoryIds.includes(c.id));
  const [categoryId, setCategoryId] = useState(available[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!(amt > 0)) return toast.error("Enter a valid amount");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category_id: categoryId || null,
      amount: amt,
      period: "monthly",
      start_date: toISODate(startOfMonth()),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Budget created");
    onDone();
  };

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">You already have a budget for every category.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {available.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Monthly amount</Label>
        <Input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Create budget"}</Button>
    </form>
  );
}
