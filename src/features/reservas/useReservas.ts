import { useState, useEffect } from "react";
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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Reserva, AgendaStatus } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAction } from "@/lib/audit";
import { normalizeFrotaStatus } from "@/lib/firestore/normalizers";
import { subscribeToAgenda } from "@/lib/firestore/agenda";
import { canTransitionTo } from "@/lib/domain/reservaStateMachine";
import { findFrotaByFrotaField } from "@/lib/firestore/frotas";
import { isAdmin, isGod, hasPermission } from "@/lib/permissions/permissions";
import { persistence } from "@/lib/firestore/persistence";
import { useNotifications } from "@/hooks/useNotifications";

export function useReservas() {
  const [reservas, setReservas] = useState<Reserva[]>(
    () => persistence.get<Reserva[]>("agenda_full") || [],
  );
  const [loading, setLoading] = useState(!persistence.get("agenda_full"));
  const { profile, user } = useAuth();
  const { sendNotification } = useNotifications();

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToAgenda((data) => {
      if (!isMounted) return;

      // Obter dados anteriores de forma estável (evita depender da variável reservas do hook que muda a cada render)
      const prevData = persistence.get<Reserva[]>("agenda_full") || [];
      
      // Notificar mudanças apenas se houver dados novos reais
      if (prevData.length > 0) {
        data.forEach((curr) => {
          const prev = prevData.find((p) => p.id === curr.id);
          if (prev && prev.status !== curr.status) {
            const isSolicitante = curr.solicitanteId === user?.uid;
            const isRelevantAdmin = isAdmin(profile) || isGod(profile);

            if (isSolicitante || isRelevantAdmin) {
              sendNotification(
                "Atualização de Reserva",
                `A reserva [${curr.id.substring(0, 5)}] mudou para: ${curr.status}`
              );
            }
          }
        });
      }

      const sortedData = [...data].sort((a, b) => {
        const order: Record<string, number> = {
          Iniciado: 1,
          "Em Trânsito": 2,
          Agendado: 3,
          Aprovado: 3,
          Pendente: 4,
          Finalizado: 5,
          Concluído: 5,
          Cancelado: 6,
          Recusado: 6,
        };
        const getOrder = (s: string) => order[s] || 99;

        if (getOrder(a.status) !== getOrder(b.status)) {
          return getOrder(a.status) - getOrder(b.status);
        }

        const dateA = a.data || "0000-00-00";
        const dateB = b.data || "0000-00-00";
        if (dateA !== dateB) return dateB.localeCompare(dateA);

        const timeA = a.hora || a.horarioRetirada || "00:00";
        const timeB = b.hora || b.horarioRetirada || "00:00";
        return timeB.localeCompare(timeA);
      });

      // Só atualiza o estado se os dados realmente mudaram para evitar loops de render
      const dataChanged = JSON.stringify(sortedData) !== JSON.stringify(prevData);
      if (dataChanged) {
        setReservas(sortedData);
        persistence.save("agenda_full", sortedData);
        setLoading(false);
      }
    }, profile);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile?.uid, profile?.role, user?.uid, sendNotification]);

  const addReserva = async (reservaData: Partial<Reserva>): Promise<string | undefined> => {
    if (!user || !profile) return;
    try {
      const payload = {
        ...reservaData,
        solicitanteId: user.uid,
        solicitanteNome: profile.name,
        solicitante: profile.name,
        status: "Pendente" as AgendaStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "agenda"), payload);
      await logAction({
        uid: user.uid,
        usuario: profile.name,
        acao: "CREATE_RESERVA",
        entidade: "agenda",
        entidadeId: docRef.id,
        detalhes: `Solicitação criada: ${reservaData.origem || "N/A"} -> ${reservaData.destino || "N/A"}`,
      });
      toast.success("Solicitação enviada com sucesso!");
      return docRef.id;
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação.");
      return undefined;
    }
  };

  const alocarDireto = async (reservaData: Partial<Reserva>): Promise<string | undefined> => {
    if (!user || !profile) return;
    try {
      const payload = {
        ...reservaData,
        solicitanteId: user.uid,
        solicitanteNome: profile.name,
        solicitante: profile.name,
        status: "Iniciado" as AgendaStatus,
        createdAt: serverTimestamp(),
        iniciadoPor: user.uid,
        iniciadoEm: serverTimestamp(),
        horarioInicioReal: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tipoOperacao: "LOCACAO_DIRETA",
      };

      let newId = "";
      await runTransaction(db, async (transaction) => {
        const frotaRef = collection(db, "frotas");
        const qFrota = query(frotaRef, where("frota", "==", payload.pranchaId));
        const frotaSnap = await getDocs(qFrota);

        if (frotaSnap.empty) throw new Error("Prancha não encontrada.");
        const frotaDoc = frotaSnap.docs[0];

        if (normalizeFrotaStatus(frotaDoc.data().status) !== "DISPONÍVEL") {
          throw new Error("Esta prancha não está disponível no momento.");
        }

        const agendaRef = doc(collection(db, "agenda"));
        newId = agendaRef.id;
        transaction.set(agendaRef, { ...payload, id: newId });
        transaction.update(frotaDoc.ref, {
          status: "ALOCADO",
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      });

      await logAction({
        uid: user.uid,
        usuario: profile.name,
        acao: "ALOCACAO_DIRETA",
        entidade: "agenda",
        entidadeId: newId,
        detalhes: `Alocação direta de ${payload.pranchaId}`,
      });
      toast.success("Equipamento alocado e serviço iniciado!");
      return newId;
    } catch (error: any) {
      if (error.code === "permission-denied") {
        toast.error("🚫 Erro de Permissão: Apenas administradores podem alocar diretamente.");
      } else {
        toast.error("Erro ao processar alocação.");
      }
      return undefined;
    }
  };

  const updateReservaStatus = async (id: string, status: AgendaStatus, extraData: any = {}) => {
    try {
      if (!user || !profile) return;

      const isUserAdmin = isAdmin(profile) || isGod(profile);

      // Validação de Permissão
      if (status === "Aprovado" && !isUserAdmin) {
        throw new Error("Somente administradores podem aprovar solicitações.");
      }

      if (
        (status === "Iniciado" || status === "Em Trânsito") &&
        !hasPermission(profile, "reservas")
      ) {
        throw new Error("Você não tem permissão para operar o transporte.");
      }

      const oldReserva = reservas.find((r) => r.id === id);
      if (!oldReserva) throw new Error("Registro não encontrado na Agenda.");

      if (!canTransitionTo(oldReserva.status, status)) {
        throw new Error(`Transição de ${oldReserva.status} para ${status} não é permitida.`);
      }

      await runTransaction(db, async (transaction) => {
        const reservaRef = doc(db, "agenda", id);
        const resSnap = await transaction.get(reservaRef);
        if (!resSnap.exists()) throw new Error("Registro removido do banco.");

        const updates: any = {
          status,
          updatedAt: serverTimestamp(),
        };

        // Regras específicas de transição
        if (status === "Aprovado") {
          updates.aprovadoEm = serverTimestamp();
          updates.aprovadoPor = user.uid;
          if (extraData.id) {
            updates.motoristaId = extraData.id;
            updates.motoristaNome = extraData.nome;
          }
        } else if (status === "Iniciado") {
          const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
          if (!pranchaDoc) throw new Error("Prancha não encontrada.");

          if (
            normalizeFrotaStatus(pranchaDoc.data()["status"]) !== "DISPONÍVEL" &&
            oldReserva.status !== "Agendado" &&
            oldReserva.status !== "Aprovado"
          ) {
            throw new Error("A prancha não está disponível para iniciar esta operação.");
          }

          updates.iniciadoEm = serverTimestamp();
          updates.iniciadoPor = user.uid;
          updates.horarioInicioReal = serverTimestamp();

          transaction.update(doc(db, "frotas", pranchaDoc.id), { status: "ALOCADO" });
        } else if (status === "Finalizado" || status === "Concluído") {
          updates.finalizadoEm = serverTimestamp();
          updates.finalizadoPor = user.uid;
          updates.horarioFimReal = serverTimestamp();
          if (extraData.relatorio || extraData)
            updates.relatorio = extraData.relatorio || extraData;

          // Liberar prancha
          const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
          if (pranchaDoc) {
            transaction.update(doc(db, "frotas", pranchaDoc.id), { status: "DISPONÍVEL" });
          }
        } else if (status === "Cancelado" || status === "Recusado") {
          if (
            oldReserva.status === "Iniciado" ||
            oldReserva.status === "Em Trânsito" ||
            oldReserva.status === "Aprovado"
          ) {
            const pranchaDoc = await findFrotaByFrotaField(oldReserva.pranchaId);
            if (pranchaDoc) {
              transaction.update(doc(db, "frotas", pranchaDoc.id), { status: "DISPONÍVEL" });
            }
          }
          if (extraData.motivo || extraData.nome)
            updates.motivoRecusa = extraData.motivo || extraData.nome;
        }

        transaction.update(reservaRef, updates);
      });

      await logAction({
        uid: user.uid,
        usuario: profile.name,
        acao: "ATUALIZAR_STATUS",
        entidade: "agenda",
        entidadeId: id,
        detalhes: `Status alterado de ${oldReserva.status} para ${status}`,
      });

      toast.success(`Status atualizado para ${status}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar operação");
    }
  };

  return {
    reservas,
    loading,
    addReserva,
    alocarDireto,
    updateReservaStatus,
    atualizarStatus: updateReservaStatus,
  };
}
