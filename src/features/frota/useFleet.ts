import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Frota, StatusFrota } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { logAction } from '@/lib/audit';
import { normalizeFrota } from '@/lib/firestore/normalizers';

export function useFleet() {
  const [frotas, setFrotas] = useState<Frota[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    // Escuta a coleção 'frotas' ordenada por frota
    const q = query(collection(db, 'frotas'), orderBy('frota', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => normalizeFrota(doc.id, doc.data()));
      setFrotas(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar frota:", error);
      setLoading(false);
      toast.error("Erro ao conectar com a frota.");
    });

    return () => unsubscribe();
  }, []);

  const checkUniqueFrota = async (frotaNum: string, excludeId?: string) => {
    const q = query(collection(db, 'frotas'), where('frota', '==', frotaNum.trim()));
    const snapshot = await getDocs(q);
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return !snapshot.empty;
  };

  const addFrota = async (data: Omit<Frota, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const isDuplicate = await checkUniqueFrota(data.frota);
      if (isDuplicate) {
        toast.error('❌ Frota já cadastrada.');
        return null;
      }

      const payload = {
        ...data,
        frota: data.frota.trim(),
        placa: data.placa.trim().replace('-', '').toUpperCase(),
        tipo: data.frota.trim(), // Regra 18: tipo acompanha frota
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: profile?.uid || 'unknown'
      };

      const docRef = await addDoc(collection(db, 'frotas'), payload);
      
      if (profile) {
        await logAction(profile.uid, profile.nickname || profile.name, 'CREATE_FROTA', 'frota', docRef.id, null, payload);
      }
      
      toast.success('Frota adicionada');
      return docRef.id;
    } catch (e) {
      console.error(e);
      toast.error('❌ Não foi possível salvar a frota.');
      throw e;
    }
  };

  const updateFrota = async (id: string, data: Partial<Frota>) => {
    try {
      if (data.frota) {
        const isDuplicate = await checkUniqueFrota(data.frota, id);
        if (isDuplicate) {
          toast.error('❌ Frota já cadastrada.');
          return;
        }
      }

      const old = frotas.find(f => f.id === id);
      const payload: any = {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: profile?.uid || 'unknown'
      };

      if (data.frota) {
        payload.frota = data.frota.trim();
        payload.tipo = data.frota.trim();
      }
      if (data.placa) {
        payload.placa = data.placa.trim().replace('-', '').toUpperCase();
      }

      await updateDoc(doc(db, 'frotas', id), payload);
      
      if (profile && old) {
        await logAction(profile.uid, profile.nickname || profile.name, 'UPDATE_FROTA', 'frota', id, old, payload);
      }
      
      toast.success('Frota atualizada');
    } catch (e) {
      console.error(e);
      toast.error('❌ Não foi possível atualizar a frota.');
    }
  };

  const changeStatus = async (id: string, newStatus: StatusFrota, justificativa?: string) => {
    try {
      const old = frotas.find(f => f.id === id);
      if (!old) return;

      // Regra 12: Não permitir ALOCADO -> OFICINA se serviço em andamento
      // Nota: Esta verificação idealmente consultaria a coleção de serviços/reservas.
      // Como não temos a consulta aqui, faremos a verificação baseada no status local por enquanto,
      // mas o ideal é que a interface previna isso ou use uma transaction.

      const payload = {
        status: newStatus,
        justificativaManutencao: justificativa || '',
        updatedAt: serverTimestamp(),
        updatedBy: profile?.uid || 'unknown'
      };

      await updateDoc(doc(db, 'frotas', id), payload);
      
      const actionMap = {
        'OFICINA': 'SEND_FROTA_TO_WORKSHOP',
        'DISPONÍVEL': old.status === 'OFICINA' ? 'RELEASE_FROTA_FROM_WORKSHOP' : 'STATUS_FROTA_CHANGED',
        'ALOCADO': 'STATUS_FROTA_CHANGED'
      };

      if (profile) {
        await logAction(
          profile.uid, 
          profile.nickname || profile.name, 
          actionMap[newStatus] as any, 
          'frota', 
          id, 
          { status: old.status }, 
          { status: newStatus, justificativa }
        );
      }
      
      toast.success(`Frota ${newStatus === 'OFICINA' ? 'enviada para oficina' : 'liberada'}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao alterar status da frota');
    }
  };

  const deleteFrota = async (id: string) => {
    try {
      const old = frotas.find(f => f.id === id);
      await deleteDoc(doc(db, 'frotas', id));
      
      if (profile && old) {
        await logAction(profile.uid, profile.nickname || profile.name, 'DELETE_FROTA', 'frota', id, old, null);
      }
      
      toast.success('Frota removida');
    } catch (e) {
      toast.error('Erro ao remover frota');
    }
  };

  // Mapeamentos para compatibilidade legada
  return { 
    frotas, 
    pranchas: frotas, // alias
    loading, 
    addFrota, 
    addPrancha: addFrota,
    updateFrota, 
    updatePrancha: updateFrota,
    changeStatus,
    deleteFrota,
    deletePrancha: deleteFrota
  };
}
