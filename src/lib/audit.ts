import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_USER"
  | "CREATE_USER_FAILED"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "BLOCK_USER"
  | "UNBLOCK_USER"
  | "MIGRATE_USER"
  | "CREATE_FROTA"
  | "UPDATE_FROTA"
  | "DELETE_FROTA"
  | "SEND_FROTA_TO_WORKSHOP"
  | "RELEASE_FROTA_FROM_WORKSHOP"
  | "STATUS_FROTA_CHANGED"
  | "CREATE_AGENDAMENTO"
  | "CREATE_RESERVA"
  | "ALOCACAO_DIRETA"
  | "ATUALIZAR_STATUS"
  | "CREATE_LOCACAO_DIRETA"
  | "UPDATE_AGENDA_STATUS"
  | "FINISH_LOCACAO"
  | "CANCEL_LOCACAO"
  | "CREATE_EQUIPAMENTO"
  | "UPDATE_EQUIPAMENTO"
  | "DELETE_EQUIPAMENTO"
  | "CREATE_FRENTE"
  | "UPDATE_FRENTE"
  | "DELETE_FRENTE"
  | "SYSTEM_TEST_RUN";

export interface AuditLogPayload {
  uid: string;
  usuario: string;
  acao: AuditAction;
  entidade: string;
  entidadeId: string;
  detalhes?: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

/**
 * Registra uma ação no log de auditoria do Firestore
 * Suporta tanto o formato antigo (múltiplos argumentos) quanto o novo (objeto único)
 */
export async function logAction(
  payloadOrUid: AuditLogPayload | string,
  usuario?: string,
  acao?: AuditAction,
  entidade?: string,
  entidadeId?: string,
  dadosAnteriores: any = null,
  dadosNovos: any = null,
) {
  try {
    let logData: any;

    if (typeof payloadOrUid === "object") {
      logData = {
        ...payloadOrUid,
        timestamp: serverTimestamp(),
      };
    } else {
      logData = {
        uid: payloadOrUid,
        usuario,
        acao,
        entidade,
        entidadeId,
        dadosAnteriores: dadosAnteriores ? JSON.parse(JSON.stringify(dadosAnteriores)) : null,
        dadosNovos: dadosNovos ? JSON.parse(JSON.stringify(dadosNovos)) : null,
        timestamp: serverTimestamp(),
      };
    }

    await addDoc(collection(db, "audit_logs"), logData);
  } catch (error) {
    console.error("[AUDIT] Erro ao registrar log de auditoria:", error);
  }
}
