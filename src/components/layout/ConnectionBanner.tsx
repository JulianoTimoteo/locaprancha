import React from "react";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useAuth } from "@/features/auth/AuthContext";
import { WifiOff, RefreshCw, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectionBanner() {
  const status = useConnectionStatus();
  const { profile } = useAuth();

  const [isVisible, setIsVisible] = React.useState(false);
  const [hasShownWelcome, setHasShownWelcome] = React.useState(false);

  React.useEffect(() => {
    // Se o status for online e já mostramos o welcome uma vez, não mostramos de novo
    if (status === "online" && hasShownWelcome) {
      setIsVisible(false);
      return;
    }

    // Marca que já mostramos o welcome na primeira vez que fica online
    if (status === "online" && !hasShownWelcome) {
      setHasShownWelcome(true);
    }

    setIsVisible(true);

    // Esconde após 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, hasShownWelcome]);

  if (!isVisible) return null;

  const firstName = profile?.name?.split(" ")[0] || "";
  const isGodOrAdmin = profile && ["GOD", "ADMINISTRADOR"].includes(profile.role);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-3 px-4 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-top-4",
        status !== "online" && "ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
            status === "online"
              ? "bg-emerald-500 shadow-emerald-500/50"
              : status === "syncing"
                ? "bg-amber-500 shadow-amber-500/50 animate-pulse"
                : status === "offline"
                  ? "bg-destructive shadow-destructive-500/50 animate-pulse"
                  : "bg-blue-500 shadow-blue-500/50 animate-pulse",
          )}
        />
        <span className="text-[11px] font-black uppercase tracking-widest text-foreground flex items-center gap-1">
          {status === "online" && <>Bem-vindo ao Locaprancha{firstName ? `! ${firstName}` : "!"}</>}
          {status === "syncing" && "Sincronizando Dados..."}
          {status === "offline" && "Sistema Offline (Usando Cache Local)"}
          {status === "connecting" && "Conectando ao Servidor..."}
        </span>
      </div>

      <div className="flex items-center gap-2 border-l border-primary/10 pl-3">
        {status === "online" && <Signal size={14} className="text-emerald-500" />}
        {status === "syncing" && <RefreshCw size={14} className="animate-spin text-amber-500" />}
        {status === "offline" && <WifiOff size={14} className="text-destructive" />}
        {status === "connecting" && <RefreshCw size={14} className="animate-spin text-blue-500" />}
      </div>
    </div>
  );
}
