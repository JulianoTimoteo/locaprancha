import { Reserva } from "@/types";
import { format } from "date-fns";

/**
 * Formata o período de tempo da reserva no formato solicitado:
 * DD/MM/YYYY HH:mm - HH:mm (se finalizado) ou DD/MM/YYYY HH:mm - **:** (se em andamento)
 */
export const formatReservaDateTime = (reserva: Reserva): string => {
  const dataStr = reserva.data || "";
  let formattedData = "N/A";

  try {
    if (dataStr.includes("-")) {
      const [year, month, day] = dataStr.split("-");
      if (year && month && day) {
        formattedData = `${day}/${month}/${year}`;
      }
    } else if (dataStr) {
      formattedData = format(new Date(dataStr), "dd/MM/yyyy");
    }
  } catch (e) {
    formattedData = dataStr || "N/A";
  }

  const horaInicio = reserva.hora || reserva.horarioRetirada || "00:00";

  // Se estiver finalizado ou concluído, mostra a hora de término real se disponível
  const isFinalizado = ["Finalizado", "Concluído"].includes(reserva.status);

  let horaFim = "**:**";

  if (isFinalizado && reserva.horarioFimReal) {
    try {
      // O Firestore Timestamp tem toDate()
      const dateObj =
        reserva.horarioFimReal && typeof reserva.horarioFimReal.toDate === "function"
          ? reserva.horarioFimReal.toDate()
          : reserva.horarioFimReal instanceof Date
            ? reserva.horarioFimReal
            : new Date();
      horaFim = format(dateObj, "HH:mm");
    } catch (e) {
      horaFim = reserva.horarioDevolucaoPrevisto || "00:00";
    }
  }

  return `${formattedData}\n${horaInicio} - ${horaFim}`;
};
