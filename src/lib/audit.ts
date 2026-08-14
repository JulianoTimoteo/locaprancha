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

/**
 * Registra uma ação no log de auditoria do Firestore
 */
export async function logAction(
  uid: string,
  usuario: string,
  acao: AuditAction,
  entidade: string,
  entidadeId: string,
  dadosAnteriores: any = null,
  dadosNovos: any = null,
) {
  try {
    const logData = {
      uid,
      usuario,
      acao,
      entidade,
      entidadeId,
      timestamp: serverTimestamp(), // SEC-17: Autoridade do servidor para o tempo
      dadosAnteriores: dadosAnteriores ? JSON.parse(JSON.stringify(dadosAnteriores)) : null,
      dadosNovos: dadosNovos ? JSON.parse(JSON.stringify(dadosNovos)) : null,
    };

    await addDoc(collection(db, "audit_logs"), logData);
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}
