import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { InsightsSchema, buildInsightsPrompt, type Insights } from "./insights.server";

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const periodDays = 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    const sinceISO = since.toISOString().slice(0, 10);

    const [expensesRes, budgetsRes, profileRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, description, transaction_date, category:categories(name)")
        .eq("user_id", userId)
        .gte("transaction_date", sinceISO)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("budgets")
        .select("amount, category:categories(name)")
        .eq("user_id", userId),
      supabase.from("profiles").select("currency").eq("id", userId).maybeSingle(),
    ]);

    if (expensesRes.error) throw expensesRes.error;
    const expenses = expensesRes.data ?? [];
    const budgets = budgetsRes.data ?? [];
    const currency = profileRes.data?.currency ?? "NGN";

    if (expenses.length < 3) {
      const fallback: Insights = {
        summary: "Not enough data yet to generate meaningful insights. Keep logging your expenses for a few more days and check back.",
        patterns: [],
        recommendations: [
          "Log every expense, even small ones — patterns emerge from consistency.",
          "Set at least one monthly budget for a category you care about.",
        ],
        tone: "neutral",
      };
      await supabase.from("ai_insights").insert({
        user_id: userId,
        kind: "sparse",
        content: fallback,
        period_start: sinceISO,
        period_end: new Date().toISOString().slice(0, 10),
      });
      return fallback;
    }

    const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCatMap = new Map<string, number>();
    for (const e of expenses) {
      const name = (e.category as { name: string } | null)?.name ?? "Uncategorized";
      byCatMap.set(name, (byCatMap.get(name) ?? 0) + Number(e.amount));
    }
    const byCategory = [...byCatMap.entries()]
      .map(([name, total]) => ({ name, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total);

    const budgetsAgg = budgets.map((b) => {
      const catName = (b.category as { name: string } | null)?.name ?? null;
      const spent = catName ? (byCatMap.get(catName) ?? 0) : totalSpent;
      return { category: catName, amount: Number(b.amount), spent: Math.round(spent) };
    });

    const recent = expenses.slice(0, 20).map((e) => ({
      date: e.transaction_date,
      amount: Number(e.amount),
      description: e.description,
      category: (e.category as { name: string } | null)?.name ?? null,
    }));

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = buildInsightsPrompt({
      currency,
      totalSpent: Math.round(totalSpent),
      transactionCount: expenses.length,
      periodDays,
      byCategory,
      budgets: budgetsAgg,
      recent,
    });

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        prompt,
      });

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const raw = jsonStart >= 0 ? text.slice(jsonStart, jsonEnd + 1) : text;
      const parsed = InsightsSchema.parse(JSON.parse(raw));

      await supabase.from("ai_insights").insert({
        user_id: userId,
        kind: "monthly",
        content: parsed,
        period_start: sinceISO,
        period_end: new Date().toISOString().slice(0, 10),
      });

      return parsed;
    } catch (err) {
      console.error("AI insight generation failed", err);
      const fallback: Insights = {
        summary: `You spent ${Math.round(totalSpent).toLocaleString()} ${currency} across ${expenses.length} transactions in the last ${periodDays} days.`,
        patterns: byCategory.slice(0, 3).map((c) => `${c.name} accounts for ${Math.round((c.total / totalSpent) * 100)}% of your spending.`),
        recommendations: [
          "Set a monthly budget for your top category to keep it in check.",
          "Review small, frequent transactions — they add up quickly.",
        ],
        tone: "neutral",
      };
      return fallback;
    }
  });
