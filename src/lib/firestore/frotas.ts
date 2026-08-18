import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import { Frota } from "@/types";
import { normalizeFrota } from "./normalizers";

/**
 * Busca uma Frota no Firestore utilizando prioritariamente o campo `frota`.
 * Funciona mesmo se o ID do documento no banco for um Hash gerado pelo Firebase (ex: 94l2CbdW422yO9WFFuiN).
 */
export async function findFrotaByFrotaField(
  frotaIdentifier: string,
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  if (!frotaIdentifier) return null;

  const valorLimpo = frotaIdentifier.toString().trim();

  // 1. Prioridade 1: Buscar pelo campo 'frota' na coleção "frotas" (plural)
  const qPlural = query(collection(db, "frotas"), where("frota", "==", valorLimpo));
  const snapPlural = await getDocs(qPlural);
  if (!snapPlural.empty) {
    return snapPlural.docs[0];
  }

  // 2. Prioridade 2: Buscar pelo campo 'frota' na coleção "frota" (singular)
  const qSingular = query(collection(db, "frota"), where("frota", "==", valorLimpo));
  const snapSingular = await getDocs(qSingular);
  if (!snapSingular.empty) {
    return snapSingular.docs[0];
  }

  // 3. Fallback: Buscar pelo campo 'numero' (compatibilidade legado)
  const qNumero = query(collection(db, "frotas"), where("numero", "==", valorLimpo));
  const snapNumero = await getDocs(qNumero);
  if (!snapNumero.empty) {
    return snapNumero.docs[0];
  }

  // 4. Última tentativa: Tentar buscar como ID direto do documento caso não seja hash
  const docRefPlural = doc(db, "frotas", valorLimpo);
  const docSnapPlural = await getDoc(docRefPlural);
  if (docSnapPlural.exists()) {
    return docSnapPlural as QueryDocumentSnapshot<DocumentData>;
  }

  const docRefSingular = doc(db, "frota", valorLimpo);
  const docSnapSingular = await getDoc(docRefSingular);
  if (docSnapSingular.exists()) {
    return docSnapSingular as QueryDocumentSnapshot<DocumentData>;
  }

  return null;
}

/**
 * Cadastra ou atualiza um veículo garantindo que o campo `frota` seja preenchido corretamente.
 */
export async function addOrUpdateFrota(data: Partial<Frota> & { frota: string }): Promise<string> {
  const frotaValor = data.frota.toString().trim();
  
  if (!frotaValor) {
    throw new Error("O identificador do veículo (campo 'frota') é obrigatório.");
  }

  // Verifica se o documento já existe buscando pelo campo 'frota'
  const docExistente = await findFrotaByFrotaField(frotaValor);
  
  // Se existir, reutiliza o ID do documento existente (seja Hash ou numérico)
  const docId = docExistente ? docExistente.id : frotaValor;

  const frotaData = {
    ...data,
    id: docId,
    frota: frotaValor,
    numero: frotaValor,
    updatedAt: new Date().toISOString(),
  };

  // Atualiza em ambas as coleções para manter compatibilidade
  await setDoc(doc(db, "frotas", docId), frotaData, { merge: true });
  await setDoc(doc(db, "frota", docId), frotaData, { merge: true });

  return docId;
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
 * Deleta um veículo da frota buscando pelo campo 'frota' ou ID
 */
export async function deleteFrota(frotaIdentifier: string): Promise<void> {
  const valorLimpo = frotaIdentifier.toString().trim();
  const docExistente = await findFrotaByFrotaField(valorLimpo);

  const docId = docExistente ? docExistente.id : valorLimpo;

  await deleteDoc(doc(db, "frotas", docId));
  await deleteDoc(doc(db, "frota", docId));
}
