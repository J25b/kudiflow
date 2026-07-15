import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  MailCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toFriendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/auth/PasswordStrength";

function safeNext(next: unknown): string | null {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);
const nameSchema = z
  .string()
  .trim()
  .min(2, "Please tell us your name (at least 2 characters)")
  .max(80, "That name is a little too long");
const signInPwSchema = z.string().min(1, "Please enter your password").max(72);
const signUpPwSchema = z
  .string()
  .min(8, "Your password needs at least 8 characters")
  .max(72, "That password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
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
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ message: string; hint?: string } | null>(null);
  const [needsVerify, setNeedsVerify] = useState<string | null>(null); // email awaiting verification
  const [resent, setResent] = useState(false);
  const [checkInbox, setCheckInbox] = useState<string | null>(null); // email after successful sign-up

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
    setFormError(null);
    setNeedsVerify(null);
    if (!validate([["email", emailSchema, email], ["password", signInPwSchema, password]])) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const friendly = toFriendlyAuthError(error);
      if (friendly.kind === "email_not_confirmed") {
        setNeedsVerify(email.trim());
        return;
      }
      setFormError({ message: friendly.message, hint: friendly.hint });
      return;
    }
    // "Remember me" unchecked → session lives only for this tab session
    if (!remember) {
      try {
        sessionStorage.setItem("kf.session-only", "1");
      } catch {
        /* ignore */
      }
    }
    goNext();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo, data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) {
      const friendly = toFriendlyAuthError(error);
      setFormError({ message: friendly.message, hint: friendly.hint });
      return;
    }
    // If email confirmation is required, Supabase returns a user with no session.
    if (data.session) {
      toast.success("Welcome to KudiFlow!");
      goNext();
      return;
    }
    setCheckInbox(email.trim());
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate([["email", emailSchema, email]])) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const friendly = toFriendlyAuthError(error);
      setFormError({ message: friendly.message, hint: friendly.hint });
      return;
    }
    toast.success("If that email is registered, a reset link is on its way.");
    setMode("signin");
  };

  const resendVerification = async (targetEmail: string) => {
    setResent(false);
    const { error } = await supabase.auth.resend({ type: "signup", email: targetEmail });
    if (error) {
      const friendly = toFriendlyAuthError(error);
      toast.error(friendly.message);
      return;
    }
    setResent(true);
    toast.success("Verification email sent — please check your inbox.");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setPassword("");
    setFormError(null);
    setNeedsVerify(null);
  };

  const strengthOk = mode !== "signup" || scorePassword(password) >= 4;

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
            Your money, finally making sense.
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            KudiFlow tracks your spending, keeps your budgets on track, and turns the numbers into
            friendly advice you can actually use.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              { icon: TrendingUp, label: "See where every naira goes, in real time" },
              { icon: Sparkles, label: "Get AI insights tailored to your habits" },
              { icon: ShieldCheck, label: "Bank-grade encryption — your data stays yours" },
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

        <Card className="relative w-full max-w-md p-6 sm:p-8 shadow-[var(--shadow-card)] backdrop-blur">
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

          {checkInbox ? (
            <CheckInboxPanel
              email={checkInbox}
              onResend={() => resendVerification(checkInbox)}
              resent={resent}
              onBack={() => {
                setCheckInbox(null);
                switchMode("signin");
              }}
            />
          ) : mode === "forgot" ? (
            <div>
              <h2 className="text-2xl font-display font-bold">Let's get you back in</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Enter your email and we'll send you a secure link to choose a new password.
              </p>
              <form onSubmit={handleForgot} className="space-y-4" noValidate>
                <FieldEmail email={email} setEmail={setEmail} error={errors.email} />
                {formError && <InlineError {...formError} />}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
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
                  {mode === "signin" ? "Welcome back" : "Let's get you set up"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "signin"
                    ? "Sign in to pick up where you left off."
                    : "A minute now, a clearer money picture for good."}
                </p>
              </div>

              <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4" noValidate>
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
                          className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          Forgot password?
                        </button>
                      }
                    />

                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={remember}
                        onCheckedChange={(v) => setRemember(v === true)}
                        aria-label="Keep me signed in"
                      />
                      Keep me signed in on this device
                    </label>

                    {needsVerify && (
                      <VerifyBanner
                        email={needsVerify}
                        resent={resent}
                        onResend={() => resendVerification(needsVerify)}
                      />
                    )}
                    {formError && <InlineError {...formError} />}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing you in…
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>

                    <TrustStrip />
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="name">What should we call you?</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          required
                          className="pl-9"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ada Lovelace"
                          autoComplete="name"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    <FieldEmail email={email} setEmail={setEmail} error={errors.email} />
                    <FieldPassword
                      id="password-up"
                      label="Create a password"
                      value={password}
                      onChange={setPassword}
                      show={showPw}
                      toggle={() => setShowPw((s) => !s)}
                      error={errors.password}
                    />
                    <PasswordStrength value={password} />

                    {formError && <InlineError {...formError} />}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || (password.length > 0 && !strengthOk)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating your
                          account…
                        </>
                      ) : (
                        "Create my account"
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      Your details are encrypted and never shared. By continuing you agree to our
                      terms and privacy policy.
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
      <Label htmlFor="email">Email address</Label>
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
          inputMode="email"
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
          autoComplete={id.includes("up") ? "new-password" : "current-password"}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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

function InlineError({ message, hint }: { message: string; hint?: string }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
      <div>
        <p className="font-medium text-destructive">{message}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}

function VerifyBanner({
  email,
  resent,
  onResend,
}: {
  email: string;
  resent: boolean;
  onResend: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-2">
      <div className="flex gap-3">
        <MailCheck className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-medium">Just one more step — please verify your email.</p>
          <p className="text-xs text-muted-foreground">
            We sent a verification link to <span className="font-medium">{email}</span>. Click it
            and you're in.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onResend}
        className="w-full"
        disabled={resent}
      >
        {resent ? "Verification email sent" : "Resend verification email"}
      </Button>
    </div>
  );
}

function CheckInboxPanel({
  email,
  onResend,
  resent,
  onBack,
}: {
  email: string;
  onResend: () => void;
  resent: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-glow">
        <MailCheck className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to <span className="font-medium">{email}</span>. Click it
          to activate your account and we'll take it from there.
        </p>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground text-left">
        <p className="font-medium text-foreground mb-1">Can't find the email?</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Peek inside your Spam or Promotions folder.</li>
          <li>Make sure you typed your email correctly.</li>
          <li>Give it a minute — it can take a moment to arrive.</li>
        </ul>
      </div>
      <div className="space-y-2">
        <Button type="button" variant="outline" className="w-full" onClick={onResend} disabled={resent}>
          {resent ? "Verification email sent" : "Resend verification email"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </button>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
      <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      <span>Encrypted end-to-end · Your data is yours · Never shared</span>
    </div>
  );
}
