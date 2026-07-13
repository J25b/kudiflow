import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "spending_summary",
  title: "Spending summary",
  description: "Summarize the signed-in user's spending over a date range, with totals per category.",
  inputSchema: {
    start_date: z.string().describe("ISO date (YYYY-MM-DD) start of range, inclusive."),
    end_date: z.string().describe("ISO date (YYYY-MM-DD) end of range, inclusive."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category_id, categories(name)")
      .gte("transaction_date", start_date)
      .lte("transaction_date", end_date);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []) as Array<{ amount: number; category_id: string | null; categories: { name: string } | null }>;
    const totals: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      const name = r.categories?.name ?? "Uncategorized";
      totals[name] = (totals[name] ?? 0) + Number(r.amount);
      total += Number(r.amount);
    }
    const summary = { start_date, end_date, total, by_category: totals, count: rows.length };
    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: summary };
  },
});
