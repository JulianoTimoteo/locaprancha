import { Frota, StatusFrota, UserProfile, UserRole, Reserva, AgendaStatus } from "@/types";
import { normalizeAgendaRecord, normalizeReservaStatus } from "./agendaNormalizer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" ? value.trim() : fallback;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFrota(id: string, data: any): Frota {
  const frotaNum = normalizeString(data?.frota || data?.tipo || data?.numero, "N/A");
  return {
    id: id,
    frota: frotaNum,
    placa: normalizeString(data?.placa),
    marca: normalizeString(data?.marca),
    modelo: normalizeString(data?.modelo),
    nome: normalizeString(data?.nome, "Informação não cadastrada"),
    tipo: normalizeString(data?.tipo || data?.frota, frotaNum),
    status: normalizeFrotaStatus(data?.status || data?.situacao),
    justificativaManutencao: normalizeString(data?.justificativaManutencao),
    createdAt: data?.createdAt || null,
    createdBy: data?.createdBy || "",
    updatedAt: data?.updatedAt || null,
    updatedBy: data?.updatedBy || "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePrancha(id: string, data: any) {
  const frota = normalizeFrota(id, data);
  return {
    ...frota,
    numero: frota.frota,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFrotaStatus(rawStatus: any): StatusFrota {
  if (!rawStatus) return "DISPONÍVEL";
  const status = normalizeString(rawStatus).toUpperCase();

  if (status.includes("DISPON")) return "DISPONÍVEL";
  if (
    status.includes("ALOCAD") ||
    status.includes("OPER") ||
    status.includes("VIAGEM") ||
    status.includes("TRÂNSITO") ||
    status === "EM VIAGEM"
  )
    return "ALOCADO";
  if (status.includes("OFICINA") || status.includes("MANU")) return "OFICINA";

  return "DISPONÍVEL";
}

export const normalizePranchaStatus = normalizeFrotaStatus;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeUserProfile(uid: string, data: any): UserProfile {
  const email = normalizeString(data?.email);
  const role = normalizeUserRole(data?.role, uid, email, data);

  const permissions = Array.isArray(data?.permissions || data?.permissoes)
    ? data?.permissions || data?.permissoes
    : [];

  return {
    uid: uid,
    name: normalizeString(data?.fullName || data?.name || data?.nome, "Usuário"),
    nickname: normalizeString(data?.nickname),
    email: email,
    emailTipo: data?.emailTipo === "FAKE" ? "FAKE" : "REAL",
    role: role,
    permissions: permissions,
    status: normalizeUserStatus(data?.status),
    criadoEm: data?.criadoEm || data?.createdAt || null,
    atualizadoEm: data?.atualizadoEm || data?.updatedAt || null,
    ultimoAcesso: data?.ultimoAcesso || data?.lastAccess || data?.lastLoginAt || null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUserStatus(rawStatus: any): "ATIVO" | "BLOQUEADO" {
  const status = normalizeString(rawStatus).toUpperCase();
  if (status === "BLOQUEADO" || status === "INATIVO") return "BLOQUEADO";
  return "ATIVO";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUserRole(rawRole: any, uid?: string, email?: string, data?: any): UserRole {
  if (!rawRole) return "SOLICITANTE";

  const role = normalizeString(rawRole).toUpperCase();
  const validRoles: UserRole[] = ["GOD", "ADMINISTRADOR", "LIDER", "MOTORISTA", "SOLICITANTE"];

  if (validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }

  if (role.includes("GOD")) return "GOD";
  if (role.includes("ADMIN")) return "ADMINISTRADOR";
  if (role.includes("SOLICIT")) return "SOLICITANTE";
  if (role.includes("MOTOR")) return "MOTORISTA";
  if (role.includes("LIDER")) return "LIDER";

  return "SOLICITANTE";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeReserva(id: string, data: any): Reserva {
  return normalizeAgendaRecord(id, data);
}

const internalNormalizeReservaStatus = normalizeReservaStatus;
export { internalNormalizeReservaStatus as normalizeReservaStatus };
