import { UserRole, UserProfile } from '@/types';

/**
 * Matriz de Acesso Centralizada
 * Define quais abas cada perfil pode acessar
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, string[]> = {
  'GOD': [
    'dashboard', 'reservas', 'pranchas', 'frentes', 
    'relatorios', 'usuarios', 'auditoria'
  ],
  'ADMINISTRADOR': [
    'dashboard', 'reservas', 'pranchas', 'frentes', 
    'relatorios', 'usuarios'
  ],
  'LIDER': [
    'dashboard', 'reservas', 'pranchas', 'frentes', 'relatorios'
  ],
  'SOLICITANTE': [
    'dashboard', 'reservas'
  ],
  'MOTORISTA': [
    'dashboard', 'reservas'
  ]
};

/**
 * Matriz de Acesso Centralizada (Legado - Mantido para compatibilidade enquanto migramos)
 */
export const ROLE_PERMISSIONS = DEFAULT_PERMISSIONS_BY_ROLE;

/**
 * Verifica se um usuário possui uma permissão específica
 * Respeita a matriz de roles e permissões individuais
 */
export function hasPermission(profile: UserProfile | null, permissionId: string): boolean {
  if (!profile) return false;
  if (profile.status === 'BLOQUEADO') return false;
  
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
export function canAccessTab(profile: UserProfile | null, tabId: string): boolean {
  return hasPermission(profile, tabId);
}

/**
 * Verifica se o usuário tem o perfil GOD
 */
export function isGod(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === 'GOD';
}

/**
 * Verifica se o usuário tem perfil administrativo (GOD ou ADMINISTRADOR)
 */
export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === 'GOD' || profile.role === 'ADMINISTRADOR';
}

/**
 * Verifica se o usuário pode gerenciar outros usuários
 */
export function canManageUsers(profile: UserProfile | null): boolean {
  return isAdmin(profile);
}

/**
 * Verifica se o usuário pode gerenciar a frota
 */
export function canManageFleet(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return isAdmin(profile) || profile.role === 'LIDER';
}

/**
 * Verifica se o usuário pode acessar a área de desenvolvedor
 */
export function canAccessDeveloper(profile: UserProfile | null): boolean {
  return isGod(profile);
}

/**
 * Verifica se o usuário está ativo
 */
export function isActive(profile: UserProfile | null): boolean {
  return profile?.status === 'ATIVO';
}
