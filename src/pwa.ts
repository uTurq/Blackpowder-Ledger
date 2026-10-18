import { useCallback, useEffect, useRef, useState } from "react";

type InstallChoice = { outcome: "accepted" | "dismissed" };
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

export type PwaInstallStatus = "available" | "installed" | "browser-menu";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function usePwaInstall() {
  const promptRef = useRef<InstallPrompt | null>(null);
  const [status, setStatus] = useState<PwaInstallStatus>(() =>
    isStandalone() ? "installed" : "browser-menu",
  );

  useEffect(() => {
    const register = () => {
      // Only production builds ship a worker; in dev it would serve stale files.
      if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {
          // Installation remains available from the browser after a retry.
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as InstallPrompt;
      setStatus("available");
    };
    const markInstalled = () => {
      promptRef.current = null;
      setStatus("installed");
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = promptRef.current;
    if (!prompt) return "unavailable" as const;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      promptRef.current = null;
      setStatus("installed");
    }
    return choice.outcome;
  }, []);

  return { status, install };
}
