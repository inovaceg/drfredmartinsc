"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EditTherapySessionDialog } from "@/components/doctor/EditTherapySessionDialog";
import { EditMedicalRecordDialog } from "@/components/doctor/EditMedicalRecordDialog";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;
type Session = Tables<'sessions'>;
type MedicalRecord = Tables<'medical_records'>;

export function DoctorMedicalRecordsTab() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [isAddMedicalRecordDialogOpen, setIsAddMedicalRecordDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<MedicalRecord | null>(null);

  // Fetch Patients
  const {
    data: patients,
    isLoading: isLoadingPatients,
    isError: isErrorPatients,
    error: errorPatients,
  } = useQuery<Profile[], Error>({
    queryKey: ["patientsForDoctor", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase.rpc("get_patients_for_doctor");
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId,
    onSuccess: (data) => { // Add onSuccess callback to automatically select the first patient
      if (data && data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    },
  });

  // Fetch Selected Patient Profile
  const {
    data: selectedPatientProfile,
    isLoading: isLoadingSelectedPatient,
    isError: isErrorSelectedPatient,
    error: errorSelectedPatient,
  } = useQuery<Profile | null, Error>({
    queryKey: ["selectedPatientProfile", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedPatientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  // Fetch Sessions for Selected Patient
  const {
    data: patientSessions,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    error: errorSessions,
  } = useQuery<Session[], Error>({
    queryKey: ["patientSessions", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', selectedPatientId)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPatientId,
  });

  // Fetch Medical Records for Selected Patient
  const {
    data: patientMedicalRecords,
    isLoading: isLoadingMedicalRecords,
    isError: isErrorMedicalRecords,
    error: errorMedicalRecords,
  } = useQuery<MedicalRecord[], Error>({
    queryKey: ["patientMedicalRecords", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', selectedPatientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPatientId,
  });

  const handleAddSession = async (formData: {
    session_date: Date;
    session_theme: string;
    interventions_used: string;
    notes: string;
    homework: string;
  }) => {
    if (!selectedPatientId || !currentUserId) {
      toast.error("Selecione um paciente e certifique-se de estar logado.");
      return;
    }

    try {
      const sessionToInsert = {
        patient_id: selectedPatientId,
        therapist_id: currentUserId,
        session_date: formData.session_date.toISOString(),
        session_theme: formData.session_theme || null,
        interventions_used: formData.interventions_used || null,
        notes: formData.notes || null,
        homework: formData.homework || null,
      };

      const { error } = await supabase
        .from('sessions')
        .insert(sessionToInsert)
        .select();

      if (error) throw error;

      toast.success("Sessão adicionada com sucesso!");
      setIsAddSessionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patientSessions", selectedPatientId] });
    } catch (error: any) {
      console.error("Error adding session:", error.message);
      toast.error("Erro ao adicionar sessão: " + error.message);
    }
  };

  const handleAddMedicalRecord = async (formData: {
    diagnosis: string;
    prescription: string;
    notes: string;
  }) => {
    if (!selectedPatientId || !currentUserId) {
      toast.error("Selecione um paciente e certifique-se de estar logado.");
      return;
    }

    try {
      const recordToInsert = {
        patient_id: selectedPatientId,
        doctor_id: currentUserId,
        diagnosis: formData.diagnosis || null,
        prescription: formData.prescription || null,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('medical_records')
        .insert(recordToInsert)
        .select();

      if (error) throw error;

      toast.success("Prontuário adicionado com sucesso!");
      setIsAddMedicalRecordDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patientMedicalRecords", selectedPatientId] });
    } catch (error: any) {
      console.error("Error adding medical record:", error.message);
      toast.error("Erro ao adicionar prontuário: " + error.message);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return;
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
      toast.success("Sessão excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patientSessions", selectedPatientId] });
    } catch (error: any) {
      console.error("Error deleting session:", error.message);
      toast.error("Erro ao excluir sessão: " + error.message);
    }
  };

  const handleDeleteMedicalRecord = async (recordId: string) => {
    if (!confirm("Tem certeza que deseja excluir este prontuário?")) return;
    try {
      const { error } = await supabase.from('medical_records').delete().eq('id', recordId);
      if (error) throw error;
      toast.success("Prontuário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patientMedicalRecords", selectedPatientId] });
    } catch (error: any) {
      console.error("Error deleting medical record:", error.message);
      toast.error("Erro ao excluir prontuário: " + error.message);
    }
  };

  if (isLoadingPatients) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isErrorPatients) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar pacientes: {errorPatients?.message}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prontuários e Sessões de Pacientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="patient-select">Selecionar Paciente</Label>
          <Select
            onValueChange={(value) => setSelectedPatientId(value)}
            value={selectedPatientId || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingPatients ? "Carregando pacientes..." : (patients && patients.length > 0 ? "Selecione um paciente" : "Nenhum paciente encontrado")} />
            </SelectTrigger>
            <SelectContent>
              {patients?.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPatientId && (
          <>
            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  Sessões de Terapia
                </CardTitle>
                <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Sessão
                    </Button>
                  </DialogTrigger>
                  <EditTherapySessionDialog
                    session={null}
                    onSave={handleAddSession}
                    onClose={() => setIsAddSessionDialogOpen(false)}
                  />
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSessions ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : isErrorSessions ? (
                  <p className="text-red-500">
                    Erro ao carregar sessões: {errorSessions?.message}
                  </p>
                ) : patientSessions && patientSessions.length > 0 ? (
                  <div className="space-y-3">
                    {patientSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-3 bg-background">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">
                            Sessão em: {format(parseISO(session.session_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingSession(session); setIsAddSessionDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar Sessão</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir Sessão</span>
                            </Button>
                          </div>
                        </div>
                        {session.session_theme && <p className="text-sm text-muted-foreground">Tema: {session.session_theme}</p>}
                        {session.notes && <p className="text-sm mt-1">Notas: {session.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma sessão de terapia registrada.</p>
                )}
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  Prontuários Médicos
                </CardTitle>
                <Dialog open={isAddMedicalRecordDialogOpen} onOpenChange={setIsAddMedicalRecordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Prontuário
                    </Button>
                  </DialogTrigger>
                  <EditMedicalRecordDialog
                    record={null}
                    onSave={handleAddMedicalRecord}
                    onClose={() => setIsAddMedicalRecordDialogOpen(false)}
                  />
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingMedicalRecords ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : isErrorMedicalRecords ? (
                  <p className="text-red-500">
                    Erro ao carregar prontuários: {errorMedicalRecords?.message}
                  </p>
                ) : patientMedicalRecords && patientMedicalRecords.length > 0 ? (
                  <div className="space-y-3">
                    {patientMedicalRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-3 bg-background">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">
                            Registro em: {format(parseISO(record.created_at || ""), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingMedicalRecord(record); setIsAddMedicalRecordDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar Prontuário</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMedicalRecord(record.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir Prontuário</span>
                            </Button>
                          </div>
                        </div>
                        {record.diagnosis && <p className="text-sm text-muted-foreground">Diagnóstico: {record.diagnosis}</p>}
                        {record.prescription && <p className="text-sm text-muted-foreground">Prescrição: {record.prescription}</p>}
                        {record.notes && <p className="text-sm mt-1">Notas: {record.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum prontuário médico registrado.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {editingSession && (
          <EditTherapySessionDialog
            session={editingSession}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ["patientSessions", selectedPatientId] });
              setEditingSession(null);
              setIsAddSessionDialogOpen(false);
            }}
            onClose={() => {
              setEditingSession(null);
              setIsAddSessionDialogOpen(false);
            }}
          />
        )}

        {editingMedicalRecord && (
          <EditMedicalRecordDialog
            record={editingMedicalRecord}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ["patientMedicalRecords", selectedPatientId] });
              setEditingMedicalRecord(null);
              setIsAddMedicalRecordDialogOpen(false);
            }}
            onClose={() => {
              setEditingMedicalRecord(null);
              setIsAddMedicalRecordDialogOpen(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}