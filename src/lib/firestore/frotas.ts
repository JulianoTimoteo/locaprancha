import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  QueryDocumentSnapshot,
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Frota } from '@/types';
import { normalizeFrota } from './normalizers';

/**
 * Achado 2.8 da auditoria: `Reserva.pranchaId` é comparado em diferentes
 * pontos do código contra `frota.frota` OU `frota.numero`, dois nomes para
 * o mesmo conceito coexistindo por causa de uma migração de nomenclatura
 * (Prancha -> Frota) feita pela metade. Isso já causou um bug real: em
 * `addReserva` a consulta usava `where('numero', ...)`, mas o documento é
 * sempre gravado com o campo `frota` (ver `addFrota`/`updateFrota` neste
 * mesmo módulo) — ou seja, aquela consulta nunca encontrava a prancha.
 *
 * Esta função é o único ponto de busca de uma Frota pelo identificador
 * humano (`pranchaId`/`frota.frota`) usado em toda a base. Não crie novas
 * queries `where('frota', ...)` ou `where('numero', ...)` fora daqui.
 *
 * TODO (dívida técnica de médio prazo, ver achado 2.8): migrar `pranchaId`
 * para referenciar o `id` real do documento Firestore em vez de um campo de
 * texto livre, eliminando a necessidade desta busca por query.
 */
export async function findFrotaByFrotaField(frotaIdentifier: string): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  if (!frotaIdentifier) return null;
  const q = query(collection(db, 'frotas'), where('frota', '==', frotaIdentifier));
  const snap = await getDocs(q);
  return snap.docs[0] ?? null;
}


/**
 * Escuta em tempo real a coleção de frotas
 */
export function subscribeToFrotas(callback: (frotas: Frota[]) => void) {
  const q = query(collection(db, 'frotas'));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const frotas = snapshot.docs.map(doc => {
      return normalizeFrota(doc.id, doc.data());
    });

    callback(frotas);
  }, (error) => {
    console.error("Erro ao assinar frotas:", error);
  });
}
