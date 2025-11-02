import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type AvailabilitySlot = Tables<'availability_slots'>;

export async function getDoctorAvailabilitySlots(
  doctorId: string,
  _start_time_gte: string,
  _end_time_lte: string
): Promise<{ total: number; available: number; occupied: number; slots: AvailabilitySlot[] }> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("doctor_id", doctorId)
    .gte("start_time", _start_time_gte)
    .lte("end_time", _end_time_lte);

  if (error) {
    console.error("Error fetching doctor availability slots:", error.message);
    throw error;
  }

  const slots: AvailabilitySlot[] = data || [];

  // Retorna todos os slots, a lógica de contagem será feita na Visão Geral
  const availableSlots = slots.filter(slot => slot.is_available);
  const occupiedSlots = slots.filter(slot => !slot.is_available);

  return {
    total: slots.length,
    available: availableSlots.length,
    occupied: occupiedSlots.length,
    slots: slots,
  };
}