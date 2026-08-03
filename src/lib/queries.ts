import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const expensesQuery = (limit?: number) =>
  queryOptions({
    queryKey: ["expenses", { limit }],
    queryFn: async () => {
      let q = supabase
        .from("expenses")
        .select("*, category:categories(id,name,color,icon)")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const budgetsQuery = () =>
  queryOptions({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, category:categories(id,name,color,icon)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const insightHistoryQuery = () =>
  queryOptions({
    queryKey: ["ai_insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select("id, content, generated_at, kind")
        .order("generated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
