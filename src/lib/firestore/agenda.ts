import {
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  DocumentData,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { Reserva } from "@/types";
import { normalizeAgendaRecord } from "./agendaNormalizer";
import { UserProfile } from "@/types";

export function subscribeToAgenda(
  callback: (agenda: Reserva[]) => void,
  userProfile?: UserProfile | null,
) {
  const uid = userProfile?.uid;
  const role = userProfile?.role;
  const isPrivileged = role === "GOD" || role === "ADMINISTRADOR" || role === "LIDER";

  if (isPrivileged) {
    const q = query(collection(db, "agenda"));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const agenda = snapshot.docs.map((doc) => {
          try {
            return normalizeAgendaRecord(doc.id, doc.data());
          } catch (err) {
            console.error(`[AGENDA] Erro ao normalizar doc ${doc.id}:`, err);
            return normalizeAgendaRecord(doc.id, {});
          }
        });
        callback(agenda);
      },
      (error) => {
        console.error("[AGENDA] Erro fatal na assinatura:", error);
        callback([]);
      },
    );
  }

  if (!uid) {
    callback([]);
    return () => {};
  }

  // Fallback para usuários comuns: Múltiplas queries para simular OR
  const q1 = query(collection(db, "agenda"), where("solicitanteId", "==", uid));
  const q2 = query(collection(db, "agenda"), where("motoristaId", "==", uid));
  const q3 = query(collection(db, "agenda"), where("userId", "==", uid));

  const resultsMap = new Map<string, Reserva>();

  const emit = () => {
    callback(Array.from(resultsMap.values()));
  };

  const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docs.forEach((doc) => {
      try {
        resultsMap.set(doc.id, normalizeAgendaRecord(doc.id, doc.data()));
      } catch (err) {
        console.error(`[AGENDA] Erro ao normalizar doc ${doc.id}:`, err);
      }
    });
    emit();
  };

  const unsub1 = onSnapshot(q1, processSnapshot);
  const unsub2 = onSnapshot(q2, processSnapshot);
  const unsub3 = onSnapshot(q3, processSnapshot);

  return () => {
    unsub1?.();
    unsub2?.();
    unsub3?.();
  };
}
