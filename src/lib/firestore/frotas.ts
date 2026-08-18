import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { Frota } from "@/types";
import { normalizeFrota } from "./normalizers";

/**
 * Busca uma Frota no Firestore.
 * Tenta primeiro buscar diretamente pelo ID do documento (ex: /frotas/31220).
 * Caso não encontre, realiza o fallback buscando pelos campos legados `frota` ou `numero`.
 */
export async function findFrotaByFrotaField(
  frotaIdentifier: string,
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  if (!frotaIdentifier) return null;

  const idLimpo = frotaIdentifier.toString().trim();

  // 1. Tenta buscar direto pelo ID do documento na coleção "frotas" e "frota"
  const docRefPlural = doc(db, "frotas", idLimpo);
  const docSnapPlural = await getDoc(docRefPlural);

  if (docSnapPlural.exists()) {
    return docSnapPlural as QueryDocumentSnapshot<DocumentData>;
  }

  const docRefSingular = doc(db, "frota", idLimpo);
  const docSnapSingular = await getDoc(docRefSingular);

  if (docSnapSingular.exists()) {
    return docSnapSingular as QueryDocumentSnapshot<DocumentData>;
  }

  // 2. Fallback: Se não encontrou por ID direto, busca pelos campos `frota` ou `numero`
  const qFrota = query(collection(db, "frotas"), where("frota", "==", idLimpo));
  const snapFrota = await getDocs(qFrota);
  if (!snapFrota.empty) return snapFrota.docs[0];

  const qNumero = query(collection(db, "frotas"), where("numero", "==", idLimpo));
  const snapNumero = await getDocs(qNumero);
  if (!snapNumero.empty) return snapNumero.docs[0];

  return null;
}

/**
 * Cadastra ou atualiza um veículo utilizando o PREFIXO/NÚMERO como chave (ID) do documento.
 * Isso impede que o Firebase crie um hash aleatório.
 */
export async function addOrUpdateFrota(data: Partial<Frota> & { frota: string }): Promise<string> {
  const frotaId = data.frota.toString().trim();
  
  if (!frotaId) {
    throw new Error("O identificador do veículo (frota/número) é obrigatório.");
  }

  const frotaData = {
    ...data,
    id: frotaId,
    frota: frotaId,
    numero: frotaId,
    atualizadoEm: new Date().toISOString(),
  };

  // Grava com setDoc forçando a chave limpa em ambas as coleções para evitar bugs de compatibilidade
  await setDoc(doc(db, "frotas", frotaId), frotaData, { merge: true });
  await setDoc(doc(db, "frota", frotaId), frotaData, { merge: true });

  return frotaId;
}

/**
 * Escuta em tempo real a coleção de frotas
 */
export function subscribeToFrotas(callback: (frotas: Frota[]) => void) {
  const q = query(collection(db, "frotas"));

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const frotas = snapshot.docs.map((doc) => {
        return normalizeFrota(doc.id, doc.data());
      });

      callback(frotas);
    },
    (error) => {
      console.error("Erro ao assinar frotas:", error);
    },
  );
}

/**
 * Deleta um veículo da frota
 */
export async function deleteFrota(frotaId: string): Promise<void> {
  const idLimpo = frotaId.toString().trim();
  await deleteDoc(doc(db, "frotas", idLimpo));
  await deleteDoc(doc(db, "frota", idLimpo));
}
