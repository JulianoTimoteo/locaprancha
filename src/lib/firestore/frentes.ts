import { 
  collection, 
  onSnapshot, 
  query, 
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Frente } from '@/types';

/**
 * Escuta em tempo real a coleção de frentes
 */
export function subscribeToFrentes(callback: (frentes: Frente[]) => void) {
  const q = query(collection(db, 'frentes'));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const frentes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data['nome'] || 'N/A',
        codigo: data['codigo'] || '',
        responsavel: data['responsavel'] || '',
        status: data['status'] || 'ATIVA'
      } as Frente;
    });
    callback(frentes);
  }, (error) => {
    console.error("Erro ao assinar frentes:", error);
  });
}
