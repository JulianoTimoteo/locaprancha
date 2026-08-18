import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { Reserva, UserProfile } from "@/types";
import { normalizeAgendaRecord } from "./agendaNormalizer";
import { findFrotaByFrotaField } from "./frotas";

/**
 * Escuta as atualizações da agenda em tempo real.
 * Libera visão total para Administradores, GOD e Liderança, ou filtra pelos papéis do usuário.
 */
export function subscribeToAgenda(
  callback: (agenda: Reserva[]) => void,
  userProfile?: UserProfile | null,
) {
  const uid = userProfile?.uid;
  const rawRole = (userProfile?.role || (userProfile as any)?.funcao || "").toString().toUpperCase().trim();

  // Perfis privileged com acesso total
  const isPrivileged =
    rawRole === "GOD" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRADOR" ||
    rawRole === "LIDER" ||
    rawRole === "FRENTE" ||
    rawRole === "PRANCHA";

  if (isPrivileged || !uid) {
    const q = query(collection(db, "agenda"));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const agenda = snapshot.docs.map((docSnap) => {
          try {
            return normalizeAgendaRecord(docSnap.id, docSnap.data());
          } catch (err) {
            console.error(`[AGENDA] Erro ao normalizar doc ${docSnap.id}:`, err);
            return normalizeAgendaRecord(docSnap.id, {});
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

  // Fallback para usuários comuns: Múltiplas queries para simular operador OR no Firestore
  const q1 = query(collection(db, "agenda"), where("solicitanteId", "==", uid));
  const q2 = query(collection(db, "agenda"), where("motoristaId", "==", uid));
  const q3 = query(collection(db, "agenda"), where("userId", "==", uid));
  const q4 = query(collection(db, "agenda"), where("criadoPorUid", "==", uid));

  const resultsMap = new Map<string, Reserva>();

  const emit = () => {
    const lista = Array.from(resultsMap.values()).sort((a, b) => {
      const dateA = new Date(a.criadoEm || a.dataHora || 0).getTime();
      const dateB = new Date(b.criadoEm || b.dataHora || 0).getTime();
      return dateB - dateA;
    });
    callback(lista);
  };

  const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "removed") {
        resultsMap.delete(change.doc.id);
      } else {
        try {
          resultsMap.set(change.doc.id, normalizeAgendaRecord(change.doc.id, change.doc.data()));
        } catch (err) {
          console.error(`[AGENDA] Erro ao normalizar doc ${change.doc.id}:`, err);
        }
      }
    });
    emit();
  };

  const unsub1 = onSnapshot(q1, processSnapshot, (err) => console.error("[AGENDA q1]:", err));
  const unsub2 = onSnapshot(q2, processSnapshot, (err) => console.error("[AGENDA q2]:", err));
  const unsub3 = onSnapshot(q3, processSnapshot, (err) => console.error("[AGENDA q3]:", err));
  const unsub4 = onSnapshot(q4, processSnapshot, (err) => console.error("[AGENDA q4]:", err));

  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}

/**
 * Função para aceitar / iniciar o agendamento.
 * Contém validação para IMPEDIR a aprovação caso a prancha já esteja locada/em uso.
 */
export async function aceitarEIniciarAgendamento(params: {
  reservaId: string;
  pranchaId: string; // Ex: "31121"
  motoristaUid: string;
  motoristaNome: string;
}) {
  const { reservaId, pranchaId, motoristaUid, motoristaNome } = params;
  const valorFrotaLimpo = pranchaId.toString().trim();

  if (!reservaId || !valorFrotaLimpo) {
    throw new Error("Agendamento e Prancha são obrigatórios para aceitar.");
  }

  // 1. Busca os dados atuais da prancha no banco
  const docPrancha = await findFrotaByFrotaField(valorFrotaLimpo);

  if (!docPrancha) {
    throw new Error(`A prancha [${valorFrotaLimpo}] não foi encontrada no cadastro.`);
  }

  const dadosPrancha = docPrancha.data();
  const statusAtual = (dadosPrancha?.status || "").toString().toUpperCase().trim();

  // 2. Trava de segurança: Impede o aceite se o veículo já estiver em operação/uso
  if (statusAtual === "EM_USO" || statusAtual === "EM OPERAÇÃO" || statusAtual === "EM OPERACAO") {
    throw new Error(`A prancha [${valorFrotaLimpo}] já está EM OPERAÇÃO/LOCADA no momento.`);
  }

  const targetDocId = docPrancha.id;

  // 3. Atualiza a reserva na coleção /agenda
  const reservaRef = doc(db, "agenda", reservaId);
  await updateDoc(reservaRef, {
    pranchaId: valorFrotaLimpo,
    frotaId: valorFrotaLimpo,
    frota: valorFrotaLimpo,
    numeroPrancha: valorFrotaLimpo,
    motoristaId: motoristaUid,
    motoristaNome: motoristaNome,
    status: "EM OPERAÇÃO",
    iniciadoEm: new Date().toISOString(),
  });

  // 4. Atualiza o status da prancha para EM_USO nas coleções /frotas e /frota
  const frotaData = {
    id: targetDocId,
    frota: valorFrotaLimpo,
    numero: valorFrotaLimpo,
    status: "EM_USO",
    reservaAtualId: reservaId,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "frotas", targetDocId), frotaData, { merge: true });
  await setDoc(doc(db, "frota", targetDocId), frotaData, { merge: true });
}
