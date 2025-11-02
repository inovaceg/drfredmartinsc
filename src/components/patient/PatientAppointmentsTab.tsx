"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser"; // Import useUser
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<'appointments'>;
type Profile = Tables<'profiles'>;

interface AppointmentWithDoctor extends Appointment {
  doctor_profile?: Profile | null;
}

export function PatientAppointmentsTab() {
  const { user } = useUser(); // Use the useUser hook
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const patientId = user?.id;

  const fetchAppointments = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    try {
      const { data: fetchedAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const doctorIds = [...new Set((fetchedAppointments || []).map(apt => apt.doctor_id).filter(Boolean) as string[])];
      let doctorProfiles: Profile[] = [];

      if (doctorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.rpc('get_doctor_profiles_by_ids', { _ids: doctorIds }).returns<Profile[]>(); // Explicitly type RPC return
        if (profilesError) {
          console.error("Error fetching doctor profiles:", profilesError.message);
        } else {
          doctorProfiles = profilesData || [];
        }
      }

      const appointmentsWithDoctors = (fetchedAppointments || []).map(apt => ({
        ...apt,
        doctor_profile: doctorProfiles?.find((p: Profile) => p.id === apt.doctor_id)
      }));

      setAppointments(appointmentsWithDoctors);
    } catch (error: any) {
      console.error("Error fetching appointments:", error.message);
      toast.error("Erro ao carregar agendamentos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDeleteAppointment = async (appointmentId: string, slotId: string | null) => {
    if (!patientId) return;

    setDeleting(true);
    try {
      // Delete the appointment
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('patient_id', patientId);

      if (deleteError) throw deleteError;

      // Make the slot available again if it exists
      if (slotId) {
        const { error: slotUpdateError } = await supabase
          .from('availability_slots')
          .update({ is_available: true })
          .eq('id', slotId);
        if (slotUpdateError) console.error("Error making slot available:", slotUpdateError.message);
      }

      toast.success("Agendamento cancelado com sucesso!");
      fetchAppointments(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting appointment:", error.message);
      toast.error("Erro ao cancelar agendamento: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum agendamento futuro.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold">
                      Consulta com {appointment.doctor_profile?.full_name || "Doutor(a) Desconhecido"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                      {format(parseISO(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-muted-foreground text-sm">Status: {appointment.status}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Cancelamento</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {}}>
                          Manter Agendamento
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteAppointment(appointment.id, appointment.slot_id)}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            "Sim, Cancelar"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}