import {
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  DocumentData,
  where,
  getDocs,
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
            const normalized = normalizeAgendaRecord(doc.id, doc.data());
            return normalized;
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

  const q1 = query(collection(db, "agenda"), where("solicitanteId", "==", uid));
  const q2 = query(collection(db, "agenda"), where("motoristaId", "==", uid));
  const q3 = query(collection(db, "agenda"), where("userId", "==", uid));

  const seen = new Set<string>();
  const results: Reserva[] = [];

  const emit = () => {
    callback([...results]);
  };

  const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    let changed = false;
    snapshot.docs.forEach((doc) => {
      if (seen.has(doc.id)) return;
      seen.add(doc.id);
      try {
        const normalized = normalizeAgendaRecord(doc.id, doc.data());
        results.push(normalized);
        changed = true;
      } catch (err) {
        console.error(`[AGENDA] Erro ao normalizar doc ${doc.id}:`, err);
      }
    });
    if (changed) emit();
  };

  const unsub1 = onSnapshot(q1, processSnapshot, (error) => {
    console.error("[AGENDA] Erro na query solicitante:", error);
  });
  const unsub2 = onSnapshot(q2, processSnapshot, (error) => {
    console.error("[AGENDA] Erro na query motorista:", error);
  });
  const unsub3 = onSnapshot(q3, processSnapshot, (error) => {
    console.error("[AGENDA] Erro na query userId:", error);
  });

  return () => {
    unsub1?.();
    unsub2?.();
    unsub3?.();
  };
}
