import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
];

export function scorePassword(v: string): number {
  return RULES.reduce((s, r) => s + (r.test(v) ? 1 : 0), 0);
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = scorePassword(value);
  const pct = (score / RULES.length) * 100;
  const tone =
    score <= 1
      ? "bg-destructive"
      : score === 2
        ? "bg-amber-500"
        : score === 3
          ? "bg-yellow-500"
          : "bg-emerald-500";
  const label =
    score <= 1 ? "Too weak" : score === 2 ? "Getting there" : score === 3 ? "Almost there" : "Strong";

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full transition-all duration-300", tone)} style={{ width: `${pct}%` }} />
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
        {RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li
              key={r.label}
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
