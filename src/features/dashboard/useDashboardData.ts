import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { isAdmin, isGod } from "@/lib/permissions/permissions";
import { Frota, Reserva, AuditLog } from "@/types";
import { subscribeToFrotas } from "@/lib/firestore/frotas";
import { subscribeToAgenda } from "@/lib/firestore/agenda";
import { subscribeToAuditLogs } from "@/lib/firestore/auditLogs";
import { combineDateAndTime } from "@/lib/utils";
import { persistence } from "@/lib/firestore/persistence";

export function useDashboardData() {
  const { profile } = useAuth();
  const [pranchas, setPranchas] = useState<Frota[]>(() => persistence.get<Frota[]>("frotas") || []);
  const [agenda, setAgenda] = useState<Reserva[]>(() => persistence.get<Reserva[]>("agenda") || []);
  const [logs, setLogs] = useState<AuditLog[]>(
    () => persistence.get<AuditLog[]>("audit_logs") || [],
  );
  const [loading, setLoading] = useState(!persistence.get("frotas"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubFrotas: (() => void) | undefined;
    let unsubAgenda: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    // Conectar em paralelo
    unsubFrotas = subscribeToFrotas((data) => {
      setPranchas((prev) => {
        if (JSON.stringify(data) !== JSON.stringify(prev)) {
          persistence.save("frotas", data);
          return data;
        }
        return prev;
      });
    });

    unsubAgenda = subscribeToAgenda((data) => {
      setAgenda((prev) => {
        if (JSON.stringify(data) !== JSON.stringify(prev)) {
          persistence.save("agenda", data);
          return data;
        }
        return prev;
      });
    });

    unsubLogs = subscribeToAuditLogs((data) => {
      setLogs((prev) => {
        if (JSON.stringify(data) !== JSON.stringify(prev)) {
          persistence.save("audit_logs", data);
          return data;
        }
        return prev;
      });
      setLoading(false);
    });

    return () => {
      unsubFrotas?.();
      unsubAgenda?.();
      unsubLogs?.();
    };
  }, []);

  // KPIs baseados na frota real
  const stats = {
    total: pranchas.length,
    disponiveis: pranchas.filter((p) => p.status === "DISPONÍVEL").length,
    alocadas: pranchas.filter((p) => p.status === "ALOCADO").length,
    oficina: pranchas.filter((p) => p.status === "OFICINA").length,
  };

  // Filtrar transportes futuros conforme perfil (Regra 5)
  const proximosTransportes = agenda
    .filter((reserva) => {
      // 1. Filtro de Status: Exclui apenas terminados
      if (["Concluído", "Finalizado", "Cancelado", "Recusado"].includes(reserva.status)) {
        return false;
      }

      // 2. Filtro RBAC (Regra 31/34)
      if (isGod(profile) || isAdmin(profile) || profile?.role === "LIDER") return true;
      if (profile?.role === "MOTORISTA")
        return (
          reserva.motoristaId === profile.uid ||
          ["Aprovado", "Agendado", "Iniciado", "Em Trânsito"].includes(reserva.status)
        );
      return (
        reserva.usuarioId === profile?.uid ||
        reserva.solicitanteId === profile?.uid ||
        reserva.userId === profile?.uid
      );
    })
    .sort((a, b) => {
      // Ordenação profissional: data + hora (Regra 18)
      const timeA = combineDateAndTime(a.data, a.hora || a.horarioRetirada).getTime();
      const timeB = combineDateAndTime(b.data, b.hora || b.horarioRetirada).getTime();
      return timeA - timeB;
    })
    .slice(0, 10);

  return { stats, reservas: proximosTransportes, logs, loading, error };
}
