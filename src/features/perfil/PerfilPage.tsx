import React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, CheckCircle2, KeyRound, CalendarClock, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(value: any): string {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function PerfilPage() {
  React.useEffect(() => {
    document.title = "Meu Perfil | Locaprancha";
  }, []);

  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor =
    profile.status === "ATIVO"
      ? "text-green-600 dark:text-green-400"
      : profile.status === "BLOQUEADO"
        ? "text-destructive"
        : "text-amber-600 dark:text-amber-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black tracking-tighter uppercase">Meu Perfil</h1>
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="text-primary" />
            DADOS PESSOAIS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg shadow-primary/20">
              {(profile.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <p className="font-black text-lg uppercase leading-tight">
                {profile.nickname || profile.name}
              </p>
              <p className="text-sm text-muted-foreground font-bold">{profile.name}</p>
              <Badge className="text-[10px] font-black bg-primary/15 text-primary hover:bg-primary/15 border-none">
                {profile.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Mail size={12} /> E-mail
              </p>
              <p className="font-bold break-all">{profile.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Shield size={12} /> Perfil
              </p>
              <p className="font-black text-primary uppercase">{profile.role}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <CheckCircle2 size={12} /> Status
              </p>
              <p className={`font-black uppercase ${statusColor}`}>{profile.status}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> Último Acesso
              </p>
              <p className="font-bold">{formatDate(profile.ultimoAcesso)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="text-primary" />
            ACESSOS LIBERADOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.permissions && profile.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((permission) => (
                <Badge
                  key={permission}
                  variant="outline"
                  className="font-black text-[10px] uppercase border-primary/20 text-primary bg-primary/5"
                >
                  {permission}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-bold">Sem permissões específicas.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="text-primary" />
            INFORMAÇÕES DO CADASTRO
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Criado em
            </p>
            <p className="font-bold">{formatDate(profile.criadoEm)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Atualizado em
            </p>
            <p className="font-bold">{formatDate(profile.atualizadoEm)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
