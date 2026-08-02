import type { ReactNode } from "react";
import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, PieChart, Sparkles, Target, Settings, Wallet, LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground p-4">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">KudiFlow</span>
        </Link>

        <nav className="flex-1 space-y-1 mt-6">
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-gradient-brand truncate">KudiFlow</span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="Settings">
              <Link to="/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur">
          <div className="grid grid-cols-5 h-16">
            {nav.slice(0, 5).map((item) => {
              const active = location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
