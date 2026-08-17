/**
 * SISTEMA ANTI-TELA BRANCA v1.3.0
 *
 * Este módulo gerencia a persistência de dados localmente e garante que o app
 * não trave em estados corrompidos (ex: rotas inexistentes, sessões expiradas).
 */

const VERSION = "1.8.0";
export const BUILD_DATE = "17/08/2026 13:50 UTC";

export const initAppPersistence = () => {
  try {
    const lastVersion = localStorage.getItem("locaprancha_app_version");

    if (lastVersion !== VERSION) {
      console.warn(
        `[Storage] Version mismatch: ${lastVersion} -> ${VERSION}. Clearing app cache...`,
      );

      // Limpar apenas chaves do app — NÃO usar localStorage.clear() pois apaga
      // o próprio locaprancha_app_version causando loop infinito de mismatch.
      const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("locaprancha_"));
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();

      // Agora grava a nova versão (após a limpeza seletiva)
      localStorage.setItem("locaprancha_app_version", VERSION);
      console.info("[Storage] Cache limpo. Versão atualizada para", VERSION);
    }
  } catch (error) {
    console.error("[Storage] Failed to initialize persistence:", error);
  }
};

/**
 * Força a limpeza manual de todos os estados do navegador relacionados ao app.
 */
export const forceHardReset = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};
