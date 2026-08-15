import { Reserva, AgendaStatus } from "@/types";
import { normalizeString } from "./normalizers";

/**
 * Mapeamentos de campos para compatibilidade legada (Instrução 17)
 */
const FIELD_MAPPINGS = {
  data: ["data", "dataAgendamento", "date", "scheduledDate", "createdAt"],
  hora: ["hora", "horario", "horaInicio", "startTime", "horarioRetirada"],
  origem: ["origem", "localOrigem", "origin"],
  destino: ["destino", "localDestino", "destination"],
  equipamento: ["equipamentoId", "pranchaId", "frota", "numero", "prancha"],
  status: ["status", "situacao", "state"],
};

/**
 * Resolve um valor baseado em múltiplos campos possíveis (compatibilidade legada)
 */
function resolveValue(data: Record<string, unknown>, fields: string[], fallback: string = ""): string {
  for (const field of fields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      const val = data[field];
      if (val && typeof val === "object" && "seconds" in val) {
        try {
          const seconds = (val as { seconds: number }).seconds;
          const date = new Date(seconds * 1000);
          const parts = date.toISOString().split("T");
          if (parts[0]) return parts[0];
        } catch (e) {
          // ignore error and try next
        }
      }
      const s = String(data[field]);
      if (s) return s;
    }
  }
  return fallback;
}

/**
 * Normaliza o status da agenda (Instrução 14)
 */
export function normalizeReservaStatus(rawStatus: unknown): AgendaStatus {
  if (!rawStatus) return "Pendente";
  const s = normalizeString(rawStatus).toUpperCase();

  // Mapeamento de status legados
  if (s.includes("PEND")) return "Pendente";
  if (s.includes("AGEN")) return "Agendado";
  if (s.includes("APROV") || s.includes("CONFIRM") || s === "ALOCADO") return "Aprovado";
  if (s.includes("INIC") || s === "EM OPERAÇÃO" || s === "EM_ANDAMENTO") return "Iniciado";
  if (s.includes("TRÂN") || s.includes("ANDAM") || s === "VIAGEM") return "Em Trânsito";
  if (s.includes("FINAL") || s === "CONCLUÍDO") return "Finalizado";
  if (s.includes("CONCLU")) return "Concluído";
  if (s.includes("RECUS")) return "Recusado";
  if (s.includes("CANC")) return "Cancelado";

  return "Pendente";
}

/**
 * Normaliza um registro da Agenda (Instrução 5)
 * CENTRALIZA toda a lógica de leitura do Firestore para a Agenda
 */
export function normalizeAgendaRecord(id: string, data: Record<string, unknown>): Reserva {
  const solicitanteId = data?.solicitanteId || data?.userId || data?.criadoPor || null;
  const solicitanteNome = normalizeString(
    data?.solicitanteNome || data?.solicitante || data?.userName || data?.usuario,
    "Não informado",
  );

  // Resolução de campos principais com fallbacks legados (Instrução 19)
  const dataVal = resolveValue(data, FIELD_MAPPINGS.data, "N/A");
  const horaVal = resolveValue(data, FIELD_MAPPINGS.hora, "");
  const origemVal = resolveValue(data, FIELD_MAPPINGS.origem, "Não informado");
  const destinoVal = resolveValue(data, FIELD_MAPPINGS.destino, "Não informado");
  const equipamentoId = resolveValue(data, FIELD_MAPPINGS.equipamento, "N/A");

  return {
    id: id,
    tipoOperacao: (data?.tipoOperacao as Reserva["tipoOperacao"]) || (data?.locacaoDireta ? "LOCACAO_DIRETA" : "SOLICITACAO"),
    status: normalizeReservaStatus(data?.status || data?.situacao),

    // Identidade
    usuarioId: (data?.userId as string) || (solicitanteId as string) || null,
    solicitanteId: solicitanteId as string | null,
    solicitanteNome: solicitanteNome,
    solicitante: solicitanteNome,

    // Frota / Equipamento
    pranchaId: equipamentoId,
    frotaId: equipamentoId,
    frotaNumero: equipamentoId,
    equipamentoId: (data?.equipamentoId as string) || (data?.equipamento as string) || null,
    equipamentoNome: normalizeString(
      data?.equipamentoNome || data?.equipamento,
      "Aguardando definição",
    ),

    // Logística
    data: dataVal,
    hora: horaVal,
    horarioRetirada: horaVal,
    horarioDevolucaoPrevisto: normalizeString(
      data?.horarioDevolucaoPrevisto || data?.previsaoRetorno || data?.horaFim,
      "Não informado",
    ),

    origem: origemVal,
    destino: destinoVal,
    frenteId: normalizeString(
      data?.frenteId || data?.frenteTrabalho || data?.frente,
      "Não informada",
    ),
    frenteTrabalho: normalizeString(
      data?.frenteTrabalho || data?.frenteId || data?.frente,
      "Não informada",
    ),

    // Operação
    motoristaId: (data?.motoristaId as string) || null,
    motoristaNome: normalizeString(data?.motoristaNome || data?.motorista, "Não informado"),

    horarioInicioReal: (data?.horarioInicioReal as Timestamp) || (data?.iniciadoEm as Timestamp) || null,
    horarioFimReal: (data?.horarioFimReal as Timestamp) || (data?.finalizadoEm as Timestamp) || null,
    iniciadoEm: (data?.iniciadoEm as Timestamp) || (data?.horarioInicioReal as Timestamp) || null,
    iniciadoPor: (data?.iniciadoPor as string) || null,
    finalizadoEm: (data?.finalizadoEm as Timestamp) || (data?.horarioFimReal as Timestamp) || null,
    finalizadoPor: (data?.finalizadoPor as string) || null,

    observacao: normalizeString(data?.observacao || data?.obs || data?.justificativa, "Nenhuma"),
    relatorio: (data?.relatorio as string) || null,
    motivoRecusa: normalizeString(data?.motivoRecusa || data?.justificativaRecusa),
    createdAt: (data?.createdAt as Timestamp) || null,
    testeSistema: !!data?.testeSistema || !!data?.testeE2E,
  };
}
