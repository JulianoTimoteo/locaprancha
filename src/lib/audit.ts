import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '@/types';

/**
 * Remove campos undefined para evitar erro no Firestore
 */
const sanitizeData = (data: any) => {
  if (!data) return null;
  return JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value));
};

export const logAction = async (
  uid: string, 
  usuario: string, 
  acao: string, 
  entidade: string, 
  entidadeId: string,
  dadosAnteriores?: any,
  dadosNovos?: any
) => {
  try {
    const logData = {
      uid: uid || 'sistema',
      usuario: usuario || 'Sistema',
      acao,
      entidade,
      entidadeId,
      timestamp: serverTimestamp(),
      dadosAnteriores: sanitizeData(dadosAnteriores),
      dadosNovos: sanitizeData(dadosNovos)
    };

    await addDoc(collection(db, 'audit_logs'), logData);
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
};
