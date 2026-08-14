import React, { useState } from "react";
import { useEquipamentos } from "./useEquipamentos";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, Truck, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Equipamento } from "@/types";
import { useFrentes } from "@/features/frentes/useFrentes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EquipamentoList() {
  const {
    equipamentos,
    loading,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    seedEquipamentos,
  } = useEquipamentos();
  const { frentes } = useFrentes();
  const { profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Equipamento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "",
    status: "DISPONÍVEL" as any,
    frenteId: "",
  });

  const isAdmin = profile?.role === "GOD" || profile?.role === "ADMINISTRADOR";

  const handleOpenForm = (item?: Equipamento) => {
    if (item) {
      setItemToEdit(item);
      setFormData({
        codigo: item.codigo,
        nome: item.nome,
        tipo: item.tipo,
        status: item.status,
        frenteId: item.frenteId || "",
      });
    } else {
      setItemToEdit(null);
      setFormData({ codigo: "", nome: "", tipo: "", status: "DISPONÍVEL", frenteId: "" });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.codigo) return;

    let success = false;
    if (itemToEdit) {
      success = !!(await updateEquipamento(itemToEdit.id, formData));
    } else {
      const newId = await addEquipamento(formData);
      success = !!newId;
    }

    if (success) {
      setIsFormOpen(false);
    }
  };

  const filtered = equipamentos.filter(
    (e) =>
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tipo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="p-8 text-center font-bold animate-pulse text-primary uppercase">
        Carregando equipamentos...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" id="page-title">
              Equipamentos
            </h1>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
                  >
                    <Info className="w-4 h-4 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-4 bg-card border-2 border-primary/20 shadow-xl">
                  <div className="space-y-3">
                    <p className="font-black text-[10px] uppercase tracking-widest text-primary border-b pb-1">
                      Legenda Operacional
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-600 uppercase">Disponível:</span>
                          <p className="text-muted-foreground leading-tight">
                            Equipamento livre para ser alocado ou engatado.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-600 uppercase">
                            Em Uso / Ocupado:
                          </span>
                          <p className="text-muted-foreground leading-tight">
                            Equipamento em atividade ou vinculado a uma frente.
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <p className="text-[10px] italic text-muted-foreground font-medium">
                          Use os botões "Ocupar" e "Liberar" para atualizar o status em tempo real.
                        </p>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm">
            Gerenciamento de máquinas e ativos operacionais.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => seedEquipamentos()}
                className="flex-1 sm:flex-initial gap-2 font-bold tracking-widest uppercase border-primary/20 hover:bg-primary/5"
              >
                Importar Iniciais
              </Button>
              <Button
                onClick={() => handleOpenForm()}
                className="flex-1 sm:flex-initial gap-2 font-black tracking-widest shadow-lg shadow-primary/20 uppercase"
              >
                <Plus size={18} /> Novo
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <h2 className="sr-only">Filtros de Equipamentos</h2>
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar equipamento..."
            className="pl-10 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar equipamentos"
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black text-xs uppercase w-[120px]">Código</TableHead>
              <TableHead className="font-black text-xs uppercase">Descrição</TableHead>
              <TableHead className="font-black text-xs uppercase">Grupo / Frente</TableHead>
              <TableHead className="font-black text-xs uppercase w-[150px]">Status</TableHead>
              <TableHead className="font-black text-xs uppercase text-right w-[150px]">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="font-black text-primary uppercase">{item.codigo}</TableCell>
                <TableCell className="font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  {item.nome}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  <div className="flex flex-col">
                    <span>{item.tipo}</span>
                    {item.frenteId && (
                      <span className="text-[10px] text-muted-foreground font-black uppercase">
                        {frentes.find((f) => f.id === item.frenteId)?.nome || item.frenteId}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "DISPONÍVEL" ? "default" : "secondary"}
                    className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === "DISPONÍVEL" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 font-black text-[10px] uppercase gap-1 ${
                        item.status === "DISPONÍVEL"
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      }`}
                      onClick={() => {
                        const newStatus = item.status === "DISPONÍVEL" ? "EM_USO" : "DISPONÍVEL";
                        updateEquipamento(item.id, { status: newStatus as any });
                      }}
                    >
                      {item.status === "DISPONÍVEL" ? "Ocupar" : "Liberar"}
                    </Button>

                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenForm(item)}
                        >
                          <Edit2 size={16} />
                          <span className="sr-only">Editar equipamento {item.codigo}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Excluir equipamento?")) deleteEquipamento(item.id);
                          }}
                          aria-label={`Excluir equipamento ${item.codigo}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-40 text-center text-muted-foreground font-medium italic"
                >
                  Nenhum equipamento cadastrado ou encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
              {itemToEdit ? "Editar Equipamento" : "Novo Equipamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Código *
              </label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: 11116"
                className="font-black uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Descrição / Nome *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: TRATOR NEW HOLLAND T7 245"
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Grupo (Tipo)
              </label>
              <Input
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: BIOMASSA"
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Frente Vinculada
              </label>
              <Select
                value={formData.frenteId}
                onValueChange={(val) => setFormData({ ...formData, frenteId: val })}
              >
                <SelectTrigger className="font-medium">
                  <SelectValue placeholder="Selecione uma frente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {frentes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="font-bold uppercase"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-black tracking-widest uppercase">
              {itemToEdit ? "ATUALIZAR" : "SALVAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
