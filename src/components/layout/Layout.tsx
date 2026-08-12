import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessTab, isGod } from '@/lib/permissions/permissions';
import { auth } from '@/lib/firebase';
import '@/components/ui/cyber-nav.css';
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
  ShieldCheck,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserAccountMenu } from './UserAccountMenu';
import { AuthLoader } from '@/components/auth/AuthLoader';


interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, activeView, onNavigate }: LayoutProps) {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const menuItems: { id: string, label: string, icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reservas', label: 'Agenda', icon: Calendar },
    { id: 'pranchas', label: 'Gestão de Frota', icon: Truck },
    { id: 'frentes', label: 'Frentes', icon: MapPin },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck },
    { id: 'teste_visual', label: 'Design System', icon: Palette },
  ];

  const filteredMenu = menuItems.filter(item => canAccessTab(profile, item.id));

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {loggingOut && <AuthLoader message="Saindo..." />}

      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 bg-card border-r transition-all duration-300",
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 group">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <img 
                src="https://usinapitangueiras.com.br/wp-content/uploads/2020/04/usina-pitangueiras-logo.png" 
                alt="Logo Usina Pitangueiras"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black tracking-tighter transition-colors">
                <span className="text-black dark:text-white">LOCA</span>
                <span className="text-[#40800c]">PRANCHA</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 ml-0.5">Enterprise System</span>
            </div>
          </div>

          
          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredMenu.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 font-bold cyber-nav-btn",
                  activeView === item.id && "cyber-nav-btn-active shadow-lg"
                )}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon size={20} className={cn("nav-icon", activeView === item.id ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-green-600 bg-green-500/10 p-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="uppercase tracking-widest">Sincronizado</span>
            </div>
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
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img 
                src="https://usinapitangueiras.com.br/wp-content/uploads/2020/04/usina-pitangueiras-logo.png" 
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Usina Pitangueiras • Operação de Frota</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-yellow-500" />}
            </Button>
            
            <div className="h-8 w-[1px] bg-border mx-1" />
            
            <UserAccountMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 cyber-mobile-nav border-t flex items-center justify-around h-20 px-4 pb-safe z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <MobileNavItem 
            icon={LayoutDashboard} 
            label="Home" 
            active={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
          />
          <MobileNavItem 
            icon={Calendar} 
            label="Agenda" 
            active={activeView === 'reservas'} 
            onClick={() => onNavigate('reservas')} 
          />
          <MobileNavItem 
            icon={Truck} 
            label="Frota" 
            active={activeView === 'pranchas'} 
            onClick={() => onNavigate('pranchas')} 
          />
          {canAccessTab(profile, 'relatorios') && (
            <MobileNavItem 
              icon={BarChart} 
              label="Relatórios" 
              active={activeView === 'relatorios'} 
              onClick={() => onNavigate('relatorios')} 
            />
          )}
          {isGod(profile) && (
            <MobileNavItem 
              icon={ShieldCheck} 
              label="Auditoria" 
              active={activeView === 'auditoria'} 
              onClick={() => onNavigate('auditoria')} 
            />
          )}
          <MobileNavItem 
            icon={Users} 
            label="Perfil" 
            active={activeView === 'usuarios'} 
            onClick={() => onNavigate('usuarios')} 
          />
        </nav>
      </div>
    </div>
  );
}

function MobileNavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all cyber-nav-btn",
        active ? "cyber-nav-btn-active scale-105" : "text-muted-foreground"
      )}
    >
      <Icon size={24} className={cn("nav-icon transition-transform", active && "scale-110")} />
      <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-60")}>
        {label}
      </span>
    </button>
  );
}
