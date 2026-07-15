import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Wallet, Lock, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toFriendlyAuthError } from "@/lib/auth-errors";
import { PasswordStrength, scorePassword } from "@/components/auth/PasswordStrength";

const passwordSchema = z
  .string()
  .min(8, "Your password needs at least 8 characters")
  .max(72, "That password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — KudiFlow" },
      { name: "description", content: "Choose a new password for your KudiFlow account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError({ message: parsed.error.issues[0].message });
    if (password !== confirm) return setError({ message: "Those passwords don't match — try again." });
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      const friendly = toFriendlyAuthError(err);
      setError({ message: friendly.message, hint: friendly.hint });
      return;
    }
    setDone(true);
    toast.success("Password updated — you're all set.");
    setTimeout(() => navigate({ to: "/dashboard" }), 1600);
  };

  const strengthOk = scorePassword(password) >= 4;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-brand opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <Card className="relative w-full max-w-md p-6 sm:p-8 shadow-[var(--shadow-card)] backdrop-blur">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">KudiFlow</span>
        </Link>

        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-display font-bold">You're back in.</h1>
              <p className="text-sm text-muted-foreground">
                Password updated. Taking you to your dashboard…
              </p>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold">Choose a new password</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Pick something strong and memorable — we'll keep it safe.
            </p>

            {!ready ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="pw">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={showPw ? "text" : "password"}
                      required
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <PasswordStrength value={password} />

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">{error.message}</p>
                      {error.hint && (
                        <p className="text-xs text-muted-foreground mt-1">{error.hint}</p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (password.length > 0 && !strengthOk)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…
                    </>
                  ) : (
                    "Save new password"
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Encrypted end-to-end · Never shared</span>
                </div>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
