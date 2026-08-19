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
        typeof reserva.horarioFimReal.toDate === "function"
          ? reserva.horarioFimReal.toDate()
          : new Date(reserva.horarioFimReal);
      horaFim = format(dateObj, "HH:mm");
    } catch (e) {
      horaFim = reserva.horarioDevolucaoPrevisto || "00:00";
    }
  }

  return `${formattedData}\n${horaInicio} - ${horaFim}`;
};

/**
 * Converte qualquer formato de data usado no sistema em timestamp (ms).
 * Aceita: Firestore Timestamp ({seconds}), Date, número (epoch), string ISO ou "DD/MM/YYYY HH:mm".
 */
export const parseOperacaoTimestamp = (val: any): number | null => {
  if (!val) return null;
  if (val instanceof Date) return val.getTime();
  if (typeof val === "number" && !isNaN(val)) {
    return val > 1e12 ? val : val * 1000; // ms ou segundos
  }
  if (typeof val === "object" && "seconds" in val && typeof val.seconds === "number") {
    return val.seconds * 1000;
  }
  if (typeof val === "object" && typeof val.toDate === "function") {
    try {
      return val.toDate().getTime();
    } catch (e) {
      return null;
    }
  }
  const s = String(val).trim();
  if (!s) return null;
  const t = new Date(s).getTime();
  return isNaN(t) ? null : t;
};

/**
 * Calcula a duração real da operação em horas (iniciadoEm -> finalizadoEm).
 * Retorna null quando não há como calcular (operação sem início/fim registrados).
 */
export const calcularDuracaoOperacao = (reserva: Reserva): number | null => {
  const start = parseOperacaoTimestamp(reserva.iniciadoEm);
  const end = parseOperacaoTimestamp(reserva.finalizadoEm);
  if (start == null || end == null) return null;
  const diffHoras = (end - start) / (1000 * 60 * 60);
  return diffHoras >= 0 ? diffHoras : null;
};

/**
 * Formata duração em horas para exibição: "2h 30min" ou "1h" ou "—".
 */
export const formatarDuracao = (horas: number | null | undefined): string => {
  if (horas == null || isNaN(horas) || horas < 0) return "—";
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};
