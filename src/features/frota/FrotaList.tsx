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
import { Plus, Edit2, Wrench, CheckCircle2 } from "lucide-react";
import { Frota, StatusFrota } from "@/types";
import { FrotaStatusBadge } from "./FrotaStatusBadge";
import { FrotaForm } from "./FrotaForm";
import { FrotaCard } from "./FrotaCard";
import { FrotaFilters } from "./FrotaFilters";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FrotaList() {
  const { frotas, loading, changeStatus } = useFleet();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFrota | "TODAS">("TODAS");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [frotaToEdit, setFrotaToEdit] = useState<Frota | null>(null);

  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [frotaForWorkshop, setFrotaForWorkshop] = useState<Frota | null>(null);
  const [justification, setJustification] = useState("");

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

  const handleEdit = (frota: Frota) => {
    setFrotaToEdit(frota);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setFrotaToEdit(null);
    setIsFormOpen(true);
  };

  const openWorkshopDialog = (frota: Frota) => {
    if (frota.status === "ALOCADO") return;
    setFrotaForWorkshop(frota);
    setJustification("");
    setIsWorkshopDialogOpen(true);
  };

  const handleSendToWorkshop = async () => {
    if (!frotaForWorkshop || !justification) return;
    await changeStatus(frotaForWorkshop.id, "OFICINA", justification);
    setIsWorkshopDialogOpen(false);
  };

  const handleRelease = async (frota: Frota) => {
    await changeStatus(frota.id, "DISPONÍVEL");
  };

  if (loading)
    return <div className="p-8 text-center font-bold animate-pulse">Carregando frota...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Truck size={80} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-foreground/90 flex items-center gap-3" id="page-title">
            <Truck className="text-primary w-8 h-8" /> Gestão de Frota
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-70">
            Pranchas de Transporte • Disponibilidade
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

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden border-b-4 border-b-primary">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
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
                {filteredFrotas.map((frota: Frota) => (
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
                            onClick={() => {
                              const event = new CustomEvent("open-locar", {
                                detail: { pranchaId: frota.frota },
                              });
                              window.dispatchEvent(event);
                            }}
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
                                aria-label="Enviar para Oficina"
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

      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredFrotas.map((frota: Frota) => (
          <FrotaCard
            key={frota.id}
            frota={frota}
            onEdit={handleEdit}
            onWorkshop={openWorkshopDialog}
            onRelease={handleRelease}
          />
        ))}
      </div>

      <FrotaForm open={isFormOpen} onOpenChange={setIsFormOpen} frotaToEdit={frotaToEdit} />

      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-red-600">
              <Wrench /> Enviar para Oficina
            </DialogTitle>
          </DialogHeader>

          {frotaForWorkshop && (
            <div className="py-4 space-y-4">
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
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsWorkshopDialogOpen(false)}
              className="font-bold"
            >
              CANCELAR
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 font-black"
              onClick={handleSendToWorkshop}
              disabled={!justification}
            >
              ENVIAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
