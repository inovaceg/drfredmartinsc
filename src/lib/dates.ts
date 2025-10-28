import { startOfDay, endOfDay, addDays } from "date-fns";

/**
 * Gera um objeto de data com `start` e `end` para um determinado período.
 * As datas geradas são objetos Date no fuso horário local.
 *
 * @param tf O período de tempo ('today', '7_days', '14_days', 'custom').
 * @param customStart Data de início personalizada (apenas para 'custom').
 * @param customEnd Data de fim personalizada (apenas para 'custom').
 * @returns Um objeto com as datas de início e fim do período.
 */
export function getDatesForTimeframe(
  tf: "today" | "7_days" | "14_days" | "custom",
  customStart?: Date,
  customEnd?: Date
) {
  const now = new Date();
  if (tf === "today") {
    const start = startOfDay(now);
    const end = endOfDay(now); // inclui 23:59:59.999
    return { start, end };
  }
  if (tf === "7_days" || tf === "14_days") {
    const days = tf === "7_days" ? 7 : 14;
    const start = startOfDay(now);
    // Inclui o último dia completo:
    const end = endOfDay(addDays(now, days - 1));
    return { start, end };
  }
  // custom
  if (customStart && customEnd) {
    return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  }
  // fallback seguro:
  const start = startOfDay(now);
  const end = endOfDay(now);
  return { start, end };
}

/**
 * Converte um objeto Date local para uma string ISO 8601 em UTC.
 * Isso é importante para garantir que o Supabase (que usa TIMESTAMP WITH TIME ZONE)
 * interprete corretamente o momento exato, independentemente do fuso horário do cliente.
 *
 * @param d O objeto Date local a ser convertido.
 * @returns Uma string ISO 8601 em UTC.
 */
export function toUtcIso(d: Date) {
  // A correção é simplesmente chamar toISOString() no objeto Date.
  // O objeto Date já contém o instante de tempo correto, e toISOString()
  // o converte para sua representação UTC.
  return d.toISOString();
}