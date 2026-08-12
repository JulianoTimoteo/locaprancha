import { 
  collection, 
  onSnapshot, 
  query, 
  QuerySnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Reserva } from '@/types';
import { normalizeAgendaRecord } from './agendaNormalizer';

/**
 * Escuta em tempo real a coleção de agenda (reservas)
 * Regra 30/31: Corrigido para carregar documentos reais e ordenar via frontend
 */
export function subscribeToAgenda(callback: (agenda: Reserva[]) => void) {
  // Query aberta para não filtrar documentos prematuramente
  const q = query(
    collection(db, 'agenda')
  );
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    // Normalização defensiva para evitar quebra com documentos legados/incompletos
    const agenda = snapshot.docs.map(doc => {
      try {
        const rawData = doc.data();
        // Log detalhado para auditoria conforme instrução 27
        console.info(`[AGENDA] Processando doc: ${doc.id}`, rawData);
        
        const normalized = normalizeAgendaRecord(doc.id, rawData);
        
        console.info(`[AGENDA] Doc ${doc.id} normalizado:`, normalized);
        return normalized;
      } catch (err) {
        console.error(`[AGENDA] Erro ao normalizar doc ${doc.id}:`, err);
        return normalizeAgendaRecord(doc.id, {});
      }
    });
    
    // Debug temporário conforme instrução 18
    console.info("[AGENDA] Iniciando subscription");
    console.info(`[AGENDA] Documentos recebidos: ${agenda.length}`);
    if (import.meta.env.DEV) {
        console.info("[AGENDA] Dados:", agenda);
    }
    
    callback(agenda);
  }, (error) => {
    console.error("[AGENDA] Erro fatal na assinatura:", error);
  });
}
