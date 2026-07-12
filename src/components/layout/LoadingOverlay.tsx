import { useRouterState } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingOverlay() {
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = status === "pending";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    // Only show if navigation takes more than 120ms — avoids flicker
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, [isLoading]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-200",
        show ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!show}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-brand blur-xl opacity-60 animate-pulse" />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow animate-[pulse_1.4s_ease-in-out_infinite]">
            <Wallet className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display font-bold text-lg text-gradient-brand">KudiFlow</span>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
