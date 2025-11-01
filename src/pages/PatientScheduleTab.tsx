import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createLocalDateFromISOString } from "@/lib/utils"; // Import createLocalDateFromISOString
import { startOfDay, endOfDay } from "date-fns"; // Import startOfDay and endOfDay

// Importar as novas funções de data e queries
import { getDatesForTimeframe, toUtcIso } from "@/lib/dates";
import { fetchSlotsData } from "@/lib/supabase-queries";

export const PatientScheduleTab = () => {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(format(new Date(), "yyyy-MM-dd")); // Initialize with current date string
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedSlotStartTime, setSelectedSlotStartTime] = useState<string | null>(null);
  const [selectedSlotEndTime, setSelectedSlotEndTime] = useState<string | null>(null);

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      console.log("PatientScheduleTab: Fetching doctors...");
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tempo limite excedido ao carregar médicos.")), 30000)
        );
        const { data, error } = await Promise.race([
          supabase.rpc("get_doctors_public"),
          timeoutPromise,
        ]);
        if (error) {
          console.error("PatientScheduleTab: Error fetching doctors:", error);
          throw error;
        }
        console.log("PatientScheduleTab: Doctors fetched:", data);
        return data;
      } catch (err: any) {
        console.error("PatientScheduleTab: Error in fetchDoctors (catch block):", err);
        toast.error(err.message || "Não foi possível carregar a lista de médicos devido a um erro de rede ou tempo limite.");
        throw err;
      }
    },
  });

  const { data: availableDates, isLoading: isLoadingAvailableDates } = useQuery({
    queryKey: ["availableDates", selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) {
        console.log("PatientScheduleTab: Skipping fetch available dates, no doctor selected.");
        return [];
      }
      console.log("PatientScheduleTab: Fetching available dates for doctor:", selectedDoctorId);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tempo limite excedido ao carregar datas disponíveis.")), 30000)
        );
        const { data, error } = await Promise.race([
          supabase.rpc("get_doctor_available_dates", {
            _doctor_id: selectedDoctorId,
          }),
          timeoutPromise,
        ]);
        if (error) {
          console.error("PatientScheduleTab: Error fetching available dates:", error);
          throw error;
        }
        console.log("PatientScheduleTab: Available dates fetched:", data);
        // Convert string dates (YYYY-MM-DD) from Supabase into local Date objects
        return data.map((dateString: string) => {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day); // Month is 0-indexed
        });
      } catch (err: any) {
        console.error("PatientScheduleTab: Error in fetchAvailableDates (catch block):", err);
        toast.error(err.message || "Não foi possível carregar as datas disponíveis devido a um erro de rede ou tempo limite.");
        throw err;
      }
    },
    enabled: !!selectedDoctorId,
  });

  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["availableSlots", selectedDoctorId, selectedDate],
    queryFn: async () => {
      if (!selectedDoctorId || !selectedDate) {
        console.log("PatientScheduleTab: Skipping fetch available slots, doctor or date missing. Doctor:", selectedDoctorId, "Date:", selectedDate);
        return [];
      }
      
      const localSelectedDateObj = createLocalDateFromISOString(selectedDate);
      
      const startOfDayLocal = startOfDay(localSelectedDateObj);
      const endOfDayLocal = endOfDay(localSelectedDateObj);

      console.log("PatientScheduleTab: Fetching available slots for doctor:", selectedDoctorId, "date (startOfDayLocal):", startOfDayLocal.toISOString(), "date (endOfDayLocal):", endOfDayLocal.toISOString());
      try {
        const result = await fetchSlotsData(selectedDoctorId, startOfDayLocal, endOfDayLocal);
        console.log("PatientScheduleTab: Raw slots fetched by fetchSlotsData:", result.slots); // ADDED LOG FOR DEBUGGING
        return result.slots.filter(slot => slot.is_available); // Only return truly available slots
      } catch (err: any) {
        console.error("PatientScheduleTab: Error in fetchSlotsData (catch block):", err);
        toast.error(err.message || "Não foi possível carregar os horários disponíveis devido a um erro de rede ou tempo limite.");
        throw err;
      }
    },
    enabled: !!selectedDoctorId && !!selectedDate,
  });

  // Realtime subscription for availability_slots
  useEffect(() => {
    console.log("PatientScheduleTab: Setting up real-time subscription for availability_slots.");
    const channel = supabase
      .channel('public:availability_slots')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability_slots' },
        (payload) => {
          console.log('PatientScheduleTab: Real-time change detected in availability_slots:', payload);
          // Invalidate queries to force re-fetch of available dates and slots
          queryClient.invalidateQueries({ queryKey: ["availableDates", selectedDoctorId] });
          queryClient.invalidateQueries({ queryKey: ["availableSlots", selectedDoctorId, selectedDate] });
        }
      )
      .subscribe();

    return () => {
      console.log("PatientScheduleTab: Unsubscribing from real-time channel.");
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedDoctorId, selectedDate]); // Dependências para re-subscrição se o doutor/data mudar

  const handleScheduleAppointment = async () => {
    if (!selectedDoctorId || !selectedSlotId || !selectedSlotStartTime || !selectedSlotEndTime) {
      toast.error("Por favor, selecione um profissional, uma data e um horário.");
      return;
    }

    const { data: userSession, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !userSession.session) {
      toast.error("Você precisa estar logado para agendar uma consulta.");
      return;
    }

    const patientId = userSession.session.user.id;

    try {
      // Ajustar start_time e end_time para UTC antes de enviar ao Supabase
      const startTimeUTC = toUtcIso(new Date(selectedSlotStartTime));
      const endTimeUTC = toUtcIso(new Date(selectedSlotEndTime));

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite excedido ao agendar consulta.")), 30000)
      );

      const { data, error } = await Promise.race([
        supabase.rpc("book_slot_and_create_appointment", {
          _slot_id: selectedSlotId,
          _patient_id: patientId,
          _doctor_id: selectedDoctorId,
          _start_time: startTimeUTC,
          _end_time: endTimeUTC,
        }),
        timeoutPromise,
      ]);

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success("Consulta agendada com sucesso!");
      setSelectedSlotId(null);
      setSelectedSlotStartTime(null);
      setSelectedSlotEndTime(null);
      // Força o re-fetch das queries para atualizar a disponibilidade imediatamente
      console.log("PatientScheduleTab: Forcing re-fetch of available dates and slots after successful booking.");
      await queryClient.refetchQueries({ queryKey: ["availableDates", selectedDoctorId] });
      await queryClient.refetchQueries({ queryKey: ["availableSlots", selectedDoctorId, selectedDate] });
    } catch (error: any) {
      console.error("Erro ao agendar consulta:", error);
      toast.error(error.message || "Erro ao agendar consulta. Tente novamente.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecione um profissional</CardTitle>
        <CardDescription>Escolha o profissional para ver os horários disponíveis</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2">
          <label htmlFor="doctor-select" className="text-sm font-medium">
            Profissional
          </label>
          <Select
            onValueChange={(value) => {
              setSelectedDoctorId(value);
              setSelectedSlotId(null); // Reset slot when doctor changes
              setSelectedSlotStartTime(null);
              setSelectedSlotEndTime(null);
            }}
            value={selectedDoctorId || ""}
            disabled={isLoadingDoctors}
          >
            <SelectTrigger id="doctor-select">
              <SelectValue placeholder={isLoadingDoctors ? "Carregando profissionais..." : "Selecione um profissional"} />
            </SelectTrigger>
            <SelectContent>
              {doctors?.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="date-picker" className="text-sm font-medium">
            Data
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={!selectedDoctorId}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(createLocalDateFromISOString(selectedDate), "PPP", { locale: ptBR }) // Usar a nova função
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate ? createLocalDateFromISOString(selectedDate) : undefined} // Usar a nova função
                onSelect={(date) => {
                  if (date) {
                    // Constrói a string yyyy-MM-dd a partir dos componentes locais da data
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const iso = `${year}-${month}-${day}`;
                    console.log("Patient Calendar: Date selected:", iso);
                    setSelectedDate(iso);
                    setSelectedSlotId(null); // Reset slot when date changes
                    setSelectedSlotStartTime(null);
                    setSelectedSlotEndTime(null);
                  } else {
                    setSelectedDate(undefined);
                    setSelectedSlotId(null);
                    setSelectedSlotStartTime(null);
                    setSelectedSlotEndTime(null);
                  }
                }}
                initialFocus
                locale={ptBR}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Local start of today

                  // Disable past dates
                  if (date < today) {
                    return true;
                  }

                  // If a doctor is selected and we have available dates, disable dates not in the list
                  if (selectedDoctorId && availableDates) {
                    // Get the YYYY-MM-DD string for the date being checked by the calendar
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const dateToCheckString = `${year}-${month}-${day}`;

                    // Check if this date string exists in the availableDates (which are Date objects)
                    const isDateAvailable = availableDates.some(d => {
                      const availableYear = d.getFullYear();
                      const availableMonth = (d.getMonth() + 1).toString().padStart(2, '0');
                      const availableDay = d.getDate().toString().padStart(2, '0');
                      const availableDateString = `${availableYear}-${availableMonth}-${availableDay}`;
                      return availableDateString === dateToCheckString;
                    });
                    return !isDateAvailable;
                  }

                  return false;
                }}
                modifiers={{
                  available: availableDates, // Passa o array de objetos Date
                }}
                modifiersStyles={{
                  available: { fontWeight: 'bold', color: 'hsl(var(--primary))' }, // Usa a cor primária do Tailwind
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <label htmlFor="time-slot-select" className="text-sm font-medium">
            Horário
          </label>
          <Select
            onValueChange={(value) => {
              const [slotId, startTime, endTime] = value.split("|");
              setSelectedSlotId(slotId);
              setSelectedSlotStartTime(startTime);
              setSelectedSlotEndTime(endTime);
            }}
            value={selectedSlotId ? `${selectedSlotId}|${selectedSlotStartTime}|${selectedSlotEndTime}` : ""}
            disabled={!selectedDoctorId || !selectedDate || isLoadingSlots || (availableSlots?.length === 0 && !isLoadingSlots)}
          >
            <SelectTrigger id="time-slot-select">
              <SelectValue placeholder={isLoadingSlots ? "Carregando horários..." : (availableSlots?.length === 0 ? "Nenhum horário disponível" : "Selecione um horário")} />
            </SelectTrigger>
            <SelectContent>
              {availableSlots?.map((slot) => (
                <SelectItem
                  key={slot.id}
                  value={`${slot.id}|${slot.start_time}|${slot.end_time}`}
                >
                  {format(new Date(slot.start_time), "HH:mm", { locale: ptBR })} - {format(new Date(slot.end_time), "HH:mm", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleScheduleAppointment}
          disabled={!selectedDoctorId || !selectedDate || !selectedSlotId}
          className="w-full"
        >
          Agendar Consulta
        </Button>
      </CardContent>
    </Card>
  );
};