import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuditLog } from "@/types";
import { UserProfile } from "@/types";

export function subscribeToAuditLogs(
  callback: (logs: AuditLog[]) => void,
  userProfile?: UserProfile | null,
) {
  const hasAccess =
    userProfile &&
    (userProfile.role === "GOD" ||
      (userProfile.permissions && userProfile.permissions.includes("auditoria")));

  if (!hasAccess) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(15));

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data["uid"] || "",
          usuario: data["usuario"] || data["user"] || "Sistema",
          acao: data["acao"] || "Ação",
          entidade: data["entidade"] || "",
          entidadeId: data["entidadeId"] || "",
          timestamp: data["timestamp"],
          dadosAnteriores: data["dadosAnteriores"],
          dadosNovos: data["dadosNovos"],
        } as AuditLog;
      });
      callback(logs);
    },
    (error) => {
      console.error("Erro ao assinar audit_logs:", error);
      callback([]);
    },
  );
}
