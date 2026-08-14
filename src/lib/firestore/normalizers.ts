import {
  UserRole,
  UserProfile,
  Frota,
  Equipamento,
  Frente,
  AgendaStatus,
  Reserva,
  AuditLog,
  StatusFrota,
} from "@/types";

/**
 * Normaliza o Role do usuário para garantir que seja um valor válido do enum UserRole
 */
export function normalizeUserRole(role: unknown): UserRole {
  const validRoles: UserRole[] = ["GOD", "ADMINISTRADOR", "LIDER", "MOTORISTA", "SOLICITANTE"];
  if (validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  return "SOLICITANTE";
}

/**
 * Normaliza uma string garantindo que nunca seja nula
 */
export function normalizeString(val: unknown, fallback: string = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

/**
 * Normaliza o status da frota
 */
export function normalizeFrotaStatus(status: unknown): StatusFrota {
  const s = normalizeString(status).toUpperCase();
  if (s.includes("DISP")) return "DISPONÍVEL";
  if (s.includes("ALOC") || s.includes("OCUP")) return "ALOCADO";
  if (s.includes("MANU") || s.includes("OFIC")) return "OFICINA";
  return "DISPONÍVEL";
}

/**
 * Normaliza um documento de Frota
 */
export function normalizeFrota(id: string, data: Record<string, any>): Frota {
  return {
    id,
    frota: data.frota || data.numero || id,
    placa: data.placa || "",
    marca: data.marca || "",
    modelo: data.modelo || "",
    nome: data.nome || "",
    tipo: data.tipo || "",
    status: normalizeFrotaStatus(data.status),
    justificativaManutencao: data.justificativaManutencao || "",
    createdAt: data.createdAt || null,
    createdBy: data.createdBy || "",
    updatedAt: data.updatedAt || null,
    updatedBy: data.updatedBy || "",
  };
}

/**
 * Normaliza um documento de Reserva vindo do Firestore
 */
export function normalizeReserva(id: string, data: Record<string, any>): Reserva {
  return {
    id,
    tipoOperacao: data.tipoOperacao || "SOLICITACAO",
    status: data.status || "Pendente",
    solicitanteId: data.solicitanteId || null,
    solicitanteNome: data.solicitanteNome || "",
    solicitante: data.solicitante || data.solicitanteNome || "",
    pranchaId: data.pranchaId || "",
    frotaId: data.frotaId || null,
    frotaNumero: data.frotaNumero || null,
    equipamentoId: data.equipamentoId || null,
    equipamentoNome: data.equipamentoNome || "",
    data: data.data || "",
    hora: data.hora || "",
    horarioRetirada: data.horarioRetirada || "",
    horarioDevolucaoPrevisto: data.horarioDevolucaoPrevisto || "",
    origem: data.origem || "",
    destino: data.destino || "",
    frenteId: data.frenteId || "",
    frenteTrabalho: data.frenteTrabalho || "",
    motoristaId: data.motoristaId || null,
    motoristaNome: data.motoristaNome || "",
    horarioInicioReal: data.horarioInicioReal || null,
    horarioFimReal: data.horarioFimReal || null,
    observacao: data.observacao || "",
    motivoRecusa: data.motivoRecusa || "",
    createdAt: data.createdAt || null,
    relatorio: data.relatorio || null,
  };
}

/**
 * Normaliza um documento de Usuário
 */
export function normalizeUserProfile(id: string, data: Record<string, any>): UserProfile {
  return {
    uid: id,
    name: data.name || data.displayName || "",
    nickname: data.nickname || "",
    email: data.email || "",
    emailTipo: data.emailTipo || "REAL",
    role: normalizeUserRole(data.role),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    status: data.status || "ATIVO",
    criadoEm: data.criadoEm || data.createdAt || null,
    atualizadoEm: data.atualizadoEm || data.updatedAt || null,
    ultimoAcesso: data.ultimoAcesso || null,
  };
}

/**
 * Normaliza um documento de Equipamento
 */
export function normalizeEquipamento(id: string, data: Record<string, any>): Equipamento {
  return {
    id,
    nome: data.nome || "",
    codigo: data.codigo || "",
    tipo: data.tipo || "",
    status: data.status || "DISPONÍVEL",
    frenteId: data.frenteId || "",
  };
}

/**
 * Normaliza um documento de Frente
 */
export function normalizeFrente(id: string, data: Record<string, any>): Frente {
  return {
    id,
    nome: data.nome || "",
    codigo: data.codigo || "",
    responsavel: data.responsavel || "",
    status: data.status || "ATIVA",
  };
}
