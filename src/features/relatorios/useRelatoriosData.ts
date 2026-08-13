import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { isAdmin, isGod } from '@/lib/permissions/permissions';
import { Reserva, Frota, Frente, UserProfile } from '@/types';
import { subscribeToAgenda } from '@/lib/firestore/agenda';
import { subscribeToFrotas } from '@/lib/firestore/frotas';
import { subscribeToUsuarios } from '@/lib/firestore/usuarios';
import { subscribeToFrentes } from '@/lib/firestore/frentes';

export function useRelatoriosData(filters: any) {
  const { profile } = useAuth();
  const [agenda, setAgenda] = useState<Reserva[]>([]);
  const [frotas, setFrotas] = useState<Frota[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedCount = useRef(0);

  useEffect(() => {
    const checkLoaded = () => {
      loadedCount.current += 1;
      if (loadedCount.current >= 4) setLoading(false);
    };

    const unsubAgenda = subscribeToAgenda((data) => { setAgenda(data); checkLoaded(); });
    const unsubFrotas = subscribeToFrotas((data) => { setFrotas(data); checkLoaded(); });
    const unsubUsuarios = subscribeToUsuarios((data) => { setUsuarios(data); checkLoaded(); });
    const unsubFrentes = subscribeToFrentes((data) => { setFrentes(data); checkLoaded(); });

    return () => {
      unsubAgenda();
      unsubFrotas();
      unsubUsuarios();
      unsubFrentes();
    };
  }, []);

  const filteredData = useMemo(() => {
    let data = agenda.filter(r => {
      if (isGod(profile) || isAdmin(profile) || profile?.role === 'LIDER') return true;
      return r.usuarioId === profile?.uid || r.solicitanteId === profile?.uid || r.userId === profile?.uid;
    });

    // Filtro Período
    if (filters.dataInicio) {
      data = data.filter(r => r.data >= filters.dataInicio);
    }
    if (filters.dataFim) {
      data = data.filter(r => r.data <= filters.dataFim);
    }
    
    // Filtro Usuário
    if (filters.usuarioId && filters.usuarioId !== 'Todos') {
      data = data.filter(r => r.solicitanteId === filters.usuarioId || r.userId === filters.usuarioId);
    }

    // Filtro Equipamento (Frota)
    if (filters.pranchaId && filters.pranchaId !== 'Todos') {
      data = data.filter(r => r.pranchaId === filters.pranchaId);
    }

    // Filtro Frente
    if (filters.frenteId && filters.frenteId !== 'Todas') {
      data = data.filter(r => r.frenteId === filters.frenteId);
    }

    // Filtro Status
    if (filters.status && filters.status !== 'Todos') {
      data = data.filter(r => r.status === filters.status);
    }

    return data;
  }, [agenda, filters]);

  const kpis = useMemo(() => {
    const total = filteredData.length;
    const finalizadas = filteredData.filter(r => r.status === 'Finalizado' || r.status === 'Concluído').length;
    const emAndamento = filteredData.filter(r => r.status === 'Iniciado' || r.status === 'Em Trânsito').length;
    const canceladas = filteredData.filter(r => r.status === 'Cancelado' || r.status === 'Recusado').length;

    let totalHoras = 0;
    filteredData.forEach(r => {
      if (r.iniciadoEm && r.finalizadoEm) {
        const start = new Date(r.iniciadoEm.seconds * 1000);
        const end = new Date(r.finalizadoEm.seconds * 1000);
        totalHoras += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    const usuariosDistintos = new Set(filteredData.map(r => r.userId)).size;
    const equipamentosDistintos = new Set(filteredData.map(r => r.pranchaId)).size;
    const frentesDistintas = new Set(filteredData.map(r => r.frenteId)).size;

    return {
      total,
      finalizadas,
      finalizadasPercent: total > 0 ? (finalizadas / total * 100).toFixed(0) : 0,
      emAndamento,
      canceladas,
      canceladasPercent: total > 0 ? (canceladas / total * 100).toFixed(0) : 0,
      totalHoras: totalHoras.toFixed(1),
      usuariosDistintos,
      equipamentosDistintos,
      frentesDistintas
    };
  }, [filteredData]);

  return { filteredData, kpis, loading, frotas, usuarios, frentes };
}
