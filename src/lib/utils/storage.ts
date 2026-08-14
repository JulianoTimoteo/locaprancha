
/**
 * SISTEMA ANTI-TELA BRANCA v1.3.0
 * 
 * Este módulo gerencia a persistência de dados localmente e garante que o app
 * não trave em estados corrompidos (ex: rotas inexistentes, sessões expiradas).
 */

const VERSION = "1.5.0"; // Incrementado para v1.5.0 para forçar limpeza total e cache-busting

export const initAppPersistence = () => {
  try {
    const lastVersion = localStorage.getItem("locaprancha_app_version");
    
    // Se a versão mudou ou se for a primeira execução do dia, forçamos um reset leve
    // No entanto, se o usuário estiver reclamando de tela branca constante,
    // o reset deve ser agressivo.
    if (lastVersion !== VERSION) {
      console.warn(`[Storage] Version mismatch: ${lastVersion} -> ${VERSION}. Executing Hard Reset...`);
      
      // Preservar apenas o que for estritamente necessário se quiséssemos, 
      // mas para "Tela Branca" a regra é: LIMPEZA TOTAL.
      localStorage.clear();
      sessionStorage.clear();
      
      localStorage.setItem("locaprancha_app_version", VERSION);
      console.info("[Storage] Hard Reset complete. App is clean.");
      
      // Forçar recarregamento para garantir que o estado do React seja reiniciado do zero
      if (lastVersion !== null) {
        window.location.reload();
      }
    }
  } catch (error) {
    console.error("[Storage] Failed to initialize persistence:", error);
    // Em caso de erro no localStorage (ex: modo privado), tentamos limpar o que der
    try { localStorage.clear(); } catch(e) {}
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
