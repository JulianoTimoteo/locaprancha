import { AgendaStatus } from "@/types";

/**
 * Define as transições válidas de status para uma reserva/locação
 * (Instrução 21)
 */
export const VALID_TRANSITIONS: Record<AgendaStatus, AgendaStatus[]> = {
  Pendente: ["Aprovado", "Recusado", "Cancelado"],
  Agendado: ["Iniciado", "Cancelado"],
  Aprovado: ["Iniciado", "Cancelado"],
  Iniciado: ["Em Trânsito", "Finalizado", "Concluído"],
  "Em Trânsito": ["Finalizado", "Concluído"],
  Finalizado: [], // Estado final administrativo
  Concluído: [], // Estado final administrativo
  Recusado: [], // Estado final administrativo
  Cancelado: [], // Estado final administrativo
};

/**
 * Verifica se uma transição de status é permitida
 */
export function canTransitionTo(currentStatus: AgendaStatus, nextStatus: AgendaStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}
