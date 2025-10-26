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
      const { data, error } = await supabase.rpc("get_doctors_public");
      if (error) {
        console.error("PatientScheduleTab: Error fetching doctors:", error);
        throw error;
      }
      console.log("PatientScheduleTab: Doctors fetched:", data);
      return data;
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
      const { data, error } = await supabase.rpc("get_doctor_available_dates", {
        _doctor_id: selectedDoctorId,
      });
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
      
      // Cria objetos Date para o início e fim do dia no fuso horário local do usuário
      const localSelectedDate = new Date(selectedDate);
      
      const startOfDayLocal = new Date(localSelectedDate);
      startOfDayLocal.setHours(0, 0, 0, 0); // Define para meia-noite local
      
      const endOfDayLocal = new Date(localSelectedDate);
      endOfDayLocal.setHours(23, 59, 59, 999); // Define para o final do dia local

      // Converte esses objetos Date locais para strings ISO (que serão em UTC)
      const _start_time_gte = startOfDayLocal.toISOString();
      const _end_time_lte = endOfDayLocal.toISOString();

      console.log("PatientScheduleTab: Fetching available slots for doctor:", selectedDoctorId, "date (startOfDayUTC):", _start_time_gte, "date (endOfDayUTC):", _end_time_lte);
      const { data, error } = await supabase.rpc("get_truly_available_slots", {
        _doctor_id: selectedDoctorId,
        _start_time_gte: _start_time_gte,
        _end_time_lte: _end_time_lte,
      });
      if (error) {
        console.error("PatientScheduleTab: Error fetching available slots:", error);
        throw error;
      }
      console.log("PatientScheduleTab: Raw available slots fetched from RPC:", data);
      
      // No longer need client-side filtering as RPC handles it
      return data;
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
      const startTimeUTC = new Date(selectedSlotStartTime).toISOString();
      const endTimeUTC = new Date(selectedSlotEndTime).toISOString();

      const { data, error } = await supabase.rpc("book_slot_and_create_appointment", {
        _slot_id: selectedSlotId,
        _patient_id: patientId,
        _doctor_id: selectedDoctorId,
        _start_time: startTimeUTC,
        _end_time: endTimeUTC,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success("Consulta agendada com sucesso!");
      setSelectedSlotId(null);
      setSelectedSlotStartTime(null);
      setSelectedSlotEndTime(null);
      // Invalida queries para atualizar a disponibilidade imediatamente
      queryClient.invalidateQueries({ queryKey: ["availableDates", selectedDoctorId] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots", selectedDoctorId, selectedDate] });
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      // toast.error("Erro ao agendar consulta. Tente novamente.");
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
              <SelectValue placeholder="Selecione um profissional" />
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
                  format(new Date(selectedDate), "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
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