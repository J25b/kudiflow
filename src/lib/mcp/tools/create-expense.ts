import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_expense",
  title: "Create expense",
  description: "Record a new expense for the signed-in user.",
  inputSchema: {
    description: z.string().trim().min(1).describe("What the expense is for."),
    amount: z.number().positive().describe("Amount in the user's currency."),
    transaction_date: z.string().optional().describe("ISO date (YYYY-MM-DD). Defaults to today."),
    payment_method: z.string().optional().describe("e.g. cash, card, transfer."),
    category_id: z.string().uuid().optional().describe("Optional category UUID (use list_categories)."),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: ctx.getUserId()!,
        description: input.description,
        amount: input.amount,
        transaction_date: input.transaction_date ?? new Date().toISOString().slice(0, 10),
        payment_method: input.payment_method ?? "cash",
        category_id: input.category_id ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { expense: data } };
  },
});
