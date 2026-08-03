import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SettingsSkeleton } from "@/components/Skeletons";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery()),
  head: () => ({ meta: [{ title: "Settings — KudiFlow" }] }),
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
});

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "KES", "GHS", "ZAR"];

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery());
  const qc = useQueryClient();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "NGN");
  const prefs = (profile?.notification_prefs ?? {}) as { budget_alerts?: boolean; weekly_summary?: boolean };
  const [budgetAlerts, setBudgetAlerts] = useState(prefs.budget_alerts ?? true);
  const [weeklySummary, setWeeklySummary] = useState(prefs.weekly_summary ?? true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCurrency(profile.currency ?? "NGN");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase.from("profiles").update({
        full_name: fullName.trim() || null,
        currency,
        notification_prefs: { budget_alerts: budgetAlerts, weekly_summary: weeklySummary },
      }).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("All set — your changes are saved.");
    },
    onError: () => toast.error("We couldn't save that just now. Please try again."),

  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Your preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">Make KudiFlow feel like yours.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">About you</h3>
        <div className="space-y-2">
          <Label htmlFor="full-name">What should we call you?</Label>
          <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label>Which currency do you spend in?</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger aria-label="Currency"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">We'll show every amount in this currency.</p>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Staying in the loop</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Nudge me about budgets</p>
            <p className="text-xs text-muted-foreground">A heads-up when you're getting close to a limit.</p>
          </div>
          <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} aria-label="Nudge me about budgets" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Send me a weekly recap</p>
            <p className="text-xs text-muted-foreground">A short summary of your week, once a week.</p>
          </div>
          <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} aria-label="Send me a weekly recap" />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Look and feel</h3>
        <Button variant="outline" onClick={toggle} className="w-full sm:w-auto">
          {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          Switch to {theme === "dark" ? "light" : "dark"} mode
        </Button>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg">
          {save.isPending ? "Saving..." : "Save my preferences"}
        </Button>

        <Button variant="ghost" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
