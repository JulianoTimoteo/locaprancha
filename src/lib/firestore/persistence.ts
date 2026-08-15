/**
 * Utilitário de Persistência Local (Mecânica estilo WhatsApp)
 * Salva e recupera dados do Firestore no localStorage para uso offline imediato.
 */

const STORAGE_PREFIX = "locaprancha_cache_";

export const persistence = {
  /**
   * Salva dados no cache local
   */
  save: (key: string, data: unknown) => {
    try {
      const payload = {
        timestamp: Date.now(),
        data: data,
      };
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[PERSISTENCE] Erro ao salvar cache para ${key}:`, e);
    }
  },

  /**
   * Recupera dados do cache local
   */
  get: <T>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(STORAGE_PREFIX + key);
      if (!cached) return null;

      const payload = JSON.parse(cached);
      console.info(
        `[PERSISTENCE] Carregando cache local para ${key} (${new Date(payload.timestamp).toLocaleTimeString()})`,
      );
      return payload.data as T;
    } catch (e) {
      console.warn(`[PERSISTENCE] Erro ao ler cache para ${key}:`, e);
      return null;
    }
  },

  /**
   * Limpa o cache
   */
  clear: (key?: string) => {
    if (key) {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    }
  },
};
