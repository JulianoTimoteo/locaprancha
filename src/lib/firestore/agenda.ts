import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { Reserva, UserProfile } from "@/types";
import { normalizeAgendaRecord } from "./agendaNormalizer";
import { findFrotaByFrotaField } from "./frotas";

/**
 * Normaliza a string de status para comparação segura
 */
function normalizarStatus(status: any): string {
  return (status || "").toString().toUpperCase().trim();
}

/**
 * Retorna apenas as pranchas/frotas que estão totalmente DISPONÍVEIS para novos agendamentos.
 * Utilize esta função para preencher o <select> do formulário/modal de criação.
 */
export async function obterPranchasDisponiveis() {
  const querySnapshot = await getDocs(collection(db, "frotas"));
  const disponiveis: DocumentData[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const status = normalizarStatus(data.status);

    // Considera disponível se o status for DISPONÍVEL, DISPONIVEL ou se não houver status registrado
    if (status === "DISPONÍVEL" || status === "DISPONIVEL" || !status) {
      disponiveis.push({ id: docSnap.id, ...data });
    }
  });

  return disponiveis;
}

/**
 * Assinatura em tempo real para a lista da Agenda Operacional.
 */
export function subscribeToAgenda(
  callback: (agenda: Reserva[]) => void,
  userProfile?: UserProfile | null,
) {
  const uid = userProfile?.uid;
  const rawRole = normalizarStatus(userProfile?.role || (userProfile as any)?.funcao);

  // Perfis administrativos com visualização irrestrita
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
            console.error(`[AGENDA] Erro ao normalizar registro ${docSnap.id}:`, err);
            return normalizeAgendaRecord(docSnap.id, {});
          }
        });
        callback(agenda);
      },
      (error) => {
        console.error("[AGENDA] Erro ao carregar assinaturas em tempo real:", error);
        callback([]);
      },
    );
  }

  // Fallback para perfis comuns
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
 * Cria um novo agendamento na agenda e valida se a prancha escolhida está livre.
 */
export async function criarNovoAgendamento(dadosAgendamento: any) {
  const frotaNumero = (
    dadosAgendamento.frota ||
    dadosAgendamento.pranchaId ||
    dadosAgendamento.numeroPrancha ||
    ""
  )
    .toString()
    .trim();

  if (!frotaNumero) {
    throw new Error("Selecione uma prancha/frota válida para prosseguir.");
  }

  // 1. Consulta o cadastro do veículo para verificar o status atual
  const docPrancha = await findFrotaByFrotaField(frotaNumero);

  if (docPrancha) {
    const statusAtual = normalizarStatus(docPrancha.data()?.status);

    if (statusAtual === "EM_USO" || statusAtual === "EM OPERAÇÃO" || statusAtual === "EM OPERACAO") {
      throw new Error(`A prancha [${frotaNumero}] já possui uma locação ativa em andamento.`);
    }
  }

  // 2. Registra o agendamento no Firestore com status PENDENTE por padrão
  const agendaRef = collection(db, "agenda");
  return await addDoc(agendaRef, {
    ...dadosAgendamento,
    frota: frotaNumero,
    pranchaId: frotaNumero,
    numeroPrancha: frotaNumero,
    status: dadosAgendamento.status || "PENDENTE",
    criadoEm: new Date().toISOString(),
  });
}

/**
 * Valida o aceite e inicia a locação, alterando os status das coleções do Firestore.
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
    throw new Error("Agendamento e Prancha são obrigatórios para realizar o aceite.");
  }

  // 1. Busca os dados atuais da prancha no Firestore
  const docPrancha = await findFrotaByFrotaField(valorFrotaLimpo);

  if (!docPrancha) {
    throw new Error(`A prancha [${valorFrotaLimpo}] não foi encontrada na base de frotas.`);
  }

  const dadosPrancha = docPrancha.data();
  const statusAtual = normalizarStatus(dadosPrancha?.status);

  // 2. Bloqueio definitivo se o veículo já estiver em operação
  if (statusAtual === "EM_USO" || statusAtual === "EM OPERAÇÃO" || statusAtual === "EM OPERACAO") {
    throw new Error(`A prancha [${valorFrotaLimpo}] já está em operação no momento.`);
  }

  const targetDocId = docPrancha.id;

  // 3. Atualiza o status do agendamento para EM OPERAÇÃO
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

  // 4. Marca o veículo como EM_USO nas coleções frotas/frota
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

/**
 * Finaliza a locação e reativa o status da prancha para DISPONÍVEL.
 */
export async function encerrarAgendamento(reservaId: string, pranchaId: string) {
  const valorFrotaLimpo = pranchaId.toString().trim();

  if (!reservaId) {
    throw new Error("Identificador do agendamento inválido.");
  }

  // 1. Atualiza a reserva na coleção /agenda para FINALIZADO
  const reservaRef = doc(db, "agenda", reservaId);
  await updateDoc(reservaRef, {
    status: "FINALIZADO",
    finalizadoEm: new Date().toISOString(),
  });

  // 2. Libera a prancha definindo o status como DISPONÍVEL
  if (valorFrotaLimpo) {
    const docPrancha = await findFrotaByFrotaField(valorFrotaLimpo);

    if (docPrancha) {
      const targetDocId = docPrancha.id;
      const frotaData = {
        status: "DISPONÍVEL",
        reservaAtualId: null,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "frotas", targetDocId), frotaData, { merge: true });
      await setDoc(doc(db, "frota", targetDocId), frotaData, { merge: true });
    }
  }
}
