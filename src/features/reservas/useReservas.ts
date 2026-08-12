import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc, 
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reserva, AgendaStatus } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { logAction } from '@/lib/audit';
import { normalizeFrotaStatus } from '@/lib/firestore/normalizers';
import { subscribeToAgenda } from '@/lib/firestore/agenda';
import { canTransitionTo } from '@/lib/domain/reservaStateMachine';
import { findFrotaByFrotaField } from '@/lib/firestore/frotas';
import { isAdmin, isGod, hasPermission } from '@/lib/permissions/permissions';

export function useReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  useEffect(() => {
    console.info("[AGENDA] Inicializando listener real-time...");
    const unsubscribe = subscribeToAgenda((data) => {
      // Ordenação Operacional: Iniciado -> Agendado -> Pendente -> etc. (Instrução 21)
      const sortedData = [...data].sort((a, b) => {
        const order: Record<string, number> = { 
          'Iniciado': 1, 
          'Em Trânsito': 2,
          'Agendado': 3, 
          'Aprovado': 3, 
          'Pendente': 4, 
          'Finalizado': 5, 
          'Concluído': 5, 
          'Cancelado': 6, 
          'Recusado': 6 
        };
        const getOrder = (s: string) => order[s] || 99;
        
        if (getOrder(a.status) !== getOrder(b.status)) {
          return getOrder(a.status) - getOrder(b.status);
        }
        
        const dateA = a.data || '0000-00-00';
        const dateB = b.data || '0000-00-00';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        
        const timeA = a.hora || '00:00';
        const timeB = b.hora || '00:00';
        return timeB.localeCompare(timeA);
      });

      setReservas(sortedData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  /**
   * Verifica conflitos de horário diretamente no Firestore (Instrução 13)
   */
  const checkConflict = async (pranchaId: string, data: string, start: string, end: string, excludeId?: string) => {
    const q = query(
      collection(db, 'agenda'), 
      where('pranchaId', '==', pranchaId),
      where('data', '==', data),
      where('status', 'in', ['Pendente', 'Agendado', 'Aprovado', 'Em Trânsito', 'Iniciado'])
    );
    
    const snap = await getDocs(q);
    const conflicts = snap.docs
      .filter(d => d.id !== excludeId)
      .map(d => {
        const dData = d.data();
        return {
          start: dData['horarioRetirada'] || dData['horaInicio'] || dData['hora'] || '00:00',
          end: dData['horarioDevolucaoPrevisto'] || dData['horaFim'] || '23:59',
          solicitante: dData['solicitanteNome'] || dData['solicitante'] || 'Desconhecido'
        };

      });
    
    const conflict = conflicts.find(res => {
      // Sobreposição real de período (Instrução 13)
      return (start < res.end) && (end > res.start);
    });
    
    return conflict || null;
  };

  /**
   * Fluxo de AGENDAMENTO (Instrução 2.2)
   */
  const addReserva = async (data: Omit<Reserva, 'id' | 'createdAt' | 'solicitanteId' | 'status'>) => {
    try {
      if (!user || !profile) throw new Error('Not authenticated');

      // 1. Verificar se usuário pode agendar (Instrução 21)
      const canSchedule = isAdmin(profile);
      if (!canSchedule) {
        throw new Error('Você não tem permissão para criar agendamentos administrativamente.');
      }

      // 2. Localizar prancha e verificar status
      const pranchaDoc = await findFrotaByFrotaField(data.pranchaId);
      if (!pranchaDoc) throw new Error(`Frota ${data.pranchaId} não encontrada.`);
      
      const pranchaData = pranchaDoc.data();
      if (normalizeFrotaStatus(pranchaData['status']) === 'OFICINA') {
        throw new Error('Esta prancha está em manutenção (Oficina).');
      }

      // 3. Verificar Conflitos
      const conflict = await checkConflict(data.pranchaId, data.data, data.horarioRetirada, data.horarioDevolucaoPrevisto);
      if (conflict) {
        throw new Error(`⚠️ EQUIPAMENTO JÁ POSSUI CONFLITO\nSolicitante: ${conflict.solicitante}\nPeríodo: ${conflict.start} às ${conflict.end}`);
      }

      const resData = {
        ...data,
        tipoOperacao: 'AGENDAMENTO',
        solicitanteId: user.uid,
        solicitanteNome: profile.nickname || profile.name,
        solicitante: profile.nickname || profile.name,
        status: 'Agendado' as const,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      const docRef = await addDoc(collection(db, 'agenda'), resData);
      await logAction(user.uid, profile.nickname || profile.name, 'AGENDAMENTO_CRIADO', 'agenda', docRef.id, null, resData);
      
      toast.success('Agendamento realizado com sucesso!');
      return docRef.id;
    } catch (e: any) {
      toast.error(e.message || 'Erro ao solicitar reserva');
      throw e;
    }
  };

  /**
   * Transição de Status com Transação Atômica (Instrução 11)
   */
  const updateReservaStatus = async (id: string, status: AgendaStatus, extraData: any = {}) => {
    try {
      if (!user || !profile) return;
      
      // Validação de Permissão (Instrução 21)
      if (status === 'Aprovado' && !isAdmin(profile)) {
        throw new Error("Somente administradores podem aprovar solicitações.");
      }
      
      if ((status === 'Iniciado' || status === 'Em Trânsito') && !hasPermission(profile, 'reservas')) {
        throw new Error("Você não tem permissão para operar o transporte.");
      }
      
      const oldReserva = reservas.find(r => r.id === id);
      if (!oldReserva) throw new Error("Registro não encontrado na Agenda.");

      if (!canTransitionTo(oldReserva.status, status)) {
        throw new Error(`Transição de ${oldReserva.status} para ${status} não é permitida.`);
      }

      await runTransaction(db, async (transaction) => {
        const reservaRef = doc(db, 'agenda', id);
        const resSnap = await transaction.get(reservaRef);
        if (!resSnap.exists()) throw new Error("Registro removido do banco.");

        const updates: any = { 
          status,
          updatedAt: serverTimestamp()
        };

        // Regras específicas de transição
        if (status === 'Aprovado') {
          updates.aprovadoEm = serverTimestamp();
          updates.aprovadoPor = user.uid;
        } else if (status === 'Iniciado') {
          // 1. Verificar disponibilidade da prancha NA TRANSAÇÃO
          const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
          if (!pranchaDoc) throw new Error("Prancha não encontrada.");
          
          if (normalizeFrotaStatus(pranchaDoc.data()['status']) !== 'DISPONÍVEL' && oldReserva.status !== 'Agendado' && oldReserva.status !== 'Aprovado') {
            throw new Error("A prancha não está disponível para iniciar esta operação.");
          }

          updates.iniciadoEm = serverTimestamp();
          updates.iniciadoPor = user.uid;
          updates.horarioInicioReal = serverTimestamp();
          
          transaction.update(doc(db, 'frotas', pranchaDoc.id), { status: 'ALOCADO' });
        } else if (status === 'Finalizado' || status === 'Concluído') {
          updates.finalizadoEm = serverTimestamp();
          updates.finalizadoPor = user.uid;
          updates.horarioFimReal = serverTimestamp();
          if (extraData.relatorio) updates.relatorio = extraData.relatorio;

          // Liberar prancha
          const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
          if (pranchaDoc) {
            transaction.update(doc(db, 'frotas', pranchaDoc.id), { status: 'DISPONÍVEL' });
          }
        } else if (status === 'Cancelado') {
          // Se estava alocado/iniciado, libera a prancha
          if (oldReserva.status === 'Iniciado' || oldReserva.status === 'Em Trânsito' || oldReserva.status === 'Aprovado') {
            const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
            if (pranchaDoc) {
              transaction.update(doc(db, 'frotas', pranchaDoc.id), { status: 'DISPONÍVEL' });
            }
          }
          if (extraData.motivo) updates.motivoRecusa = extraData.motivo;
        }

        transaction.update(reservaRef, updates);
      });
      
      const action = status === 'Cancelado' ? 'LOCACAO_CANCELADA' : (status === 'Finalizado' ? 'LOCACAO_FINALIZADA' : 'STATUS_ALTERADO');
      await logAction(user.uid, profile.nickname || profile.name, action as any, 'agenda', id, { status: oldReserva.status }, { status });
      toast.success(`Status atualizado para ${status}`);
    } catch (e: any) {
      console.error("[AGENDA] Erro na transação:", e);
      toast.error(e.message || 'Erro ao atualizar operação');
    }
  };

  /**
   * Fluxo de LOCAÇÃO DIRETA (Instrução 2.1 e 11)
   */
  const alocarDireto = async (data: any) => {
    try {
      if (!user || !profile) throw new Error('Not authenticated');

      // 1. Verificar permissão para alocar (Instrução 21)
      if (!hasPermission(profile, 'reservas')) {
        throw new Error('Você não tem permissão para realizar alocações diretas.');
      }

      console.info("[AGENDA] Iniciando transação de Locação Direta para:", data.pranchaId);

      const result = await runTransaction(db, async (transaction) => {
        // 1. Validação Crítica da Prancha
        const pranchaDocSnapshot = await findFrotaByFrotaField(data.pranchaId);
        if (!pranchaDocSnapshot) throw new Error(`Prancha ${data.pranchaId} não encontrada.`);

        const pranchaData = pranchaDocSnapshot.data();
        const pStatus = normalizeFrotaStatus(pranchaData['status']);
        
        if (pStatus !== 'DISPONÍVEL') {
          throw new Error(`Prancha ${data.pranchaId} não está disponível (Status atual: ${pStatus}).`);
        }

        // 2. Verificar Conflitos (mesmo para locação direta, para garantir integridade)
        const conflict = await checkConflict(data.pranchaId, data.data, data.horarioRetirada, data.horarioDevolucaoPrevisto);
        if (conflict) {
          throw new Error(`Conflito detectado com ${conflict.solicitante} (${conflict.start}-${conflict.end})`);
        }

        const agendaId = doc(collection(db, 'agenda')).id;
        const agendaRef = doc(db, 'agenda', agendaId);

        const resData = {
          ...data,
          tipoOperacao: 'LOCACAO_DIRETA',
          solicitanteId: user.uid,
          userId: user.uid,
          solicitanteNome: profile.nickname || profile.name,
          solicitante: profile.nickname || profile.name,
          status: 'Iniciado',
          createdAt: serverTimestamp(),
          iniciadoEm: serverTimestamp(),
          iniciadoPor: user.uid,
          horarioInicioReal: serverTimestamp()
        };

        // 3. Executar Writes Atômicos
        transaction.set(agendaRef, resData);
        transaction.update(doc(db, 'frotas', pranchaDocSnapshot.id), { status: 'ALOCADO' });

        // 4. Auditoria via Transação (para garantir registro)
        const auditRef = doc(collection(db, 'audit_logs'));
        transaction.set(auditRef, {
          uid: user.uid,
          usuario: profile.nickname || profile.name,
          acao: 'LOCACAO_DIRETA_CRIADA',
          entidade: 'agenda',
          entidadeId: agendaId,
          timestamp: serverTimestamp(),
          dadosNovos: resData
        });

        return agendaId;
      });
      
      toast.success('🚜 Prancha alocada com sucesso!');
      return result;

    } catch (e: any) {
      console.error("[AGENDA] Erro na Alocação Direta:", e);
      toast.error(e.message || 'Falha na transação de alocação.');
      throw e;
    }
  };

  return { reservas, loading, addReserva, updateReservaStatus, alocarDireto };
}
