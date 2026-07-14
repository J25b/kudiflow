import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Wallet,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";

function safeNext(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long");
const signInPwSchema = z.string().min(1, "Password is required").max(72);
const signUpPwSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const next = safeNext(search.next);
      if (next) throw redirect({ href: next });
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — KudiFlow" },
      {
        name: "description",
        content: "Sign in to KudiFlow to track expenses and get AI-powered financial insights.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const next = safeNext(search.next);

  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goNext = () => {
    if (next) window.location.href = next;
    else navigate({ to: "/dashboard" });
  };

  const validate = (rules: Array<[string, z.ZodType, unknown]>) => {
    const next: Record<string, string> = {};
    for (const [key, schema, value] of rules) {
      const r = schema.safeParse(value);
      if (!r.success) next[key] = r.error.issues[0].message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate([["email", emailSchema, email], ["password", signInPwSchema, password]])) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return toast.error(error.message);
    goNext();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validate([
        ["fullName", nameSchema, fullName],
        ["email", emailSchema, email],
        ["password", signUpPwSchema, password],
      ])
    )
      return;
    setLoading(true);
    const emailRedirectTo = next ? `${window.location.origin}${next}` : window.location.origin;
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo, data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to KudiFlow!");
    goNext();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate([["email", emailSchema, email]])) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox for the reset link");
    setMode("signin");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setPassword("");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-gradient-brand text-primary-foreground overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-2xl font-display font-bold">KudiFlow</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-display font-bold leading-tight">
            Understand where your money goes.
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            Track expenses, set budgets, and let AI turn your spending into clear, actionable insights.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              { icon: TrendingUp, label: "Real-time analytics & budget tracking" },
              { icon: Sparkles, label: "AI insights tailored to your habits" },
              { icon: ShieldCheck, label: "Bank-grade privacy — your data stays yours" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm opacity-95">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm opacity-70">© {new Date().getFullYear()} KudiFlow</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 overflow-hidden">
        <div className="lg:hidden absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="lg:hidden absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

        <Card className="relative w-full max-w-md p-8 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold">KudiFlow</span>
            </Link>
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Back home
            </Link>
          </div>

          {mode === "forgot" ? (
            <div>
              <h2 className="text-2xl font-display font-bold">Reset your password</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                We'll email you a secure link to set a new password.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <FieldEmail email={email} setEmail={setEmail} error={errors.email} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "signin"
                    ? "Sign in to continue managing your money."
                    : "Start tracking expenses in under a minute."}
                </p>
              </div>

              <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <FieldEmail email={email} setEmail={setEmail} error={errors.email} />
                    <FieldPassword
                      id="password"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      show={showPw}
                      toggle={() => setShowPw((s) => !s)}
                      error={errors.password}
                      trailing={
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot?
                        </button>
                      }
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          required
                          className="pl-9"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ada Lovelace"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    <FieldEmail email={email} setEmail={setEmail} error={errors.email} />
                    <FieldPassword
                      id="password-up"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      show={showPw}
                      toggle={() => setShowPw((s) => !s)}
                      error={errors.password}
                      helper="8+ characters with upper, lower & a number."
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account…" : "Create account"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By continuing you agree to our terms and privacy policy.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function FieldEmail({
  email,
  setEmail,
  error,
}: {
  email: string;
  setEmail: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required
          className="pl-9"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldPassword({
  id,
  label,
  value,
  onChange,
  show,
  toggle,
  error,
  helper,
  trailing,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  error?: string;
  helper?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {trailing}
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          className="pl-9 pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
