import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Combina strings de data (YYYY-MM-DD) e hora (HH:mm) em um objeto Date
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  try {
    if (!dateStr) return new Date(0);
    const dateParts = dateStr.split("-").map(Number);
    const timeParts = (timeStr || "00:00").split(":").map(Number);

    const year = dateParts[0] || 0;
    const month = (dateParts[1] || 1) - 1;
    const day = dateParts[2] || 1;
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;

    return new Date(year, month, day, hours, minutes);
  } catch (e) {
    return new Date(0);
  }
}
