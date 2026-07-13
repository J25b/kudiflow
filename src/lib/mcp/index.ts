import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listExpenses from "./tools/list-expenses";
import createExpense from "./tools/create-expense";
import listCategories from "./tools/list-categories";
import listBudgets from "./tools/list-budgets";
import spendingSummary from "./tools/spending-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kudiflow-mcp",
  title: "KudiFlow",
  version: "0.1.0",
  instructions:
    "Tools to read and record the signed-in user's KudiFlow expenses, categories, and budgets. Use list_expenses / spending_summary for insights, and create_expense to log new spending.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listExpenses, createExpense, listCategories, listBudgets, spendingSummary],
});
