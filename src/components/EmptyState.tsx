import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  tips,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tips?: string[];
  action?: ReactNode;
}) {
  return (
    <Card className="p-8 lg:p-12 text-center flex flex-col items-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {tips && tips.length > 0 && (
        <ul className="text-left space-y-2 max-w-sm w-full rounded-2xl bg-muted/50 p-4">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <Check className="h-3 w-3" />
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {action}
    </Card>
  );
}
