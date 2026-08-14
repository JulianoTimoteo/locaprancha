import React, { useState, lazy, Suspense, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { Layout } from "@/components/layout/Layout";
import { ConnectionBanner } from "@/components/layout/ConnectionBanner";
import { Toaster } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { canAccessTab } from "@/lib/permissions/permissions";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// Componentes estáticos para áreas críticas (evita white screen por falha de chunk)
import { Dashboard } from "@/features/dashboard/Dashboard";

// Lazy loading apenas para módulos secundários
const FrotaList = lazy(() =>
  import("@/features/frota/FrotaList").then((m) => ({ default: m.FrotaList })),
);
const ReservaList = lazy(() =>
  import("@/features/reservas/ReservaList").then((m) => ({ default: m.ReservaList })),
);
const FrenteList = lazy(() =>
  import("@/features/frentes/FrenteList").then((m) => ({ default: m.FrenteList })),
);
const UsuarioList = lazy(() =>
  import("@/features/usuarios/UsuarioList").then((m) => ({ default: m.UsuarioList })),
);
const EquipamentoList = lazy(() =>
  import("@/features/equipamentos/EquipamentoList").then((m) => ({ default: m.EquipamentoList })),
);
const RelatorioPage = lazy(() =>
  import("@/features/relatorios/RelatorioPage").then((m) => ({ default: m.RelatorioPage })),
);
// Módulo Análise COA removido por solicitação

import { useNotifications } from "@/hooks/useNotifications";

export default function App() {
  const { user, profile, loading, status } = useAuth();
  useNotifications(); // Ativar listener de alarmes globalmente para admins

  const [currentView, setCurrentView] = useState(() => {
    // 1. Prioridade: URL (necessário para deep linking no GitHub Pages)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam) return viewParam;

    // 2. Fallback: localStorage (persistência entre sessões)
    const saved = localStorage.getItem("locaprancha_view");
    if (saved) return saved;

    // 3. Default
    return "dashboard";
  });

  const handleNavigate = (view: string) => {
    if (view === currentView) return; // Evitar navegação duplicada/loops

    setCurrentView(view);
    localStorage.setItem("locaprancha_view", view);

    // Atualizar URL sem refresh (importante para GitHub Pages SPA)
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.pushState({ view }, "", url.toString());
  };

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) {
        handleNavigate(e.detail);
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setCurrentView(e.state.view);
      } else {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get("view");
        if (viewParam) setCurrentView(viewParam);
      }
    };

    window.addEventListener("navigate", handleNav);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("navigate", handleNav);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentView]); // Dependência adicionada

  useEffect(() => {
    if (user && profile && currentView === "dashboard") {
      // Garantir que estamos no dashboard ao logar se já não estivermos navegando
      const params = new URLSearchParams(window.location.search);
      if (!params.get("view")) {
        handleNavigate("dashboard");
      }
    }
  }, [user, !!profile, currentView]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <ConnectionBanner />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
        <div className="font-black tracking-tighter animate-pulse select-none mt-4">
          <span className="text-black dark:text-white text-3xl font-black">LOCA</span>
          <span className="text-[#40800c] text-3xl font-black">PRANCHA</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse mt-4">
          Sincronizando ambiente seguro (v1.7.3)...
        </p>
        <div className="mt-8 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="text-[9px] uppercase font-black"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Reset Forçado
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary area="Login">
        <ConnectionBanner />
        <LoginPage />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    );
  }

  if (status !== "PROFILE_OK") {
    const statusMessages = {
      LOADING: "Carregando seu perfil operacional...",
      AUTH_NOT_FOUND: "Usuário não autenticado.",
      PROFILE_NOT_FOUND:
        "Seu usuário foi autenticado, mas seu perfil operacional ainda não foi cadastrado no sistema.",
      PROFILE_BLOCKED:
        "Seu acesso está bloqueado. Procure um administrador para regularizar seu acesso.",
      PROFILE_INACTIVE: "Seu usuário está inativo no sistema.",
      PROFILE_OK: "",
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <ConnectionBanner />
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            status === "PROFILE_NOT_FOUND"
              ? "bg-amber-100 text-amber-600"
              : "bg-destructive/10 text-destructive",
          )}
        >
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase">
          {status === "PROFILE_NOT_FOUND" ? "Perfil não Encontrado" : "Acesso Interrompido"}
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {statusMessages[status as keyof typeof statusMessages]}
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            variant="outline"
            className="font-bold uppercase h-12"
            onClick={() => auth.signOut()}
          >
            Sair da Conta
          </Button>

          <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed text-left space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Diagnóstico de Identidade
            </p>
            <p className="text-[10px] font-mono break-all leading-tight">
              <span className="font-black">Firebase Auth UID:</span> {user.uid}
            </p>
            <p className="text-[10px] font-mono break-all leading-tight">
              <span className="font-black">Email:</span> {user.email}
            </p>
            <p className="text-[10px] font-mono">
              <span className="font-black">Documento Procurado:</span> usuarios/{user.uid}
            </p>
            <p className="text-[10px] font-mono">
              <span className="font-black">Documento Encontrado:</span> {profile ? "SIM" : "NÃO"}
            </p>
          </div>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <ErrorBoundary area="Global">
      <Layout activeView={currentView} onNavigate={handleNavigate}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            {currentView === "dashboard" && canAccessTab(profile, "dashboard") && (
              <ErrorBoundary area="Dashboard">
                <Dashboard />
              </ErrorBoundary>
            )}
            {currentView === "reservas" && canAccessTab(profile, "reservas") && (
              <ErrorBoundary area="Reservas">
                <ReservaList />
              </ErrorBoundary>
            )}
            {currentView === "pranchas" && canAccessTab(profile, "pranchas") && (
              <ErrorBoundary area="Frota">
                <FrotaList />
              </ErrorBoundary>
            )}
            {currentView === "frentes" && canAccessTab(profile, "frentes") && (
              <ErrorBoundary area="Frentes">
                <FrenteList />
              </ErrorBoundary>
            )}
            {currentView === "equipamentos" && canAccessTab(profile, "equipamentos") && (
              <ErrorBoundary area="Equipamentos">
                <EquipamentoList />
              </ErrorBoundary>
            )}
            {currentView === "relatorios" && canAccessTab(profile, "relatorios") && (
              <ErrorBoundary area="Relatorios">
                <RelatorioPage />
              </ErrorBoundary>
            )}
            {/* Módulo Análise COA removido por solicitação */}
            {currentView === "usuarios" && canAccessTab(profile, "usuarios") && (
              <ErrorBoundary area="Usuarios">
                <UsuarioList />
              </ErrorBoundary>
            )}
          </Suspense>

          {!canAccessTab(profile, currentView) && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground">
                  Você não tem permissão para acessar esta área.
                </p>
                <Button variant="link" className="mt-4" onClick={() => handleNavigate("dashboard")}>
                  Voltar ao Início
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}
