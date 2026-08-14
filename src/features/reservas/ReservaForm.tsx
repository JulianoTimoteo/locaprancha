import React, { useState } from "react";
import { useReservas } from "./useReservas";
import { useFleet } from "@/features/frota/useFleet";

import { useFrentes } from "@/features/frentes/useFrentes";
import { useEquipamentos } from "@/features/equipamentos/useEquipamentos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReservaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAlocacaoDireta?: boolean;
  initialData?: any;
}

export function ReservaForm({
  open,
  onOpenChange,
  isAlocacaoDireta = false,
  initialData,
}: ReservaFormProps) {
  const { addReserva, alocarDireto } = useReservas();
  const { pranchas } = useFleet();

  const { frentes } = useFrentes();
  const { equipamentos } = useEquipamentos();

  const [formData, setFormData] = useState({
    pranchaId: "",
    frenteId: "",
    equipamentoId: "",
    data: new Date().toISOString().split("T")[0] as string,
    horarioRetirada: "08:00",
    horarioDevolucaoPrevisto: "17:00",
    observacao: "",
    motoristaId: "",
    motoristaNome: "",
    origem: "",
    destino: "",
    frenteTrabalho: "",
    hora: "08:00",
    solicitanteNome: "",
    horarioInicioReal: null,
    horarioFimReal: null,
    relatorio: null,
    motivoRecusa: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Sync with initialData (e.g. from Fleet screen)
  React.useEffect(() => {
    if (open) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      setFormData((prev) => ({
        ...prev,
        data: today,
        hora: currentTime,
        horarioRetirada: currentTime,
        pranchaId: initialData?.pranchaId || "",
        ...initialData,
      }));
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pranchaId || !formData.frenteId) return;

    setSubmitting(true);
    try {
      const eq = equipamentos.find((e) => e.id === formData.equipamentoId);
      const payload = {
        ...formData,
        equipamentoNome: eq ? `[${eq.codigo}] - ${eq.nome}` : "",
        frenteTrabalho: formData.frenteTrabalho || formData.frenteId,
        hora: formData.horarioRetirada,
        solicitante: "", // Will be populated by the hook
      };

      if (isAlocacaoDireta && alocarDireto) {
        await alocarDireto(payload);
      } else {
        // @ts-expect-error payload type mismatch between addReserva and alocarDireto
        await addReserva(payload);
      }

      onOpenChange(false);
      setFormData({
        pranchaId: "",
        frenteId: "",
        equipamentoId: "",
        data: new Date().toISOString().split("T")[0] as string,
        horarioRetirada: "08:00",
        horarioDevolucaoPrevisto: "17:00",
        observacao: "",
        motoristaId: "",
        motoristaNome: "",
        origem: "",
        destino: "",
        frenteTrabalho: "",
        hora: "08:00",
        solicitanteNome: "",
        horarioInicioReal: null,
        horarioFimReal: null,
        relatorio: null,
        motivoRecusa: "",
      });
    } catch (error) {
      // toast already shown in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAlocacaoDireta ? "🛣️ Nova Locação Direta" : "📅 Novo Agendamento Administrativo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prancha</label>
              <Select
                value={formData.pranchaId}
                onValueChange={(val) => setFormData({ ...formData, pranchaId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>

                <SelectContent>
                  {pranchas
                    .filter((p) => {
                      const status = String(p.status || "")
                        .trim()
                        .toUpperCase();
                      if (isAlocacaoDireta) return status === "DISPONÍVEL";
                      return true;
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.frota}>
                        <div className="flex flex-col text-left">
                          <span className="font-bold">🚚 FROTA {p.frota}</span>
                          <span className="text-[10px] opacity-70">
                            {p.placa} — {p.nome}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Início</label>
              <Input
                type="time"
                value={formData.horarioRetirada}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    horarioRetirada: e.target.value,
                    hora: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fim Previsto</label>
              <Input
                type="time"
                value={formData.horarioDevolucaoPrevisto}
                onChange={(e) =>
                  setFormData({ ...formData, horarioDevolucaoPrevisto: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Origem</label>
              <Input
                placeholder="Local de coleta"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destino</label>
              <Input
                placeholder="Local de entrega"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-[10px] text-muted-foreground">
                Equipamento
              </label>
              <Select
                value={formData.equipamentoId}
                onValueChange={(val) => {
                  const eq = equipamentos.find((e) => e.id === val);
                  if (eq) {
                    const frenteRelacionada = frentes.find(
                      (f) =>
                        f.id === eq.frenteId ||
                        (eq.tipo && f.nome.toUpperCase() === eq.tipo.toUpperCase()) ||
                        (eq.tipo &&
                          eq.tipo.includes("FRENTE") &&
                          f.nome.includes(eq.tipo.split("FRENTE")[1]?.trim() || "")),
                    );

                    setFormData({
                      ...formData,
                      equipamentoId: val,
                      frenteId: frenteRelacionada?.id || formData.frenteId,
                      frenteTrabalho: frenteRelacionada?.nome || formData.frenteTrabalho,
                    });
                  } else {
                    setFormData({ ...formData, equipamentoId: val });
                  }
                }}
              >
                <SelectTrigger className="font-bold">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {equipamentos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-bold">
                          [{e.codigo}] - {e.nome}
                        </span>
                        <span className="text-[10px] opacity-70 uppercase">{e.tipo}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-[10px] text-muted-foreground">
                Frente Operacional
              </label>
              <Select
                value={formData.frenteId}
                onValueChange={(val) => {
                  const frente = frentes.find((f) => f.id === val);
                  setFormData({ ...formData, frenteId: val, frenteTrabalho: frente?.nome || val });
                }}
              >
                <SelectTrigger className="font-bold">
                  <SelectValue placeholder="Responsável/Frente" />
                </SelectTrigger>
                <SelectContent>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Informações adicionais..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={isAlocacaoDireta ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {submitting
                ? isAlocacaoDireta
                  ? "Alocando..."
                  : "Agendando..."
                : isAlocacaoDireta
                  ? "Confirmar Locação"
                  : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
