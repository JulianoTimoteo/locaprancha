import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { toast } from "sonner";
import { Search, X } from "lucide-react";

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
    equipamentoManual: "",
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

  // Detecta "OUTROS" pelo NOME da frente selecionada (não pelo ID), pois pode
  // existir uma frente "OUTROS" já cadastrada no Firestore com um ID próprio,
  // diferente da string literal "OUTROS".
  const isOutros = React.useMemo(() => {
    if (formData.frenteId === "OUTROS") return true;
    const frenteSelecionada = frentes.find((f) => f.id === formData.frenteId);
    return frenteSelecionada?.nome?.trim().toUpperCase() === "OUTROS";
  }, [formData.frenteId, frentes]);

  // Só adiciona o item "OUTROS" manualmente na lista se ainda não existir
  // uma frente com esse nome cadastrada no banco (evita item duplicado).
  const temOutrosCadastrado = React.useMemo(
    () => frentes.some((f) => f.nome?.trim().toUpperCase() === "OUTROS"),
    [frentes],
  );

  // Filtra apenas pranchas sem operação ativa no momento
  // (exclui ALOCADO/EM_USO/EM OPERAÇÃO/OFICINA; inclui sem status ou DISPONÍVEL)
  const pranchasDisponiveis = React.useMemo(
    () =>
      pranchas.filter((p) => {
        const status = String(p.status || "")
          .trim()
          .toUpperCase();
        if (!status) return true;
        return status === "DISPONÍVEL" || status === "DISPONIVEL";
      }),
    [pranchas],
  );

  const [buscaEquipamento, setBuscaEquipamento] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se o usuário clicar fora do campo
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca em TODOS os equipamentos cadastrados da empresa (sem vínculo restritivo com Frente)
  const equipamentosFiltradosPorBusca = useMemo(() => {
    const termo = buscaEquipamento.trim().toLowerCase();
    if (!termo) return equipamentos;
    return equipamentos.filter((e) => {
      const cod = (e.codigo || "").toLowerCase();
      const nome = (e.nome || "").toLowerCase();
      const tipo = (e.tipo || "").toLowerCase();
      return cod.includes(termo) || nome.includes(termo) || tipo.includes(termo);
    });
  }, [equipamentos, buscaEquipamento]);

  // Identifica se o equipamento selecionado ou digitado pertence à frota cadastrada
  const equipamentoCadastrado = useMemo(() => {
    if (formData.equipamentoId) {
      const found = equipamentos.find((e) => e.id === formData.equipamentoId);
      if (found) return found;
    }
    const termo = buscaEquipamento.trim().toLowerCase();
    if (!termo) return null;
    return (
      equipamentos.find(
        (e) =>
          (e.codigo && e.codigo.trim().toLowerCase() === termo) ||
          `[${e.codigo}] - ${e.nome}`.toLowerCase() === termo,
      ) || null
    );
  }, [formData.equipamentoId, buscaEquipamento, equipamentos]);

  const isEquipamentoCadastrado = Boolean(equipamentoCadastrado);

  // Se o equipamento não tem cadastro (terceirizado) E a frente for OUTROS, as observações são obrigatórias
  const isObservacaoObrigatoria = isOutros && !isEquipamentoCadastrado;

  const [submitting, setSubmitting] = useState(false);

  // Sync with initialData (e.g. from Fleet screen)
  useEffect(() => {
    if (open) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      let initTexto = "";
      if (initialData?.equipamentoId) {
        const eq = equipamentos.find((e) => e.id === initialData.equipamentoId);
        if (eq) initTexto = `[${eq.codigo}] - ${eq.nome}`;
      } else if (initialData?.equipamentoNome) {
        initTexto = initialData.equipamentoNome;
      } else if (initialData?.equipamentoManual) {
        initTexto = initialData.equipamentoManual;
      }

      setBuscaEquipamento(initTexto);
      setIsDropdownOpen(false);

      setFormData((prev) => ({
        ...prev,
        data: today,
        hora: currentTime,
        horarioRetirada: currentTime,
        pranchaId: initialData?.pranchaId || "",
        equipamentoId: initialData?.equipamentoId || "",
        equipamentoManual: initialData?.equipamentoManual || initTexto,
        ...initialData,
      }));
    } else {
      setIsDropdownOpen(false);
    }
  }, [open, initialData, equipamentos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pranchaId) {
      toast.error("Selecione a prancha.");
      return;
    }

    if (!formData.frenteId) {
      toast.error("Selecione a frente operacional.");
      return;
    }

    const nomeEquipamentoFinal = equipamentoCadastrado
      ? `[${equipamentoCadastrado.codigo}] - ${equipamentoCadastrado.nome}`
      : buscaEquipamento.trim() || formData.equipamentoManual.trim();

    if (!nomeEquipamentoFinal) {
      toast.error("Informe a frota ou o equipamento.");
      return;
    }

    if (isObservacaoObrigatoria && !formData.observacao.trim()) {
      toast.error(
        "Obrigatório: descreva o equipamento/motivo nas Observações (equipamento fora da frota cadastrada na frente OUTROS)."
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        equipamentoId: equipamentoCadastrado ? equipamentoCadastrado.id : null,
        equipamentoNome: nomeEquipamentoFinal,
        equipamentoManual: equipamentoCadastrado ? "" : nomeEquipamentoFinal,
        frenteTrabalho: formData.frenteTrabalho || formData.frenteId,
        hora: formData.horarioRetirada,
        solicitante: "",
      };

      if (isAlocacaoDireta && alocarDireto) {
        await alocarDireto(payload);
      } else {
        await addReserva(payload);
      }

      onOpenChange(false);
      setBuscaEquipamento("");
      setIsDropdownOpen(false);
      setFormData({
        pranchaId: "",
        frenteId: "",
        equipamentoId: "",
        equipamentoManual: "",
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
                  {pranchasDisponiveis.map((p) => (
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
            <div className="space-y-2 relative" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase text-[10px] text-muted-foreground">
                  Equipamento / Frota *
                </label>
                {buscaEquipamento && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isEquipamentoCadastrado
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {isEquipamentoCadastrado ? "Frota Cadastrada" : "Terceirizado / Avulso"}
                  </span>
                )}
              </div>

              <div className="relative">
                <Input
                  value={buscaEquipamento}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBuscaEquipamento(val);
                    setFormData((prev) => ({
                      ...prev,
                      equipamentoId: "",
                      equipamentoManual: val,
                    }));
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Digite a frota/equipamento (texto ou número)"
                  className="font-bold pr-8"
                  required
                />
                {buscaEquipamento ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBuscaEquipamento("");
                      setFormData((prev) => ({
                        ...prev,
                        equipamentoId: "",
                        equipamentoManual: "",
                      }));
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                    title="Limpar equipamento"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 pointer-events-none" />
                )}
              </div>

              {/* Dropdown com a lista de todos os equipamentos cadastrados */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
                  {equipamentosFiltradosPorBusca.length > 0 ? (
                    equipamentosFiltradosPorBusca.map((eq) => (
                      <div
                        key={eq.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData((prev) => ({
                            ...prev,
                            equipamentoId: eq.id,
                            equipamentoManual: "",
                          }));
                          setBuscaEquipamento(`[${eq.codigo}] - ${eq.nome}`);
                          setIsDropdownOpen(false);
                        }}
                        className="flex flex-col p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded text-left transition-colors"
                      >
                        <span className="font-bold text-sm">
                          [{eq.codigo}] - {eq.nome}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {eq.tipo || "Frota Geral"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      <p className="font-semibold text-foreground">
                        Nenhum equipamento cadastrado para &quot;{buscaEquipamento}&quot;
                      </p>
                      <p className="mt-1 text-[11px]">
                        Será considerado <strong>Equipamento Terceirizado / Não cadastrado</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase text-[10px] text-muted-foreground">
                Frente Operacional *
              </label>
              <Select
                value={formData.frenteId}
                onValueChange={(val) => {
                  const frente = frentes.find((f) => f.id === val);
                  setFormData((prev) => ({
                    ...prev,
                    frenteId: val,
                    frenteTrabalho: frente?.nome || val,
                  }));
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
                  {!temOutrosCadastrado && <SelectItem value="OUTROS">OUTROS</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Observações{" "}
                {isObservacaoObrigatoria && <span className="text-destructive font-bold">*</span>}
              </label>
              {isObservacaoObrigatoria && (
                <span className="text-[10px] text-destructive font-semibold">
                  Obrigatório para equipamento terceirizado na frente OUTROS
                </span>
              )}
            </div>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder={
                isObservacaoObrigatoria
                  ? "Obrigatório: descreva o equipamento/motivo (fora da frota cadastrada)"
                  : "Informações adicionais..."
              }
              required={isObservacaoObrigatoria}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenChange(false);
              }}
            >
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
