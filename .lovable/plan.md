
# KudiFlow — Launch Polish Plan

Scope: UX/UI refinement only. No new features, no schema/RLS/auth-provider changes, no business logic edits. Existing routes, server functions, MCP tools, and Supabase integration stay intact.

---

## Part 1 — UX Audit (findings)

### High priority
1. **Auth pages** — technical validation errors surface raw Supabase messages; no email-exists precheck; no "resend verification" UI; no visible email-verification gate on sign-in; no "Remember me"; password strength meter missing.
2. **Empty states** — Dashboard/Expenses/Budgets/Insights show terse "No data" style copy. No education, no next-step guidance, no illustration.
3. **Dashboard** — Stat cards are numbers-only; no plain-language narrative ("Your biggest category is Food, 34%"). No first-run onboarding tour.
4. **Microcopy** — System-y labels everywhere ("Add expense", "Create budget", "Generate"). Buttons/headings need conversational rewrite.
5. **AI Insights empty state** — Doesn't explain why insights are missing when data is thin.
6. **Mobile bottom nav** — 5 tabs including Settings; Insights (a signature feature) is hidden. Sign-out only in mobile header (already fixed) but no user avatar/menu.
7. **Loading UX** — Route overlay exists, but list/card loads have no skeletons.

### Medium priority
8. Form density on Expenses/Budgets dialogs — labels/spacing feel dense on mobile; no inline hints.
9. Toasts use generic wording; no positive-behavior celebrations (streaks, budget wins).
10. PWA install prompt copy is functional but not warm.
11. Focus rings inconsistent on custom buttons/links; some icon-only buttons still miss `aria-label`.
12. Landing page CTA doesn't reflect signed-in state consistently.
13. Reset-password page copy is transactional, not reassuring.

### Low priority
14. Typography scale — headings could use a slightly warmer display treatment; body line-height tightening on cards.
15. No subtle motion on stat cards / list rows on mount.
16. Analytics charts lack a one-line "what this means" caption.
17. `Insights` page: no history of previous insights shown (already stored in `ai_insights`).

---

## Part 2 — Implementation phases

I'll ship in small, verifiable phases. Each phase is frontend-only.

### Phase A — Authentication experience (High-priority #1)
- Rewrite `src/routes/auth.tsx`:
  - Real-time zod validation (already partial) + password strength meter component.
  - Friendly error mapping: translate Supabase codes (`invalid_credentials`, `email_not_confirmed`, `user_already_registered`, `over_email_send_rate_limit`) → warm sentences.
  - After sign-up: show "Check your inbox" panel with **Resend verification** button (calls `supabase.auth.resend`).
  - On sign-in with `email_not_confirmed`: inline banner + resend button (no toast-only).
  - Trust strip: "Bank-grade encryption · Your data is yours · Never shared".
  - "Remember me" checkbox (Supabase persists by default; toggle controls `localStorage` vs `sessionStorage` via a thin wrapper — no client.ts edit; use `supabase.auth.setSession` persistence is not toggleable at runtime, so implement as UX-only checkbox that on uncheck signs out on `visibilitychange=hidden` after 30 min idle).
- Rewrite `src/routes/reset-password.tsx` copy + add strength meter + success confirmation screen.
- New component `src/components/auth/PasswordStrength.tsx`.
- New helper `src/lib/auth-errors.ts` — maps error codes to human copy.

### Phase B — Conversational microcopy pass
- Sidebar/nav labels stay short (Dashboard/Expenses/Budgets/Analytics/Insights/Settings) — those ARE the wayfinding. Change **headings, subtitles, button labels, empty states, toasts** only, so nav remains scannable.
- Files: `dashboard.tsx`, `expenses.tsx`, `budgets.tsx`, `analytics.tsx`, `insights.tsx`, `settings.tsx`, `EmptyState.tsx` usage sites.
- Replace toast strings via a small `src/lib/copy.ts` dictionary so tone is consistent.

### Phase C — Empty states + first-run onboarding
- Upgrade `EmptyState` to accept an illustration slot; add gentle SVG glyphs.
- Dashboard empty → "Let's start building your financial story…" with 2 CTAs (Add first expense / Set a budget).
- Insights empty (thin data) → "I'm still learning your spending habits. Add a few more transactions…" — detect via `expenses.length < 5`.
- New lightweight **first-run checklist card** on dashboard: (1) Add first expense (2) Set a monthly budget (3) Generate first insight. Dismissible, persisted in `localStorage`. No schema change.

### Phase D — Dashboard narrative + mobile nav
- Add `NarrativeSummary` component on dashboard: computes top category %, week vs last week delta, budget status → renders 1–2 sentence plain-language summary above the stat grid.
- Add celebration chip when user is under budget or has a tracking streak (computed from existing expenses).
- Mobile bottom nav: swap Settings out of the 5-slot for **Insights**; move Settings into a "More" affordance in the mobile header (avatar menu). Keeps parity with desktop sidebar's 6 items.

### Phase E — Loading skeletons + motion
- Skeleton components for stat cards, list rows, chart area.
- Subtle fade/slide-in on card mount using Tailwind's `animate-in` utilities (already available via tailwindcss-animate).

### Phase F — Accessibility + PWA copy
- Sweep icon-only buttons for `aria-label`.
- Ensure focus-visible rings on links/cards.
- Verify color contrast on brand gradient text.
- Warm up PWA install prompt copy + iOS hint.

### Phase G — Polish
- Analytics: one-line caption under each chart explaining what it shows.
- Insights page: list previous insights from `ai_insights` table (already queryable via existing client — read-only, no schema change).
- Reset-password + auth pages: subtle trust iconography.

---

## Verification
After each phase: `bunx tsgo --noEmit`, spot-check preview via Playwright screenshots on mobile (573×855) and desktop.

## Non-goals (explicit)
- No changes to: database schema, RLS, GRANTs, `src/integrations/supabase/*`, `.env`, MCP tools, server functions' logic, auth provider config, `supabase/config.toml`.
- No new routes except potentially `_authenticated/onboarding.tsx` if the checklist grows — kept optional.
- No new dependencies unless a phase strictly needs one (none anticipated).

---

**Estimated shipping order:** A → B → C → D → E → F → G, each in its own turn so you can review between phases.

Approve to start with **Phase A (Authentication experience)** — or tell me which phase to prioritize first.
