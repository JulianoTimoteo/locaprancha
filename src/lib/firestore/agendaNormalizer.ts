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
  // Prioriza o campo 'frota' e 'numero' para evitar pegar o ID Hash do documento em equipamentoId/pranchaId
  frota: ["frota", "numero", "numeroPrancha", "frotaCodigo", "pranchaId", "equipamentoId"],
  status: ["status", "situacao", "state"],
};

/**
 * Verifica se uma string é um ID do tipo Hash gerado pelo Firestore (ex: NDzxazexT2pwkzJLGVef)
 */
export function isFirestoreHash(val: string): boolean {
  if (!val) return false;
  // Hashes do Firebase possuem exatamente 20 caracteres alfanuméricos e misturam maiúsculas/minúsculas sem traços/espaços
  return val.length === 20 && /^[a-zA-Z0-9]{20}$/.test(val);
}

/**
 * Resolve um valor baseado em múltiplos campos possíveis, ignorando hashes quando se espera um número legível
 */
function resolveValue(data: any, fields: string[], fallback: string = ""): string {
  if (!data) return fallback;

  for (const field of fields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      const val = data[field];

      // Tratamento para objetos Timestamp do Firestore
      if (val && typeof val === "object" && "seconds" in val) {
        try {
          const seconds = (val as any).seconds;
          const date = new Date(seconds * 1000);
          const parts = date.toISOString().split("T");
          if (parts[0]) return parts[0];
        } catch (e) {
          // ignore erro e tenta próximo
        }
      }

      const s = String(data[field]).trim();

      // Se não for uma string vazia e não for um ID Hash do Firestore, retorna o valor legível
      if (s && !isFirestoreHash(s)) {
        return s;
      }
    }
  }

  return fallback;
}

/**
 * Normaliza o status da agenda (Instrução 14)
 */
export function normalizeReservaStatus(rawStatus: any): AgendaStatus {
  if (!rawStatus) return "Pendente";
  const s = normalizeString(rawStatus).toUpperCase();

  // Mapeamento de status legados
  if (s.includes("PEND")) return "Pendente";
  if (s.includes("AGEN")) return "Agendado";
  if (s.includes("APROV") || s.includes("CONFIRM") || s === "ALOCADO") return "Aprovado";
  if (s.includes("INIC") || s === "EM OPERAÇÃO" || s === "EM_ANDAMENTO" || s === "EM OPERACAO")
    return "Iniciado";
  if (s.includes("TRÂN") || s.includes("TRAN") || s.includes("ANDAM") || s === "VIAGEM")
    return "Em Trânsito";
  if (s.includes("FINAL") || s === "CONCLUÍDO" || s === "CONCLUIDO") return "Finalizado";
  if (s.includes("CONCLU")) return "Concluído";
  if (s.includes("RECUS")) return "Recusado";
  if (s.includes("CANC")) return "Cancelado";

  return "Pendente";
}

/**
 * Normaliza um registro da Agenda (Instrução 5)
 * CENTRALIZA toda a lógica de leitura do Firestore para a Agenda
 */
export function normalizeAgendaRecord(id: string, data: any): Reserva {
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

  // Resolve o número legível da frota (Ex: "31221") ignorando hashes
  const frotaNumeroLegivel = resolveValue(data, FIELD_MAPPINGS.frota, "N/A");

  // Resolve a frente de trabalho ignorando IDs hash (Ex: "SUL DE ENGENHO")
  const frenteLegivel = resolveValue(
    data,
    ["frenteTrabalho", "frente", "frenteNome", "frenteId"],
    "Não informada",
  );

  return {
    id: id,
    tipoOperacao: data?.tipoOperacao || (data?.locacaoDireta ? "LOCACAO_DIRETA" : "SOLICITACAO"),
    status: normalizeReservaStatus(data?.status || data?.situacao),

    // Identidade
    usuarioId: data?.userId || solicitanteId || null,
    solicitanteId: solicitanteId,
    solicitanteNome: solicitanteNome,
    solicitante: solicitanteNome,

    // Frota / Equipamento
    pranchaId: frotaNumeroLegivel, // Agora garante o número limpo (Ex: "31221")
    frotaId: frotaNumeroLegivel,
    frotaNumero: frotaNumeroLegivel,
    frota: frotaNumeroLegivel,
    equipamentoId: data?.equipamentoId || data?.equipamento || null,
    equipamentoNome: normalizeString(
      data?.equipamentoNome || data?.equipamento || data?.nomeEquipamento,
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
    frenteId: frenteLegivel,
    frenteTrabalho: frenteLegivel,

    // Operação
    motoristaId: data?.motoristaId || null,
    motoristaNome: normalizeString(data?.motoristaNome || data?.motorista, "Não informado"),

    horarioInicioReal: data?.horarioInicioReal || data?.iniciadoEm || null,
    horarioFimReal: data?.horarioFimReal || data?.finalizadoEm || null,
    iniciadoEm: data?.iniciadoEm || data?.horarioInicioReal || null,
    iniciadoPor: data?.iniciadoPor || null,
    finalizadoEm: data?.finalizadoEm || data?.horarioFimReal || null,
    finalizadoPor: data?.finalizadoPor || null,

    observacao: normalizeString(data?.observacao || data?.obs || data?.justificativa, "Nenhuma"),
    relatorio: data?.relatorio || null,
    motivoRecusa: normalizeString(data?.motivoRecusa || data?.justificativaRecusa),
    createdAt: data?.createdAt || null,
    testeSistema: !!data?.testeSistema || !!data?.testeE2E,
  };
}
