import { z } from "zod";

export const InsightsSchema = z.object({
  summary: z.string(),
  patterns: z.array(z.string()),
  recommendations: z.array(z.string()),
  tone: z.enum(["positive", "neutral", "warning"]),
});
export type Insights = z.infer<typeof InsightsSchema>;

export function buildInsightsPrompt(input: {
  currency: string;
  totalSpent: number;
  transactionCount: number;
  periodDays: number;
  byCategory: { name: string; total: number }[];
  budgets: { category: string | null; amount: number; spent: number }[];
  recent: { date: string; amount: number; description: string; category: string | null }[];
}) {
  return `You are a friendly, plainspoken personal-finance coach for a user of KudiFlow.
Analyze the following spending data from the last ${input.periodDays} days and return ONLY strict JSON matching this schema:
{ "summary": string, "patterns": string[], "recommendations": string[], "tone": "positive"|"neutral"|"warning" }

Rules:
- Never invent numbers. Use only what is given.
- Keep summary to 2-3 sentences.
- 2-4 concise pattern observations, 2-4 concrete recommendations.
- Use the user's currency (${input.currency}) when quoting amounts.
- If data is very sparse, say so briefly and encourage continued tracking rather than making up patterns.

DATA:
Total spent: ${input.totalSpent} ${input.currency}
Transactions: ${input.transactionCount}
By category: ${JSON.stringify(input.byCategory)}
Budgets: ${JSON.stringify(input.budgets)}
Recent transactions: ${JSON.stringify(input.recent.slice(0, 20))}`;
}
