import React, { useState, useMemo } from "react";
import { useReservas } from "./useReservas";
import { useAuth } from "@/features/auth/AuthContext";
import { ReservaForm } from "./ReservaForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Calendar,
  Filter,
  Check,
  X,
  Play,
  Square,
  MessageSquare,
  Clock,
  User,
  MapPin,
  Truck,
  AlertCircle,
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatReservaDateTime } from "@/lib/utils/reservaFormatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Reserva } from "@/types";
import { hasPermission, isAdmin, isGod } from "@/lib/permissions/permissions";
import { toast } from "sonner";

export function ReservaList() {
  const { reservas, loading, updateReservaStatus } = useReservas();
  const { profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLocarModalOpen, setIsLocarModalOpen] = useState(false);
  const [locarInitialData, setLocarInitialData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Listen for direct allocation requests from other components
  React.useEffect(() => {
    const handleOpenLocar = (e: any) => {
      setLocarInitialData(e.detail || null);
      setIsLocarModalOpen(true);
    };
    window.addEventListener("open-locar", handleOpenLocar);
    return () => window.removeEventListener("open-locar", handleOpenLocar);
  }, []);

  // Modais de ação
  const [recusaModal, setRecusaModal] = useState<{ open: boolean; id: string; motivo: string }>({
    open: false,
    id: "",
    motivo: "",
  });

  const [conclusaoModal, setConclusaoModal] = useState<{
    open: boolean;
    id: string;
    relatorio: string;
  }>({
    open: false,
    id: "",
    relatorio: "",
  });

  const canManage = hasPermission(profile, "usuarios"); // Simplificação baseada em permissão real
  const canOperate = hasPermission(profile, "reservas");

  // TRAVA DE DUPLICIDADE: pranchas já associadas a uma operação ativa
  // ("EM OPERAÇÃO", "Iniciado" ou "Em Trânsito") em qualquer registro da agenda.
  const pranchasEmUso = React.useMemo(() => {
    const emUso = new Set<string>();
    reservas.forEach((r) => {
      if (["EM OPERAÇÃO", "Iniciado", "Em Trânsito"].includes(r.status)) {
        const prancha = (r.pranchaId || "").toString().trim().toUpperCase();
        if (prancha && prancha !== "N/A") emUso.add(prancha);
      }
    });
    return emUso;
  }, [reservas]);

  const pranchaIndisponivel = (reserva: Reserva) =>
    pranchasEmUso.has((reserva.pranchaId || "").toString().trim().toUpperCase());

  const handleAceitar = async (reserva: Reserva) => {
    try {
      await updateReservaStatus(reserva.id, "Aprovado");
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível aceitar a solicitação.");
    }
  };

  const filtered = useMemo(() => {
    const sorted = [...reservas].sort((a, b) => {
      const order = {
        Iniciado: 1,
        Agendado: 2,
        Pendente: 3,
        Aprovado: 3,
        "Em Trânsito": 4,
        Finalizado: 5,
        Concluído: 5,
        Cancelado: 6,
        Recusado: 6,
      };
      const getOrder = (s: string) => order[s as keyof typeof order] || 99;

      if (getOrder(a.status) !== getOrder(b.status)) {
        return getOrder(a.status) - getOrder(b.status);
      }

      const dateA = a.data || "0000-00-00";
      const dateB = b.data || "0000-00-00";
      if (dateA !== dateB) return dateB.localeCompare(dateA);

      const timeA = a.hora || "00:00";
      const timeB = b.hora || "00:00";
      return timeB.localeCompare(timeA);
    });

    return sorted.filter((r) => {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch =
        (r.pranchaId || "").toLowerCase().includes(searchString) ||
        (r.solicitanteNome || "").toLowerCase().includes(searchString) ||
        (r.frenteTrabalho || "").toLowerCase().includes(searchString) ||
        (r.origem || "").toLowerCase().includes(searchString) ||
        (r.destino || "").toLowerCase().includes(searchString) ||
        (r.status || "").toLowerCase().includes(searchString);

      if (!matchesSearch) return false;

      if (isGod(profile) || isAdmin(profile) || profile?.role === "LIDER") return true;
      if (profile?.role === "MOTORISTA")
        return (
          r.motoristaId === profile.uid ||
          ["Aprovado", "Agendado", "Iniciado", "Em Trânsito"].includes(r.status)
        );
      return r.userId === profile?.uid || r.solicitanteId === profile?.uid;
    });
  }, [reservas, searchTerm, profile]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getStatusBadge = (reserva: Reserva) => {
    const status = reserva.status;
    const isLocacao = reserva.tipoOperacao === "LOCACAO_DIRETA";

    switch (status) {
      case "Pendente":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 bg-yellow-50 font-bold"
          >
            PENDENTE 🟡
          </Badge>
        );
      case "Agendado":
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 font-bold">
            AGENDADO 📅
          </Badge>
        );
      case "Aprovado":
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 font-bold">
            APROVADO 📅
          </Badge>
        );
      case "Iniciado":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 font-bold">
            {isLocacao ? "EM OPERAÇÃO" : "INICIADO"} 🟢
          </Badge>
        );
      case "Em Trânsito":
        return (
          <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 font-bold">
            EM TRÂNSITO 🟣
          </Badge>
        );
      case "Finalizado":
        return (
          <Badge variant="default" className="bg-slate-500 hover:bg-slate-600 font-bold">
            FINALIZADO ⚪
          </Badge>
        );
      case "Concluído":
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-bold">
            CONCLUÍDO ✅
          </Badge>
        );
      case "Recusado":
        return (
          <Badge variant="destructive" className="font-bold">
            RECUSADO 🔴
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge variant="destructive" className="bg-black hover:bg-black font-bold text-white">
            CANCELADO ⚫
          </Badge>
        );
      default:
        return <Badge className="font-bold">{(status as string).toUpperCase()}</Badge>;
    }
  };

  const handleRecusar = () => {
    if (!recusaModal.motivo) return;
    updateReservaStatus(recusaModal.id, "Recusado", { motivo: recusaModal.motivo });
    setRecusaModal({ open: false, id: "", motivo: "" });
  };

  const handleConcluir = () => {
    updateReservaStatus(conclusaoModal.id, "Finalizado", { relatorio: conclusaoModal.relatorio });
    setConclusaoModal({ open: false, id: "", relatorio: "" });
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-bold">Carregando agenda...</p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" id="page-title">
            Agenda Operacional
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Controle de transportes e locações.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {hasPermission(profile, "reservas") && (
            <Button
              className="flex-1 sm:flex-none gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 font-bold"
              onClick={() => {
                setLocarInitialData(null);
                setIsLocarModalOpen(true);
              }}
            >
              LOCAR 🛣️
            </Button>
          )}
          {isAdmin(profile) && (
            <Button
              className="flex-1 sm:flex-none gap-2 shadow-lg shadow-primary/20 font-bold"
              onClick={() => {
                setIsFormOpen(true);
              }}
            >
              AGENDAR 📅
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <h2 className="sr-only">Filtros da Agenda</h2>
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Buscar por prancha, equipamento..."
            className="pl-10 h-11 bg-card shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar por prancha ou equipamento"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 lg:hidden"
          aria-label="Abrir filtros de agenda"
        >
          <Filter size={20} />
        </Button>
      </div>

      {/* Buttons moved to top for better mobile reachability, keeping this block empty or removed */}

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden px-1">
        {paginated.map((reserva) => (
          <Card
            key={reserva.id}
            className="overflow-hidden border-primary/5 shadow-md active:scale-[0.99] transition-transform"
          >
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 bg-muted/20">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-primary">🚚 {reserva.pranchaId}</span>
                  {reserva.tipoOperacao === "LOCACAO_DIRETA" && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border-emerald-200"
                    >
                      🚜 LOCAÇÃO
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {reserva.frenteTrabalho || reserva.frenteId}
                </span>
              </div>
              {getStatusBadge(reserva)}
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} /> Data
                  </p>
                  <p className="text-sm font-bold whitespace-pre-line">
                    {formatReservaDateTime(reserva)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground flex items-center gap-1">
                    <Hash size={10} /> Equipamento
                  </p>
                  <p className="text-sm font-bold">{reserva.equipamentoNome || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-dashed border-primary/10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground">Origem</p>
                  <p className="text-sm font-black">{reserva.origem || "Não informado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground">Destino</p>
                  <p className="text-sm font-black">{reserva.destino || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User size={14} />
                  <span className="font-bold">{reserva.solicitanteNome || "Solicitante"}</span>
                </div>
              </div>

              {canOperate &&
                reserva.status !== "Concluído" &&
                reserva.status !== "Finalizado" &&
                reserva.status !== "Recusado" &&
                reserva.status !== "Cancelado" && (
                  <div className="pt-2 flex flex-col gap-2">
                    {reserva.status === "Pendente" && isAdmin(profile) && (
                      <div className="flex gap-2">
                        {pranchaIndisponivel(reserva) ? (
                          <span className="flex-1 flex items-center justify-center text-[11px] font-black uppercase text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-3 text-center">
                            Prancha Indisponível 🚫
                          </span>
                        ) : (
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 font-bold h-12"
                            onClick={() => handleAceitar(reserva)}
                          >
                            <Check size={18} className="mr-1" /> ACEITAR
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          className="flex-1 font-bold h-12"
                          onClick={() => setRecusaModal({ open: true, id: reserva.id, motivo: "" })}
                        >
                          <X size={18} className="mr-1" /> RECUSAR
                        </Button>
                      </div>
                    )}
                    {(reserva.status === "Aprovado" || reserva.status === "Agendado") && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-lg shadow-blue-200"
                        onClick={() => updateReservaStatus(reserva.id, "Iniciado")}
                      >
                        <Play size={18} className="mr-2" /> INICIAR SERVIÇO
                      </Button>
                    )}
                    {(reserva.status === "Iniciado" || reserva.status === "Em Trânsito") && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 shadow-lg shadow-green-200"
                        onClick={() =>
                          setConclusaoModal({ open: true, id: reserva.id, relatorio: "" })
                        }
                      >
                        ENCERRAR SERVIÇO ❎
                      </Button>
                    )}
                  </div>
                )}

              {(reserva.status === "Cancelado" || reserva.status === "Recusado") &&
                reserva.motivoRecusa && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700 italic">
                    Motivo: {reserva.motivoRecusa}
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block border rounded-xl bg-card overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-black text-xs uppercase">Data/Hora</TableHead>
                <TableHead className="font-black text-xs uppercase">Frota</TableHead>
                <TableHead className="font-black text-xs uppercase">Equipamento</TableHead>
                <TableHead className="font-black text-xs uppercase">Frente Operacional</TableHead>
                <TableHead className="font-black text-xs uppercase">Origem / Destino</TableHead>
                <TableHead className="font-black text-xs uppercase">Solicitante</TableHead>
                <TableHead className="font-black text-xs uppercase">Status</TableHead>
                <TableHead className="text-right font-black text-xs uppercase">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((reserva) => (
                <TableRow key={reserva.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-bold whitespace-nowrap">
                    <div className="flex flex-col text-xs">
                      <span className="whitespace-pre-line leading-tight">
                        {formatReservaDateTime(reserva)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-primary text-lg">
                        🚚 {reserva.pranchaId || "N/A"}
                      </span>
                      {reserva.tipoOperacao === "LOCACAO_DIRETA" && (
                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1 rounded w-fit uppercase">
                          LOCAÇÃO
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="font-bold">
                    <span className="text-sm font-bold text-primary">
                      {reserva.equipamentoNome || "N/A"}
                    </span>
                  </TableCell>

                  <TableCell className="font-bold">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {reserva.frenteTrabalho || reserva.frenteId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">
                        De: {reserva.origem || "N/A"}
                      </span>
                      <span className="text-primary uppercase">
                        Para: {reserva.destino || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {reserva.solicitanteNome || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(reserva)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {reserva.status === "Pendente" && canManage && (
                        <>
                          {pranchaIndisponivel(reserva) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 font-black text-[10px] whitespace-nowrap">
                              Prancha Indisponível 🚫
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:bg-green-50 font-black text-xs"
                              onClick={() => handleAceitar(reserva)}
                            >
                              ACEITAR
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-red-50 font-black text-xs"
                            onClick={() =>
                              setRecusaModal({ open: true, id: reserva.id, motivo: "" })
                            }
                          >
                            RECUSAR
                          </Button>
                        </>
                      )}
                      {(reserva.status === "Aprovado" || reserva.status === "Agendado") &&
                        canOperate && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 font-black text-xs"
                            onClick={() => updateReservaStatus(reserva.id, "Iniciado")}
                          >
                            INICIAR
                          </Button>
                        )}
                      {(reserva.status === "Iniciado" || reserva.status === "Em Trânsito") &&
                        canOperate && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 font-black text-xs"
                            onClick={() =>
                              setConclusaoModal({ open: true, id: reserva.id, relatorio: "" })
                            }
                          >
                            ENCERRAR ❎
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground bg-card/50 rounded-2xl border-2 border-dashed border-primary/10">
          <Calendar size={48} className="opacity-10 mb-4" />
          <p className="font-bold text-lg">📅 Nenhum transporte agendado</p>
          <p className="text-sm">Você ainda não possui solicitações futuras.</p>
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between px-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="font-bold"
          >
            <ChevronLeft size={16} className="mr-1" /> Anterior
          </Button>
          <span className="text-xs font-bold text-muted-foreground">
            Página {safePage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="font-bold"
          >
            Próxima <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      {/* Modais de Ação */}
      <Dialog
        open={recusaModal.open}
        onOpenChange={(o) => setRecusaModal((prev) => ({ ...prev, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="w-5 h-5" /> Recusar Solicitação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <label className="text-sm font-bold">Motivo da Recusa (Obrigatório)</label>
            <Textarea
              placeholder="Descreva o motivo..."
              value={recusaModal.motivo}
              onChange={(e) => setRecusaModal((prev) => ({ ...prev, motivo: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecusaModal({ open: false, id: "", motivo: "" })}
            >
              Cancelar
            </Button>
            <Button variant="destructive" disabled={!recusaModal.motivo} onClick={handleRecusar}>
              CONFIRMAR RECUSA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={conclusaoModal.open}
        onOpenChange={(o) => setConclusaoModal((prev) => ({ ...prev, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" /> Encerrar Serviço
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Confirme a conclusão do transporte. O equipamento voltará a ficar disponível na frota.
            </p>
            <label className="text-sm font-bold">Relatório / Observações</label>
            <Textarea
              placeholder="Descreva como foi o serviço, ocorrências, etc..."
              value={conclusaoModal.relatorio}
              onChange={(e) =>
                setConclusaoModal((prev) => ({ ...prev, relatorio: e.target.value }))
              }
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConclusaoModal({ open: false, id: "", relatorio: "" })}
            >
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 font-bold" onClick={handleConcluir}>
              ENCERRAR SERVIÇO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReservaForm open={isFormOpen} onOpenChange={setIsFormOpen} isAlocacaoDireta={false} />

      <ReservaForm
        open={isLocarModalOpen}
        onOpenChange={setIsLocarModalOpen}
        isAlocacaoDireta={true}
        initialData={locarInitialData}
      />
    </div>
  );
}
