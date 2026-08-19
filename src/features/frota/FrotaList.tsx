import React, { useState, useMemo } from "react";
import { useFleet } from "./useFleet";
import { useAuth } from "@/features/auth/AuthContext";
import { canManageFleet } from "@/lib/permissions/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit2,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Frota, StatusFrota } from "@/types";
import { FrotaStatusBadge } from "./FrotaStatusBadge";
import { FrotaForm } from "./FrotaForm";
import { FrotaCard } from "./FrotaCard";
import { FrotaFilters } from "./FrotaFilters";
import { ReservaForm } from "@/features/reservas/ReservaForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Truck } from "lucide-react";

export function FrotaList() {
  const { frotas, loading, changeStatus } = useFleet();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFrota | "TODAS">("TODAS");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [frotaToEdit, setFrotaToEdit] = useState<Frota | null>(null);

  const [isLocarOpen, setIsLocarOpen] = useState(false);
  const [locarPranchaId, setLocarPranchaId] = useState<string | null>(null);

  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [frotaForWorkshop, setFrotaForWorkshop] = useState<Frota | null>(null);
  const [justification, setJustification] = useState("");
  const [customJustification, setCustomJustification] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const canManage = canManageFleet(profile);

  const filteredFrotas = useMemo(() => {
    return frotas.filter((f: Frota) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        f.frota.toLowerCase().includes(search) ||
        f.placa.toLowerCase().includes(search) ||
        f.nome.toLowerCase().includes(search) ||
        f.marca.toLowerCase().includes(search) ||
        f.modelo.toLowerCase().includes(search);

      const matchesStatus = statusFilter === "TODAS" || f.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [frotas, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFrotas.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFrotas = filteredFrotas.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleEdit = (frota: Frota) => {
    setFrotaToEdit(frota);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setFrotaToEdit(null);
    setIsFormOpen(true);
  };

  const openWorkshopDialog = (frota: Frota) => {
    if (frota.status === "ALOCADO") {
      return;
    }
    setFrotaForWorkshop(frota);
    setJustification("");
    setCustomJustification("");
    setIsWorkshopDialogOpen(true);
  };

  const handleSendToWorkshop = async () => {
    if (!frotaForWorkshop) return;
    const motivo = justification === "Outros" ? customJustification.trim() : justification;
    if (!motivo) return;
    await changeStatus(frotaForWorkshop.id, "OFICINA", motivo);
    setIsWorkshopDialogOpen(false);
  };

  const handleRelease = async (frota: Frota) => {
    await changeStatus(frota.id, "DISPONÍVEL");
  };

  // Abre o modal de locação direta com a prancha pré-selecionada.
  // O modal é renderizado AQUI (não depende do ReservaList estar montado).
  const handleLocar = (frota: Frota) => {
    setLocarPranchaId(frota.frota);
    setIsLocarOpen(true);
  };

  if (loading)
    return <div className="p-8 text-center font-bold animate-pulse">Carregando frota...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" id="page-title">
            Gestão de Frota
          </h1>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm">
            Controle de disponibilidade e manutenção.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleNew}
            className="w-full sm:w-auto gap-2 font-black tracking-widest shadow-lg shadow-primary/20 uppercase"
          >
            <Plus size={18} /> NOVA FROTA
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight px-1 flex items-center gap-2">
          <Truck className="text-primary" /> Frota de Pranchas
        </h2>

        <h2 className="sr-only">Filtros da Frota</h2>
        <FrotaFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Desktop View */}
        <div className="hidden md:block border rounded-xl bg-card overflow-hidden shadow-md mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black text-xs uppercase w-[150px]">Frota</TableHead>
                  <TableHead className="font-black text-xs uppercase w-[120px]">Placa</TableHead>
                  <TableHead className="font-black text-xs uppercase">Equipamento</TableHead>
                  <TableHead className="font-black text-xs uppercase w-[180px]">Status</TableHead>
                  <TableHead className="font-black text-xs uppercase text-right w-[150px]">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFrotas.map((frota: Frota) => (
                  <TableRow key={frota.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="text-xl font-black text-primary">
                      🚚 {frota.frota}
                    </TableCell>
                    <TableCell className="font-black text-sm uppercase tracking-tighter text-muted-foreground">
                      {frota.placa}
                    </TableCell>
                    <TableCell className="font-bold text-sm">
                      <div className="flex flex-col">
                        <span>{frota.nome}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {frota.marca} {frota.modelo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <FrotaStatusBadge status={frota.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-black text-[10px] gap-1"
                            disabled={frota.status !== "DISPONÍVEL"}
                            onClick={() => handleLocar(frota)}
                          >
                            LOCAR 🛣️
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(frota)}
                            >
                              <Edit2 size={16} />
                              <span className="sr-only">Editar frota {frota.frota}</span>
                            </Button>

                            {frota.status === "OFICINA" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleRelease(frota)}
                                aria-label="Liberar da Oficina"
                              >
                                <CheckCircle2 size={18} />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={frota.status === "ALOCADO"}
                                onClick={() => openWorkshopDialog(frota)}
                                aria-label={
                                  frota.status === "ALOCADO"
                                    ? "Frota em Operação (Indisponível para Oficina)"
                                    : "Enviar para Oficina"
                                }
                              >
                                <Wrench size={16} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFrotas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground font-medium italic"
                    >
                      Nenhuma frota cadastrada ou encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {paginatedFrotas.map((frota: Frota) => (
          <FrotaCard
            key={frota.id}
            frota={frota}
            onEdit={handleEdit}
            onWorkshop={openWorkshopDialog}
            onRelease={handleRelease}
            onLocar={handleLocar}
          />
        ))}
        {filteredFrotas.length === 0 && (
          <div className="p-8 text-center text-muted-foreground font-medium italic bg-muted/20 rounded-xl border border-dashed">
            Nenhuma frota encontrada.
          </div>
        )}
      </div>

      <FrotaForm open={isFormOpen} onOpenChange={setIsFormOpen} frotaToEdit={frotaToEdit} />

      <ReservaForm
        open={isLocarOpen}
        onOpenChange={setIsLocarOpen}
        isAlocacaoDireta={true}
        initialData={{ pranchaId: locarPranchaId }}
      />

      {/* Workshop Dialog */}
      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-red-600">
              <Wrench /> Enviar para Oficina
            </DialogTitle>
            <DialogDescription className="font-medium">
              Confirmar o envio da frota para manutenção?
            </DialogDescription>
          </DialogHeader>

          {frotaForWorkshop && (
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Frota:
                  </span>
                  <span className="font-black text-primary flex items-center gap-1">
                    <Truck size={16} />
                    {frotaForWorkshop.frota}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Placa:
                  </span>
                  <span className="font-bold">{frotaForWorkshop.placa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Equipamento:
                  </span>
                  <span className="font-medium text-xs text-right">{frotaForWorkshop.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Status atual:
                  </span>
                  <FrotaStatusBadge status={frotaForWorkshop.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Novo status:
                  </span>
                  <FrotaStatusBadge status="OFICINA" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Justificativa de Manutenção *
                </label>
                <Select value={justification} onValueChange={setJustification}>
                  <SelectTrigger className="font-bold">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                    <SelectItem value="Pneus">Pneus</SelectItem>
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="Freios">Freios</SelectItem>
                    <SelectItem value="Elétrica">Elétrica</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                {justification === "Outros" && (
                  <Textarea
                    placeholder="Descreva o motivo..."
                    className="mt-2 text-sm"
                    value={customJustification}
                    onChange={(e) => setCustomJustification(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsWorkshopDialogOpen(false)}
              className="font-bold uppercase"
            >
              CANCELAR
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 font-black tracking-widest uppercase shadow-lg shadow-red-600/20"
              onClick={handleSendToWorkshop}
              disabled={
                !justification || (justification === "Outros" && !customJustification.trim())
              }
            >
              ENVIAR PARA OFICINA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {filteredFrotas.length > pageSize && (
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
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
