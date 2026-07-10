# KudiFlow MVP — Implementation Plan

A production-ready AI-powered personal finance PWA. Stack: TanStack Start (React 19 + TS + Vite), Tailwind v4 + shadcn/ui, Lovable Cloud (Supabase) for auth/DB/edge, Lovable AI Gateway for insights (server-side only).

Note on a few prompt items adapted to this stack:
- "Supabase Edge Functions" for AI → we use TanStack `createServerFn` handlers as the secure BFF. They run server-side, hold secrets, and satisfy the same "no keys in browser" guarantee. Edge Functions aren't the default in TanStack Start.
- "OpenAI directly" → we route through Lovable AI Gateway (OpenAI-compatible) so no user-supplied key is needed and the key stays server-side. Model: `google/gemini-2.5-flash` (fast, cost-effective) by default.
- "Vite PWA plugin" → manifest + icons for installability by default. Full offline service worker only if you confirm — Lovable preview needs guarded registration.

## Phases

1. **Foundation** — Enable Lovable Cloud, design system (fintech palette, light/dark), app shell with bottom nav (mobile) + sidebar (desktop), routes scaffolding, PWA manifest + icons.
2. **Auth** — Email/password + Google via Lovable broker. `/auth` public route. `_authenticated` layout gate (managed). Profile row auto-created via trigger.
3. **Data layer** — Schema, RLS, seed categories. TanStack Query wiring.
4. **Expenses** — CRUD, search, filter, category picker, payment method, date.
5. **Budgets** — CRUD, per-category monthly budgets, progress bars, over-budget warnings.
6. **Dashboard** — Today/week/month totals, recent transactions, category breakdown, budget summary — all live from user data with empty states.
7. **Analytics** — Recharts: category pie, daily/weekly/monthly bars, trend line, budget utilization.
8. **AI Insights** — Server fn `generateInsights` pulls user's expenses via `requireSupabaseAuth`, calls Lovable AI, returns structured insights. Refuses to fabricate when data is sparse.
9. **Settings** — Profile, notification prefs, theme toggle, sign-out.
10. **Polish** — Empty states, loading skeletons, toasts, error boundaries, SEO metadata per route, sitemap/robots/llms.

## Database schema (public schema, RLS + GRANTs)

```
profiles(id uuid PK → auth.users, full_name, avatar_url, currency default 'NGN',
         notification_prefs jsonb, created_at, updated_at)
categories(id uuid PK, user_id uuid FK, name, icon, color, is_default bool, created_at)
  -- default categories seeded per-user via trigger on signup
expenses(id uuid PK, user_id uuid FK, amount numeric(12,2), category_id uuid FK,
         description text, payment_method text, notes text,
         transaction_date date, created_at, updated_at)
budgets(id uuid PK, user_id uuid FK, category_id uuid FK nullable,
        amount numeric(12,2), period text check in ('monthly'),
        start_date date, created_at, updated_at)
ai_insights(id uuid PK, user_id uuid FK, kind text, content jsonb,
            generated_at timestamptz, period_start date, period_end date)
```

RLS: every table `user_id = auth.uid()` for all ops. GRANTs to `authenticated` + `service_role`. Trigger `handle_new_user()` creates profile + seeds default categories (Food, Transport, Bills, Entertainment, Shopping, Health, Other).

## Server functions (BFF — secrets stay server-side)

- `src/lib/insights.functions.ts` — `generateInsights` with `requireSupabaseAuth`: fetches user's expenses/budgets via `context.supabase`, calls Lovable AI Gateway via `createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY)`, returns `{ summary, patterns[], recommendations[] }`. Refuses when < N transactions.
- `src/lib/insights.server.ts` — prompt builder, schema (zod), aggregation helpers.

All other CRUD uses the browser Supabase client + RLS directly (standard pattern; no keys exposed).

## Folder structure

```
src/
  routes/
    __root.tsx, index.tsx (redirect to dashboard or /auth)
    auth.tsx
    _authenticated/
      route.tsx (managed)
      dashboard.tsx
      expenses.tsx, expenses.new.tsx
      budgets.tsx
      analytics.tsx
      insights.tsx
      settings.tsx
    sitemap[.]xml.ts
  components/
    layout/ (AppShell, BottomNav, Sidebar, TopBar)
    dashboard/, expenses/, budgets/, analytics/, insights/
    ui/ (shadcn)
    empty-states/
  lib/
    insights.functions.ts, insights.server.ts
    ai-gateway.server.ts
    format.ts (currency, dates)
    queries.ts (queryOptions builders)
  hooks/ (use-expenses, use-budgets, use-profile, use-theme)
  integrations/supabase/ (managed)
public/
  manifest.webmanifest, icons/, robots.txt
```

## Design system

Fintech-modern, distinctive (not generic purple-on-white):
- Primary: deep teal/emerald (financial trust, non-cliché)
- Accent: warm amber for highlights/CTAs
- Neutral: slate with warm undertone
- oklch tokens in `src/styles.css`, full dark mode
- Typography: Space Grotesk (headings) + Inter (body) via `<link>` in root
- Rounded-2xl cards, soft shadows, subtle motion
- Custom Button variants (hero, ghost-accent), Card variants (stat, chart)

## PWA scope

Default: manifest + icons + theme-color for installability ("Add to Home Screen", app icon). **No service worker unless you confirm offline** — SW in Lovable preview needs guarded registration and adds complexity. Say the word and I'll add guarded `vite-plugin-pwa` with NetworkFirst navigations.

## Out of scope (per your list)
Bank/Open Banking, SMS parsing, OCR, receipts, subscriptions, investments, family, multi-currency — schema leaves room for these.

## What I'll ship first turn after approval
Phases 1–3 (foundation, auth, schema + RLS + seeds) so you can sign in and land on an empty dashboard. Then 4→9 in subsequent turns, each verified.

**One confirmation needed:** PWA scope — manifest-only (default) or full offline SW?
