import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Wallet,
  Sparkles,
  PieChart,
  Target,
  Receipt,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "KudiFlow — AI-powered personal finance for modern spenders" },
      {
        name: "description",
        content:
          "Take control of your money. Track expenses, set smart budgets, and get AI-powered insights that turn your spending into a plan.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Receipt,
    title: "Effortless expense tracking",
    description:
      "Log spending in seconds, categorize on the fly, and search a beautifully organized history.",
  },
  {
    icon: Target,
    title: "Budgets that keep you honest",
    description:
      "Set monthly limits per category and watch live progress bars keep you on track.",
  },
  {
    icon: PieChart,
    title: "Analytics you'll actually read",
    description:
      "Interactive charts break down where your money goes — by category, by month, by trend.",
  },
  {
    icon: Sparkles,
    title: "AI-powered insights",
    description:
      "A personal finance coach highlights patterns, red flags, and quick wins in plain English.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "Row-level security on every record. Your data is yours — encrypted and isolated.",
  },
  {
    icon: Zap,
    title: "Fast, mobile-first PWA",
    description:
      "Installable on any device, works offline-ready, and feels native the moment you open it.",
  },
];

function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const primaryHref = signedIn ? "/dashboard" : "/auth";
  const primaryLabel = signedIn ? "Open dashboard" : "Get started free";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">KudiFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to={primaryHref}>
              <Button className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-90">
                {primaryLabel}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(1200px 500px at 20% -10%, color-mix(in oklab, var(--primary) 25%, transparent), transparent), radial-gradient(900px 400px at 90% 10%, color-mix(in oklab, var(--accent) 25%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 backdrop-blur px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered personal finance
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.05] tracking-tight">
              Understand where your{" "}
              <span className="text-gradient-brand">money goes</span> — and take
              it back.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              KudiFlow turns everyday spending into clear budgets, beautiful
              charts, and AI insights that actually help you save. Built for
              modern spenders who want clarity, not spreadsheets.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={primaryHref}>
                <Button
                  size="lg"
                  className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-90 h-12 px-6"
                >
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="h-12 px-6">
                  Sign in
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Private &
                encrypted
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Free to start
              </div>
            </div>
          </div>

          {/* Hero card */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem] bg-gradient-brand opacity-20 blur-2xl"
            />
            <Card className="relative p-6 shadow-[var(--shadow-card)] rounded-3xl border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    This month
                  </p>
                  <p className="text-3xl font-display font-bold mt-1">
                    ₦248,500
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm rounded-full bg-primary/10 text-primary px-3 py-1">
                  <TrendingUp className="h-3.5 w-3.5" /> 12% under budget
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { label: "Food & Dining", pct: 72, color: "var(--primary)" },
                  { label: "Transport", pct: 45, color: "var(--accent)" },
                  { label: "Entertainment", pct: 88, color: "var(--destructive)" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-muted-foreground">{row.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.pct}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold">AI insight</p>
                  <p className="text-muted-foreground">
                    You're spending 30% more on takeout on weekends. Try one
                    home-cooked Saturday to save ~₦18k this month.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Everything you need to master your money
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six focused tools that work together — no bloat, no learning
              curve, no spreadsheets.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="p-6 rounded-2xl hover:shadow-[var(--shadow-card)] transition-shadow"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-brand flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
            Three steps to financial clarity
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Log expenses",
              body: "Add spending in seconds. Categories are ready out of the box.",
            },
            {
              n: "02",
              title: "Set budgets",
              body: "Pick monthly limits per category and watch live progress.",
            },
            {
              n: "03",
              title: "Ask the AI",
              body: "Generate insights whenever you want a smart nudge or a plan.",
            },
          ].map((s) => (
            <div key={s.n} className="relative">
              <div className="text-5xl font-display font-bold text-gradient-brand opacity-80">
                {s.n}
              </div>
              <h3 className="mt-3 text-xl font-display font-semibold">
                {s.title}
              </h3>
              <p className="mt-1 text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Card className="relative overflow-hidden rounded-3xl border-0 p-10 lg:p-14 bg-gradient-brand text-primary-foreground">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Ready to see where your money really goes?
            </h2>
            <p className="mt-3 opacity-90">
              Join KudiFlow and turn spending chaos into a clear, confident
              plan. Free to get started.
            </p>
            <div className="mt-6">
              <Link to={primaryHref}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-6 text-foreground"
                >
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-display font-semibold text-foreground">
              KudiFlow
            </span>
          </div>
          <p>AI-powered personal finance</p>
        </div>
      </footer>
    </div>
  );
}
