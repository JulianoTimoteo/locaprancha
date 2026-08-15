import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Hook global de notificações/alarmes.
 *
 * - Solicita permissão do navegador para notificações nativas (uma única vez).
 * - Expõe sendNotification() para disparar alertas: usa notificação nativa
 *   quando permitida, com fallback em toast (sonner) caso contrário.
 */
export function useNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Permissão negada ou indisponível: seguimos usando apenas o toast.
      });
    }
  }, []);

  const sendNotification = (title: string, body?: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body });
          return;
        } catch {
          // Falha ao criar notificação nativa: cai para o toast abaixo.
        }
      }
    }
    toast.info(title, { description: body });
  };

  return { sendNotification };
}
