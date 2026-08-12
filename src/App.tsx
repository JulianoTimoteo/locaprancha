import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FrotaList } from '@/features/frota/FrotaList';
import { ReservaList } from '@/features/reservas/ReservaList';
import { FrenteList } from '@/features/frentes/FrenteList';

import { UsuarioList } from '@/features/usuarios/UsuarioList';
import { RelatorioPage } from '@/features/relatorios/RelatorioPage';
import { AuditoriaList } from '@/features/auditoria/AuditoriaList';
import { Toaster } from 'sonner';
import { 
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { canAccessTab } from '@/lib/permissions/permissions';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export default function App() {
  const { user, profile, loading, status } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Listen for navigation events from children
  React.useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) {
        setCurrentView(e.detail);
      }
    };
    window.addEventListener('navigate', handleNav);
    return () => window.removeEventListener('navigate', handleNav);
  }, []);

  // Reset to dashboard on mount (login always leads to home/dashboard)
  React.useEffect(() => {
    if (user && profile) {
      setCurrentView('dashboard');
    }
  }, [user, !!profile]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
        <div className="text-2xl font-black tracking-tighter animate-pulse">
          <span className="text-black dark:text-white">LOCA</span>
          <span className="text-[#40800c]">PRANCHA</span>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
          Carregando ambiente seguro...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" />
      </>
    );
  }

  // Tratamento de estados de acesso (Instrução 7 e 8)
  if (status !== 'PROFILE_OK') {
    const statusMessages = {
      'LOADING': 'Carregando seu perfil operacional...',
      'AUTH_NOT_FOUND': 'Usuário não autenticado.',
      'PROFILE_NOT_FOUND': 'Seu usuário foi autenticado, mas seu perfil operacional ainda não foi cadastrado no sistema.',
      'PROFILE_BLOCKED': 'Seu acesso está bloqueado. Procure um administrador para regularizar seu acesso.',
      'PROFILE_INACTIVE': 'Seu usuário está inativo no sistema.',
      'PROFILE_OK': ''
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          status === 'PROFILE_NOT_FOUND' ? "bg-amber-100 text-amber-600" : "bg-destructive/10 text-destructive"
        )}>
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase">
          {status === 'PROFILE_NOT_FOUND' ? "Perfil não Encontrado" : "Acesso Interrompido"}
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {statusMessages[status]}
        </p>
        
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button variant="outline" className="font-bold uppercase h-12" onClick={() => auth.signOut()}>
            Sair da Conta
          </Button>

          {/* DIAGNÓSTICO DE IDENTIDADE (Instrução 8) */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed text-left space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Diagnóstico de Identidade</p>
            <p className="text-[10px] font-mono break-all leading-tight"><span className="font-black">Firebase Auth UID:</span> {user.uid}</p>
            <p className="text-[10px] font-mono break-all leading-tight"><span className="font-black">Email:</span> {user.email}</p>
            <p className="text-[10px] font-mono"><span className="font-black">Documento Procurado:</span> usuarios/{user.uid}</p>
            <p className="text-[10px] font-mono"><span className="font-black">Documento Encontrado:</span> {profile ? 'SIM' : 'NÃO'}</p>
            {profile && (
              <>
                <p className="text-[10px] font-mono"><span className="font-black">Documento ID:</span> {profile.uid}</p>
                <p className="text-[10px] font-mono"><span className="font-black">Role:</span> {profile.role}</p>
                <p className="text-[10px] font-mono"><span className="font-black">Status:</span> {profile.status}</p>
              </>
            )}
            <p className="text-[8px] text-muted-foreground mt-2 italic">Dica: Se você acabou de ser criado e não consegue logar, peça ao administrador para verificar se o seu e-mail no Auth coincide com o e-mail no Perfil.</p>
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
          {currentView === 'dashboard' && canAccessTab(profile, 'dashboard') && <ErrorBoundary area="Dashboard"><Dashboard /></ErrorBoundary>}
          {currentView === 'reservas' && canAccessTab(profile, 'reservas') && <ErrorBoundary area="Reservas"><ReservaList /></ErrorBoundary>}
          {currentView === 'pranchas' && canAccessTab(profile, 'pranchas') && <ErrorBoundary area="Frota"><FrotaList /></ErrorBoundary>}
          
          {currentView === 'frentes' && canAccessTab(profile, 'frentes') && <ErrorBoundary area="Frentes"><FrenteList /></ErrorBoundary>}
          {currentView === 'relatorios' && canAccessTab(profile, 'relatorios') && <ErrorBoundary area="Relatorios"><RelatorioPage /></ErrorBoundary>}
          {currentView === 'usuarios' && canAccessTab(profile, 'usuarios') && <ErrorBoundary area="Usuarios"><UsuarioList /></ErrorBoundary>}
          {currentView === 'auditoria' && canAccessTab(profile, 'auditoria') && <ErrorBoundary area="Auditoria"><AuditoriaList /></ErrorBoundary>}
          
          {/* Proteção contra rota manual ou inexistente via state */}
          {!canAccessTab(profile, currentView) && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
                <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded border">
                  UID: <span className="font-mono">{user.uid}</span><br/>
                  Role: <span className="font-mono font-bold">{profile?.role}</span>
                </div>
                <Button variant="link" className="mt-4" onClick={() => handleNavigate('dashboard')}>Voltar ao Início</Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}
