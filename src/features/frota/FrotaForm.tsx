import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Frota } from "@/types";
import { useFleet } from "./useFleet";
import { toast } from "sonner";
import { Truck } from "lucide-react";

interface FrotaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frotaToEdit?: Frota | null;
}

export function FrotaForm({ open, onOpenChange, frotaToEdit }: FrotaFormProps) {
  const { addFrota, updateFrota } = useFleet();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    frota: "",
    placa: "",
    marca: "",
    modelo: "",
    nome: "",
    tipo: "",
  });

  useEffect(() => {
    if (frotaToEdit) {
      setFormData({
        frota: frotaToEdit.frota,
        placa: frotaToEdit.placa,
        marca: frotaToEdit.marca,
        modelo: frotaToEdit.modelo,
        nome: frotaToEdit.nome,
        tipo: frotaToEdit.tipo,
      });
    } else {
      setFormData({
        frota: "",
        placa: "",
        marca: "",
        modelo: "",
        nome: "",
        tipo: "",
      });
    }
  }, [frotaToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.frota ||
      !formData.placa ||
      !formData.marca ||
      !formData.modelo ||
      !formData.nome
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios (*)");
      return;
    }

    setLoading(true);
    try {
      if (frotaToEdit) {
        // Edição: NÃO envia status — o status operacional é controlado
        // automaticamente pelo sistema (DISPONÍVEL/ALOCADO/OFICINA).
        await updateFrota(frotaToEdit.id, formData);
      } else {
        // Cadastro: toda frota nova nasce DISPONÍVEL (status automático).
        await addFrota({ ...formData, status: "DISPONÍVEL" });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Truck size={24} />
            {frotaToEdit ? "Editar Frota" : "Adicionar Frota"}
          </DialogTitle>
          <DialogDescription className="font-medium">
            Preencha os dados operacionais do equipamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Frota *
              </label>
              <Input
                placeholder="31220"
                value={formData.frota}
                onChange={(e) => setFormData({ ...formData, frota: e.target.value })}
                className="font-bold"
              />
              <p className="text-[9px] text-muted-foreground font-medium italic">
                Número operacional utilizado pela empresa.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Placa *
              </label>
              <Input
                placeholder="CRM9D99"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                className="font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Marca *
              </label>
              <Input
                placeholder="VOLVO"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Modelo *
              </label>
              <Input
                placeholder="FM 540 6X4T"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Nome do Equipamento *
            </label>
            <Input
              placeholder="FM 540 6X4T VOLVO"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Tipo/Frota (Tipo da Frota)
            </label>
            <Input
              placeholder="31220"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="font-medium"
            />
            <p className="text-[9px] text-muted-foreground font-medium italic">
              O status operacional (DISPONÍVEL / ALOCADO / OFICINA) é controlado automaticamente
              pelo sistema.
            </p>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-bold"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-black tracking-widest shadow-lg shadow-primary/20"
            >
              {loading ? "SALVANDO..." : "SALVAR FROTA"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
