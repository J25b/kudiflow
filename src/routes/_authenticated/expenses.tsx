import { createFileRoute } from "@tanstack/react-router";
import { ListPageSkeleton } from "@/components/Skeletons";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { expensesQuery, categoriesQuery, profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, toISODate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/expenses")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(expensesQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
    context.queryClient.ensureQueryData(profileQuery());
  },
  head: () => ({ meta: [{ title: "Expenses — KudiFlow" }] }),
  component: ExpensesPage,
  pendingComponent: ListPageSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});

const PAYMENT_METHODS = ["cash", "card", "bank transfer", "mobile money", "other"];

function ExpensesPage() {
  const { data: expenses } = useSuspenseQuery(expensesQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: profile } = useSuspenseQuery(profileQuery());
  const currency = profile?.currency ?? "NGN";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gone. That expense is off your list.");
    },
    onError: () => toast.error("We couldn't remove that just now. Give it another try?"),

  });

  const filtered = expenses.filter((e) => {
    if (filterCat !== "all" && (e.category as { id: string } | null)?.id !== filterCat) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Your spending</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length === 0
              ? "Nothing to show here yet."
              : `${filtered.length} ${filtered.length === 1 ? "expense" : "expenses"} logged`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>What did you spend on?</DialogTitle></DialogHeader>

            <ExpenseForm categories={categories} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["expenses"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search what you spent on..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search expenses" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={expenses.length === 0 ? "Let's log your first expense" : "Nothing matched that"}
          description={
            expenses.length === 0
              ? "Every entry you add makes your dashboard, budgets and insights sharper. Start with something you bought today."
              : "Try a different word, or switch the category filter back to “All categories”."
          }
          tips={
            expenses.length === 0
              ? [
                  "Amount and a short note — “Lunch at work” is plenty.",
                  "Pick a category so your charts and budgets stay meaningful.",
                  "Backdating is fine: just change the date on older receipts.",
                ]
              : undefined
          }
        />


      ) : (
        <Card className="divide-y overflow-hidden">
          {filtered.map((e) => {
            const cat = e.category as { name: string; color: string } | null;
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}>
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.name ?? "Uncategorized"} · {e.payment_method} · {e.transaction_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{formatCurrency(Number(e.amount), currency)}</span>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(e.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

function ExpenseForm({
  categories,
  onDone,
}: {
  categories: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [date, setDate] = useState(toISODate(new Date()));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!(amt >= 0)) return toast.error("Pop in an amount — even a rough figure works.");
    if (!description.trim()) return toast.error("Add a short note so you'll recognise this later.");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Your session ended. Please sign in again."); }
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: amt,
      description: description.trim(),
      category_id: categoryId || null,
      payment_method: paymentMethod,
      transaction_date: date,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error("We couldn't save that expense. Please try once more.");
    toast.success("Saved — nice work staying on top of it.");

    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>How much?</Label>
          <Input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>When?</Label>
          <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>What was it for?</Label>
        <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Lunch at Buka" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>How did you pay?</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Anything to remember? (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Split with a friend, work trip, etc." />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving your expense..." : "Save expense"}</Button>

    </form>
  );
}
