import { supabase } from "@/integrations/supabase/client";
import { toUtcIso } from "./dates";
import { Database } from "@/integrations/supabase/types";

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];

/**
 * Busca slots de disponibilidade verdadeiramente disponíveis para um médico em um período.
 * Converte as datas de início e fim para ISO UTC antes de consultar o Supabase.
 *
 * @param doctorId O ID do médico.
 * @param startDate A data de início do período (objeto Date local).
 * @param endDate A data de fim do período (objeto Date local).
 * @returns Uma lista de slots de disponibilidade.
 */
export const fetchSlotsData = async (doctorId: string, startDate: Date, endDate: Date): Promise<{ available: number; occupied: number; total: number; slots: AvailabilitySlot[] }> => {
  if (!doctorId) {
    return { available: 0, occupied: 0, total: 0, slots: [] };
  }

  const _start_time_gte = toUtcIso(startDate);
  const _end_time_lte = toUtcIso(endDate);

  try {
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .gte("start_time", _start_time_gte)
      .lte("end_time", _end_time_lte)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching slots from Supabase:", error);
      throw error;
    }

    // Retorna todos os slots, a lógica de contagem será feita na Visão Geral
    const availableSlots = data.filter(slot => slot.is_available);
    const occupiedSlots = data.filter(slot => !slot.is_available);

    return {
      available: availableSlots.length,
      occupied: occupiedSlots.length,
      total: data.length,
      slots: data,
    };
  } catch (err) {
    console.error("Unexpected error during fetchSlotsData:", err);
    throw err;
  }
};