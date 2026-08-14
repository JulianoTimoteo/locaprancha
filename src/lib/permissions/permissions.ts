import { UserRole, UserProfile } from "@/types";

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, string[]> = {
  GOD: [
    "dashboard",
    "reservas",
    "pranchas",
    "equipamentos",
    "frentes",
    "relatorios",
    "analise-coa",
    "usuarios",
    "auditoria",
  ],
  ADMINISTRADOR: [
    "dashboard",
    "reservas",
    "pranchas",
    "equipamentos",
    "frentes",
    "relatorios",
    "analise-coa",
    "usuarios",
  ],
  LIDER: ["dashboard", "reservas", "pranchas", "equipamentos", "frentes", "relatorios"],
  SOLICITANTE: ["dashboard", "reservas"],
  MOTORISTA: ["dashboard", "reservas"],
};

export const ROLE_PERMISSIONS = DEFAULT_PERMISSIONS_BY_ROLE;

export function hasPermission(profile: UserProfile | null, permissionId: string): boolean {
  if (!profile) return false;
  if (profile.status === "BLOQUEADO") return false;

  if (isGod(profile)) return true;

  if (profile.permissions && profile.permissions.length > 0 && Array.isArray(profile.permissions)) {
    return profile.permissions.includes(permissionId);
  }

  const allowedTabs = DEFAULT_PERMISSIONS_BY_ROLE[profile.role] || [];
  return allowedTabs.includes(permissionId);
}

export function canAccessTab(profile: UserProfile | null, tabId: string): boolean {
  return hasPermission(profile, tabId);
}

export function isGod(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === "GOD" && profile.status === "ATIVO";
}

export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (profile.role === "GOD" || profile.role === "ADMINISTRADOR") && profile.status === "ATIVO";
}

export function canManageUsers(profile: UserProfile | null): boolean {
  return isAdmin(profile);
}

export function canManageFleet(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return isAdmin(profile) || profile.role === "LIDER";
}

export function canAccessDeveloper(profile: UserProfile | null): boolean {
  return isGod(profile);
}

export function isActive(profile: UserProfile | null): boolean {
  return profile?.status === "ATIVO";
}
