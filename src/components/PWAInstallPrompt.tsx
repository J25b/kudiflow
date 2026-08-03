import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { Wallet } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "kudiflow-pwa-dismissed-at";
const DISMISS_DAYS = 7;

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || wasRecentlyDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS has no beforeinstallprompt — show a manual hint after a short delay
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    let timer: number | undefined;
    if (isIOS && isSafari) {
      timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 3000);
    }

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome !== "dismissed") {
      setVisible(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:px-0 pointer-events-none">
      <div
        role="dialog"
        aria-label="Keep KudiFlow on your home screen"
        className="pointer-events-auto mx-auto sm:mx-0 max-w-md rounded-2xl border bg-card/95 backdrop-blur shadow-[var(--shadow-card)] p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-brand flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Keep KudiFlow one tap away</p>
          {iosHint && !deferred ? (
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
              Tap <Share className="h-3.5 w-3.5 inline" aria-hidden="true" /> Share, then
              <span className="font-medium">Add to Home Screen</span> — it takes a second and KudiFlow opens like a real app.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pop it on your home screen so logging an expense takes seconds — no browser, no waiting.
            </p>
          )}
          {deferred && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={install} className="bg-gradient-brand text-primary-foreground border-0">
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add to home screen
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Maybe later
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Close install tip"
          className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
