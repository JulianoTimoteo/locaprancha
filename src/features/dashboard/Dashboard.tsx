import React from "react";
import { useDashboardData } from "./useDashboardData";
import { useAuth } from "@/features/auth/AuthContext";
import { isGod } from "@/lib/permissions/permissions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, combineDateAndTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Truck, Calendar, Clock } from "lucide-react";

export function Dashboard() {
  React.useEffect(() => {
    document.title = "Dashboard Operacional | Locaprancha";
  }, []);

  const { stats, reservas, loading, error } = useDashboardData();
  const { profile } = useAuth();

  const getStatusBadgeHome = (reserva: any) => {
    const status = reserva.status;
    const isLocacao = reserva.tipoOperacao === "LOCACAO_DIRETA";

    switch (status) {
      case "Pendente":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50 font-black text-[10px]"
          >
            PENDENTE 🟡
          </Badge>
        );
      case "Aprovado":
      case "Agendado":
        return <Badge className="bg-blue-600 font-black text-[10px]">APROVADO 📅</Badge>;
      case "Iniciado":
        return (
          <Badge className="bg-green-600 font-black text-[10px]">
            {isLocacao ? "EM OPERAÇÃO" : "INICIADO"} 🟢
          </Badge>
        );
      case "Em Trânsito":
        return <Badge className="bg-purple-600 font-black text-[10px]">EM TRÂNSITO 🟣</Badge>;
      case "Recusado":
        return (
          <Badge variant="destructive" className="font-black text-[10px]">
            RECUSADO 🔴
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge variant="destructive" className="bg-black text-white font-black text-[10px]">
            CANCELADO ⚫
          </Badge>
        );
      default:
        return <Badge className="font-black text-[10px]">{status.toUpperCase()}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500 font-medium">⚠️ {error}</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "dashboard" }))}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <div className="h-[300px] bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1
        className="text-xl sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2 mb-2"
        id="dashboard-title"
      >
        Dashboard Operacional
      </h1>
      <p className="sr-only" aria-labelledby="dashboard-title">
        Locaprancha - Usina Pitangueiras
      </p>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Frota Total"
          value={stats.total}
          color="text-primary"
          icon="🚚"
          aria-label={`Frota Total: ${stats.total} equipamentos`}
          titleTag="h2"
        />
        <StatCard
          label="Disponíveis"
          value={stats.disponiveis}
          color="text-emerald-500"
          icon="🟢"
          aria-label={`Equipamentos Disponíveis: ${stats.disponiveis}`}
          titleTag="h2"
        />
        <StatCard
          label="Alocados"
          value={stats.alocadas}
          color="text-amber-500"
          icon="🟡"
          aria-label={`Equipamentos Alocados: ${stats.alocadas}`}
          titleTag="h2"
        />
        <StatCard
          label="Manutenção"
          value={stats.oficina}
          color="text-rose-500"
          icon="🔴"
          aria-label={`Equipamentos em Manutenção: ${stats.oficina}`}
          titleTag="h2"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-7 shadow-sm border-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2" tag="h2">
                <Calendar className="w-5 h-5 text-primary" />
                PRÓXIMOS TRANSPORTES
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold text-xs hover:bg-primary/5"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("navigate", { detail: "reservas" }))
                }
              >
                ABRIR AGENDA →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 opacity-10 mb-2" />
                  <p className="text-sm font-medium">Nenhum agendamento futuro.</p>
                </div>
              ) : (
                reservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="flex flex-col p-3 rounded-lg border border-primary/5 bg-muted/5 hover:bg-muted/10 transition-colors gap-3 cursor-pointer"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("navigate", { detail: "reservas" }))
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-primary">
                            🚚 {reserva.pranchaId || "FROTA N/A"}
                          </span>
                          {reserva.tipoOperacao === "LOCACAO_DIRETA" && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border-emerald-200"
                            >
                              🚜 LOCAÇÃO
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">
                          {reserva.frenteTrabalho || reserva.frenteId}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadgeHome(reserva)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-dashed border-primary/10">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Origem
                        </span>
                        <span className="text-sm font-black">{reserva.origem}</span>
                      </div>
                      <div className="px-2 text-primary/30">→</div>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Destino
                        </span>
                        <span className="text-sm font-black">{reserva.destino}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {(() => {
                            try {
                              return format(
                                combineDateAndTime(
                                  reserva.data,
                                  reserva.hora || reserva.horarioRetirada,
                                ),
                                "dd/MM/yyyy",
                                { locale: ptBR },
                              );
                            } catch (e) {
                              return reserva.data;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{reserva.hora || reserva.horarioRetirada}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-bold truncate">
                        Equipamento:{" "}
                        {reserva.equipamentoNome || reserva.equipamentoId || "Aguardando definição"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  "aria-label": ariaLabel,
  titleTag: TitleTag = "p",
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  "aria-label"?: string;
  titleTag?: "p" | "h2" | "h3";
}) {
  return (
    <Card className="overflow-hidden" aria-label={ariaLabel}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <TitleTag className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </TitleTag>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl sm:text-3xl font-black", color)}>{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
