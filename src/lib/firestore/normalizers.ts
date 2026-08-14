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
export function normalizeFrota(id: string, data: Record<string, unknown>): Frota {
  return {
    id,
    frota: (data.frota as string) || (data.numero as string) || id,
    placa: (data.placa as string) || "",
    marca: (data.marca as string) || "",
    modelo: (data.modelo as string) || "",
    nome: (data.nome as string) || "",
    tipo: (data.tipo as string) || "",
    status: normalizeFrotaStatus(data.status),
    justificativaManutencao: (data.justificativaManutencao as string) || "",
    createdAt: (data.createdAt as any) || null,
    createdBy: (data.createdBy as string) || "",
    updatedAt: (data.updatedAt as any) || null,
    updatedBy: (data.updatedBy as string) || "",
  };
}

/**
 * Normaliza um documento de Reserva vindo do Firestore
 */
export function normalizeReserva(id: string, data: Record<string, unknown>): Reserva {
  return {
    id,
    tipoOperacao: (data.tipoOperacao as any) || "SOLICITACAO",
    status: (data.status as any) || "Pendente",
    solicitanteId: (data.solicitanteId as string) || null,
    solicitanteNome: (data.solicitanteNome as string) || "",
    solicitante: (data.solicitante as string) || (data.solicitanteNome as string) || "",
    pranchaId: (data.pranchaId as string) || "",
    frotaId: (data.frotaId as string) || null,
    frotaNumero: (data.frotaNumero as string) || null,
    equipamentoId: (data.equipamentoId as string) || null,
    equipamentoNome: (data.equipamentoNome as string) || "",
    data: (data.data as string) || "",
    hora: (data.hora as string) || "",
    horarioRetirada: (data.horarioRetirada as string) || "",
    horarioDevolucaoPrevisto: (data.horarioDevolucaoPrevisto as string) || "",
    origem: (data.origem as string) || "",
    destino: (data.destino as string) || "",
    frenteId: (data.frenteId as string) || "",
    frenteTrabalho: (data.frenteTrabalho as string) || "",
    motoristaId: (data.motoristaId as string) || null,
    motoristaNome: (data.motoristaNome as string) || "",
    horarioInicioReal: (data.horarioInicioReal as any) || null,
    horarioFimReal: (data.horarioFimReal as any) || null,
    observacao: (data.observacao as string) || "",
    motivoRecusa: (data.motivoRecusa as string) || "",
    createdAt: (data.createdAt as any) || null,
    relatorio: (data.relatorio as string) || null,
  };
}

/**
 * Normaliza um documento de Usuário
 */
export function normalizeUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: id,
    name: (data.name as string) || (data.displayName as string) || "",
    nickname: (data.nickname as string) || "",
    email: (data.email as string) || "",
    emailTipo: (data.emailTipo as any) || "REAL",
    role: normalizeUserRole(data.role),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    status: (data.status as any) || "ATIVO",
    criadoEm: (data.criadoEm as any) || (data.createdAt as any) || null,
    atualizadoEm: (data.atualizadoEm as any) || (data.updatedAt as any) || null,
    ultimoAcesso: (data.ultimoAcesso as any) || null,
  };
}

/**
 * Normaliza um documento de Equipamento
 */
export function normalizeEquipamento(id: string, data: Record<string, unknown>): Equipamento {
  return {
    id,
    nome: (data.nome as string) || "",
    codigo: (data.codigo as string) || "",
    tipo: (data.tipo as string) || "",
    status: (data.status as any) || "DISPONÍVEL",
    frenteId: (data.frenteId as string) || "",
  };
}

/**
 * Normaliza um documento de Frente
 */
export function normalizeFrente(id: string, data: Record<string, unknown>): Frente {
  return {
    id,
    nome: (data.nome as string) || "",
    codigo: (data.codigo as string) || "",
    responsavel: (data.responsavel as string) || "",
    status: (data.status as any) || "ATIVA",
  };
}
