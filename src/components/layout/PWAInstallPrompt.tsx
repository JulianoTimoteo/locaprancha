import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari no iPhone/iPad/iPod). O Safari iOS não dispara
    // 'beforeinstallprompt', então o banner exibe o passo a passo manual.
    const isIOSDevice =
      (/iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Detecta modo standalone (já instalado como app) — inclui iOS
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
      console.log("PWA install prompt visibility set to true");
    };

    const handleAppInstalled = () => {
      console.log("PWA installed");
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // If it's iOS and not standalone, show instructions.
    // Re-exibe a cada 3 dias (mesmo se o usuário fechar antes), até instalar.
    if (isIOSDevice) {
      const dismissedAt = localStorage.getItem("pwa_prompt_dismissed_at");
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      const shouldShow = !dismissedAt || Date.now() - Number(dismissedAt) > THREE_DAYS;
      if (shouldShow) {
        const t = setTimeout(() => setIsVisible(true), 1500);
        return () => {
          clearTimeout(t);
          window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
          window.removeEventListener("appinstalled", handleAppInstalled);
        };
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed_at", String(Date.now()));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-500 lg:bottom-8 lg:right-8 lg:left-auto lg:w-96">
      <div className="bg-card border-2 border-primary/20 shadow-2xl rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            <img
              src={`${import.meta.env.BASE_URL}logo-pitangueiras.png`}
              alt="Locaprancha"
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="font-black text-sm uppercase tracking-wider">Instalar Locaprancha</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Adicione à sua tela de início para acesso rápido e melhor performance.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-primary/10">
          {isIOS ? (
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-primary/5 p-3 rounded-xl border border-primary/15">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  <Share size={14} />
                </div>
                <p className="text-[11px] font-bold text-foreground leading-snug">
                  Toque no botão{" "}
                  <span className="text-primary underline decoration-2 underline-offset-2">
                    Compartilhar
                  </span>{" "}
                  na barra do Safari.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-primary/5 p-3 rounded-xl border border-primary/15">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  <Plus size={14} />
                </div>
                <p className="text-[11px] font-bold text-foreground leading-snug">
                  Role a lista e selecione{" "}
                  <span className="text-primary underline decoration-2 underline-offset-2">
                    "Adicionar à Tela de Início"
                  </span>
                  .
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold text-center pt-1">
                O app abrirá em tela cheia, sem a barra do navegador.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              className="w-full h-10 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all"
            >
              <Download size={14} className="mr-2" />
              Instalar Agora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
