import React, { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccessTab, isGod } from "@/lib/permissions/permissions";
import { auth } from "@/lib/firebase";
import "@/components/ui/cyber-nav.css";
import {
  LayoutDashboard,
  Truck,
  Calendar,
  Users,
  MapPin,
  LogOut,
  Sun,
  Moon,
  HardHat,
  BarChart,
  BarChart3,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserAccountMenu } from "./UserAccountMenu";
import { AuthLoader } from "@/components/auth/AuthLoader";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { ConnectionBanner } from "./ConnectionBanner";
import { RadialMenu } from "./RadialMenu";
import logoAsset from "@/assets/logo-pitangueiras.png.asset.json";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, activeView, onNavigate }: LayoutProps) {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const menuItems: { id: string; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "reservas", label: "Agenda", icon: Calendar },
    { id: "pranchas", label: "Frota", icon: Truck },
    { id: "equipamentos", label: "Equipamentos", icon: Truck },
    { id: "frentes", label: "Frentes", icon: MapPin },
    { id: "relatorios", label: "Relatórios", icon: BarChart },
    { id: "analise-coa", label: "Análise COA", icon: BarChart3 },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "auditoria", label: "Auditoria", icon: ShieldCheck },
  ];

  const filteredMenu = menuItems.filter((item) => canAccessTab(profile, item.id));

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
      <ConnectionBanner />
      {loggingOut && <AuthLoader message="Saindo..." />}

      {/* Sidebar Desktop */}
      <aside
        className={cn("hidden lg:flex flex-col w-64 bg-card border-r transition-all duration-300")}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex flex-col items-center mb-8 group relative">
            <div className="w-56 h-56 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 z-10">
              <img
                src={logoAsset.url}
                alt="Logo Usina Pitangueiras"
                className="w-full h-full object-contain filter drop-shadow-2xl"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
            <div className="flex flex-col items-center -mt-10 z-20">
              <h1 className="font-black tracking-tighter select-none">
                <span className="text-black dark:text-white text-2xl sm:text-3xl">LOCA</span>
                <span className="text-[#40800c] text-2xl sm:text-3xl">PRANCHA</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 mt-1">
                Sistema Operacional
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredMenu.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 font-bold cyber-nav-btn",
                  activeView === item.id && "cyber-nav-btn-active shadow-lg",
                )}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "nav-icon",
                    activeView === item.id ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="pt-6 border-t space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive font-bold hover:bg-destructive/5"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await auth.signOut();
                } catch (e) {
                  console.error("Erro ao sair:", e);
                  setLoggingOut(false);
                }
              }}
            >
              <LogOut size={20} />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-card/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={logoAsset.url}
                alt="Logo Usina Pitangueiras"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-black tracking-tighter">
              <span className="text-black dark:text-white">LOCA</span>
              <span className="text-[#40800c]">PRANCHA</span>
            </span>
          </div>

          <div className="flex-1 hidden lg:block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Usina Pitangueiras • {menuItems.find((i) => i.id === activeView)?.label || "Operação"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/5"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={
                theme === "light" ? "Alternar para modo escuro" : "Alternar para modo claro"
              }
            >
              {theme === "light" ? (
                <Moon size={18} className="text-primary" />
              ) : (
                <Sun size={18} className="text-yellow-500" />
              )}
            </Button>

            <div className="h-8 w-[1px] bg-border mx-1" />

            <UserAccountMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6 custom-scrollbar w-full">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 w-full">{children}</div>
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 pb-safe z-[60] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex-1 flex justify-between items-center px-2">
            <MobileNavItem
              icon={LayoutDashboard}
              label="HOME"
              active={activeView === "dashboard"}
              onClick={() => onNavigate("dashboard")}
            />
            <MobileNavItem
              icon={Calendar}
              label="AGENDA"
              active={activeView === "reservas"}
              onClick={() => onNavigate("reservas")}
            />
            <MobileNavItem
              icon={Users}
              label="PERFIL"
              active={activeView === "perfil"}
              onClick={() => onNavigate("perfil")}
            />

            <div className="relative z-50 flex flex-col items-center justify-center w-16">
              <div className="flex items-center justify-center h-14 w-16">
                <RadialMenu
                  items={[
                    {
                      id: "pranchas",
                      label: "Frota",
                      icon: Truck,
                      active: activeView === "pranchas",
                      onClick: () => onNavigate("pranchas"),
                    },
                    {
                      id: "relatorios",
                      label: "Relatórios",
                      icon: BarChart,
                      active: activeView === "relatorios",
                      onClick: () => onNavigate("relatorios"),
                      hidden: !canAccessTab(profile, "relatorios"),
                    },
                    {
                      id: "auditoria",
                      label: "Auditoria",
                      icon: ShieldCheck,
                      active: activeView === "auditoria",
                      onClick: () => onNavigate("auditoria"),
                      hidden: !isGod(profile),
                    },
                    {
                      id: "usuarios",
                      label: "Usuários",
                      icon: Users,
                      active: activeView === "usuarios",
                      onClick: () => onNavigate("usuarios"),
                      hidden: !canAccessTab(profile, "usuarios"),
                    },
                    {
                      id: "frentes",
                      label: "Frentes",
                      icon: MapPin,
                      active: activeView === "frentes",
                      onClick: () => onNavigate("frentes"),
                      hidden: !canAccessTab(profile, "frentes"),
                    },
                    {
                      id: "equipamentos",
                      label: "Equips",
                      icon: HardHat,
                      active: activeView === "equipamentos",
                      onClick: () => onNavigate("equipamentos"),
                      hidden: !canAccessTab(profile, "equipamentos"),
                    },
                  ]
                    .filter((i) => !i.hidden)
                    .map(({ hidden, ...rest }) => rest)}
                />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter text-[#40800c] mt-0">
                MAIS
              </span>
            </div>
          </div>
        </nav>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}

function MobileNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 h-14 transition-all rounded-xl",
        active ? "bg-[#40800c]/10 text-[#40800c]" : "text-slate-400 dark:text-slate-500",
      )}
    >
      <Icon size={22} className={cn("transition-transform", active && "scale-110")} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
