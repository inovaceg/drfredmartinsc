"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;
type AvailabilitySlot = Tables<'availability_slots'>;

interface DoctorWithAvailability extends Profile {
  availableDates: Date[];
}

export function PatientScheduleTab() {
  const { user } = useUser();
  const patientId = user?.id;

  const [doctors, setDoctors] = useState<DoctorWithAvailability[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_doctors_public");

      if (error) throw error;

      const doctorsData = (data as Profile[]) || [];

      const doctorsWithDates = await Promise.all(
        doctorsData.map(async (doctor: Profile) => {
          const { data: datesData, error: datesError } = await supabase.rpc("get_doctor_available_dates", {
            _doctor_id: doctor.id,
          });

          if (datesError) {
            console.error(`Error fetching dates for doctor ${doctor.id}:`, datesError.message);
            return { ...doctor, availableDates: [] };
          }
          return { ...doctor, availableDates: ((datesData as string[]) || []).map((d: string) => parseISO(d)) };
        })
      );
      setDoctors(doctorsWithDates);
    } catch (error: any) {
      console.error("Error fetching doctors:", error.message);
      toast.error("Erro ao carregar médicos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoading(true);
    try {
      const startOfDay = format(selectedDate, "yyyy-MM-dd'T'00:00:00-03:00");
      const endOfDay = format(selectedDate, "yyyy-MM-dd'T'23:59:59-03:00");

      const { data, error } = await supabase.rpc("get_truly_available_slots", {
        _doctor_id: selectedDoctor.id,
        _start_time_gte: startOfDay,
        _end_time_lte: endOfDay,
      });

      if (error) throw error;
      setAvailableSlots((data as AvailabilitySlot[]) || []);
    } catch (error: any) {
      console.error("Error fetching available slots:", error.message);
      toast.error("Erro ao carregar horários disponíveis: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  const handleBookAppointment = async () => {
    if (!patientId || !selectedDoctor || !selectedSlot) {
      toast.error("Por favor, selecione um médico, uma data e um horário.");
      return;
    }

    setBookingLoading(true);
    try {
      const { error } = await supabase.rpc("book_slot_and_create_appointment", {
        _slot_id: selectedSlot.id,
        _patient_id: patientId,
        _doctor_id: selectedDoctor.id,
        _start_time: selectedSlot.start_time,
        _end_time: selectedSlot.end_time,
      });

      if (error) throw error;

      toast.success("Consulta agendada com sucesso!");
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setAvailableSlots([]);
      fetchDoctors();
    } catch (error: any) {
      console.error("Error booking appointment:", error.message);
      toast.error("Erro ao agendar consulta: " + error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const modifiers = {
    available: doctors.flatMap(doc => doc.availableDates),
  };

  const modifiersClassNames = {
    available: "bg-green-100 text-green-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Nova Consulta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum médico disponível no momento.</p>
        )}

        {!loading && doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-shadow",
                  selectedDoctor?.id === doctor.id && "border-primary ring-2 ring-primary"
                )}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <CardHeader>
                  <CardTitle>{doctor.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{doctor.specialty || "Especialidade não informada"}</p>
                  <p className="text-sm text-muted-foreground">
                    Horários disponíveis: {doctor.availableDates.length > 0 ? "Sim" : "Não"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedDoctor && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Selecionar Data para {selectedDoctor.full_name}
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || !doctors.find(d => d.id === selectedDoctor.id)?.availableDates.some(ad => isSameDay(ad, date))}
                  initialFocus
                  locale={ptBR}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {selectedDoctor && selectedDate && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              Horários Disponíveis em {format(selectedDate, "PPP", { locale: ptBR })}
            </h3>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted-foreground">Nenhum horário disponível para esta data.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={!slot.is_available}
                  >
                    {format(parseISO(slot.start_time), "HH:mm")} - {format(parseISO(slot.end_time), "HH:mm")}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDoctor && selectedDate && selectedSlot && (
          <Button onClick={handleBookAppointment} className="w-full" disabled={bookingLoading}>
            {bookingLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              "Confirmar Agendamento"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}