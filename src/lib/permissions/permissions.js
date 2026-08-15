/**
 * Matriz de Acesso Centralizada
 * Define quais abas cada perfil pode acessar
 */
export const DEFAULT_PERMISSIONS_BY_ROLE = {
  GOD: ["dashboard", "reservas", "pranchas", "equipamentos", "frentes", "relatorios", "usuarios"],
  ADMINISTRADOR: [
    "dashboard",
    "reservas",
    "pranchas",
    "equipamentos",
    "frentes",
    "relatorios",
    "usuarios",
  ],
  LIDER: ["dashboard", "reservas", "pranchas", "equipamentos", "frentes", "relatorios"],
  SOLICITANTE: ["dashboard", "reservas"],
  MOTORISTA: ["dashboard", "reservas"],
};
/**
 * Matriz de Acesso Centralizada (Legado - Mantido para compatibilidade enquanto migramos)
 */
export const ROLE_PERMISSIONS = DEFAULT_PERMISSIONS_BY_ROLE;
/**
 * Verifica se um usuário possui uma permissão específica
 * Respeita a matriz de roles e permissões individuais
 */
export function hasPermission(profile, permissionId) {
  if (!profile) return false;
  if (profile.status === "BLOQUEADO") return false;
  // GOD tem acesso total a tudo
  if (isGod(profile)) return true;
  // No novo modelo, as permissões são armazenadas no documento.
  // Se o array existir, ele é a fonte da verdade para a autorização operacional.
  if (profile.permissions && Array.isArray(profile.permissions)) {
    return profile.permissions.includes(permissionId);
  }
  // Fallback para permissões padrão se o documento não tiver o array (ex: migração)
  const allowedTabs = DEFAULT_PERMISSIONS_BY_ROLE[profile.role] || [];
  return allowedTabs.includes(permissionId);
}
/**
 * Atalho para verificar acesso a abas do menu
 */
export function canAccessTab(profile, tabId) {
  return hasPermission(profile, tabId);
}
/**
 * Verifica se o usuário tem o perfil GOD
 */
export function isGod(profile) {
  if (!profile) return false;
  return profile.role === "GOD";
}
/**
 * Verifica se o usuário tem perfil administrativo (GOD ou ADMINISTRADOR)
 */
export function isAdmin(profile) {
  if (!profile) return false;
  return profile.role === "GOD" || profile.role === "ADMINISTRADOR";
}
/**
 * Verifica se o usuário pode gerenciar outros usuários
 */
export function canManageUsers(profile) {
  return isAdmin(profile);
}
/**
 * Verifica se o usuário pode gerenciar a frota
 */
export function canManageFleet(profile) {
  if (!profile) return false;
  return isAdmin(profile) || profile.role === "LIDER";
}
/**
 * Verifica se o usuário pode acessar a área de desenvolvedor
 */
export function canAccessDeveloper(profile) {
  return isGod(profile);
}
/**
 * Verifica se o usuário está ativo
 */
export function isActive(profile) {
  return profile?.status === "ATIVO";
}
