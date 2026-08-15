import React, { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Key,
  LogOut,
  ChevronRight,
  Shield,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { AuthLoader } from "@/components/auth/AuthLoader";

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { BUILD_DATE } from "@/lib/utils/storage";

function ConnectionDot() {
  const status = useConnectionStatus();

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card shadow-sm z-10",
        status === "online"
          ? "bg-emerald-500"
          : status === "syncing"
            ? "bg-amber-500 animate-pulse"
            : status === "offline"
              ? "bg-destructive animate-pulse"
              : "bg-blue-500 animate-pulse",
      )}
    />
  );
}

export function UserAccountMenu() {
  const { profile, user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      await auth.signOut();
      toast.success("Sessão encerrada com sucesso.");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Erro ao sair do sistema.");
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        toast.success("Senha alterada com sucesso!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("Senha atual incorreta.");
      } else {
        toast.error("Erro ao alterar senha: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = profile?.nickname || profile?.name || user.email?.split("@")[0] || "GOD";
  const displayRole = profile?.role || "GOD";
  const displayStatus = profile?.status || "ATIVO";
  const displayInitial = (profile?.name || user.email || "G").charAt(0).toUpperCase();

  return (
    <>
      {loggingOut && <AuthLoader message="Saindo..." />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-3 pl-1 outline-none group text-left"
            aria-label={`Menu da conta do usuário ${displayName}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none group-hover:text-primary transition-colors mb-1">
                {displayName}
              </p>
              <Badge
                variant="outline"
                className="h-4 text-[8px] font-black border-primary/20 text-primary/70 bg-primary/5 uppercase px-1.5"
              >
                {displayRole}
              </Badge>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 relative">
              {displayInitial}
              <ConnectionDot />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 p-2 bg-card/95 backdrop-blur-xl border-primary/10 shadow-2xl"
        >
          <div className="flex flex-col items-center p-4 mb-2 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black mb-3 shadow-xl shadow-primary/30 relative z-10 border-2 border-background">
              {displayInitial}
            </div>
            <span className="font-black text-xs uppercase tracking-widest relative z-10">{displayName}</span>
            <Badge className="mt-1.5 text-[9px] font-black bg-primary text-primary-foreground hover:bg-primary border-none px-2 relative z-10">
              {displayRole}
            </Badge>
          </div>

          <DropdownMenuSeparator className="bg-primary/10" />

          <DropdownMenuItem
            className="flex items-center gap-3 py-3 cursor-pointer font-bold focus:bg-primary/10 transition-colors"
            onClick={() => setShowProfileModal(true)}
          >
            <User size={18} className="text-primary" />
            <span>Meu Perfil</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 py-3 cursor-pointer font-bold focus:bg-primary/10 transition-colors"
            onClick={() => setShowPasswordModal(true)}
          >
            <Key size={18} className="text-primary" />
            <span>Alterar Senha</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/10" />

          <DropdownMenuItem
            className="flex items-center gap-3 py-3 cursor-pointer font-bold text-destructive focus:bg-destructive/10 transition-colors"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} />
            <span>Sair</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/10" />
          <div className="px-2 py-2 text-[8px] font-black text-muted-foreground/40 flex flex-col items-center uppercase tracking-widest border-t border-primary/5 mt-1">
            <span>Versão 1.9.0 (Premium)</span>
            <span className="mt-0.5">Build: {BUILD_DATE}</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Perfil Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-md bg-card border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <User className="text-primary" />
              MEU PERFIL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Nome
              </Label>
              <p className="font-bold text-lg">{displayName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                E-mail
              </Label>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary/60" />
                <p className="font-bold">{profile?.email || user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Perfil
                </Label>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-primary/60" />
                  <p className="font-black text-primary">{displayRole}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Status
                </Label>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <p className="font-black text-green-500">{displayStatus}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowProfileModal(false)} className="font-black w-full">
              FECHAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alterar Senha Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md bg-card border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Key className="text-primary" />
              ALTERAR SENHA
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Senha Atual</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-muted/50 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Nova Senha</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-muted/50 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Confirmar Nova Senha</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-muted/50 border-primary/10"
              />
            </div>
            <DialogFooter className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="font-black flex-1"
                disabled={loading}
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                className="font-black flex-1 shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ALTERAR SENHA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logout Confirm Modal */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-sm bg-card border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-destructive">
              <AlertCircle />
              LOGOUT
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-bold text-center">Tem certeza que deseja sair do sistema?</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="font-black flex-1"
            >
              CANCELAR
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="font-black flex-1 shadow-lg shadow-destructive/20"
            >
              SAIR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
