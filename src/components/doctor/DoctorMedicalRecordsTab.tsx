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

// New component for adding a therapy session
interface AddTherapySessionDialogProps {
  onSave: (formData: {
    session_date: Date;
    session_theme: string;
    interventions_used: string;
    notes: string;
    homework: string;
  }) => Promise<void>;
  onClose: () => void;
  open: boolean;
  patientId: string;
}

const AddTherapySessionDialog: React.FC<AddTherapySessionDialogProps> = ({ onSave, onClose, open, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_date: new Date(),
    session_theme: "",
    interventions_used: "",
    notes: "",
    homework: "",
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        session_date: new Date(),
        session_theme: "",
        interventions_used: "",
        notes: "",
        homework: "",
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Sessão de Terapia</DialogTitle>
          <DialogDescription>
            Registre uma nova sessão para o paciente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session_date">Data da Sessão *</Label>
            <Input
              id="session_date"
              type="datetime-local"
              value={format(formData.session_date, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setFormData({ ...formData, session_date: new Date(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_theme">Tema da Sessão</Label>
            <Input
              id="session_theme"
              value={formData.session_theme}
              onChange={(e) => setFormData({ ...formData, session_theme: e.target.value })}
              placeholder="Ex: Ansiedade, Relacionamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interventions_used">Intervenções Utilizadas</Label>
            <Textarea
              id="interventions_used"
              value={formData.interventions_used}
              onChange={(e) => setFormData({ ...formData, interventions_used: e.target.value })}
              placeholder="Técnicas e abordagens utilizadas..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas sobre o Estado Emocional</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o paciente durante a sessão..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homework">Tarefas de Casa</Label>
            <Textarea
              id="homework"
              value={formData.homework}
              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
              placeholder="Atividades ou reflexões recomendadas para o paciente..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Sessão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// New component for adding a medical record
interface AddMedicalRecordDialogProps {
  onSave: (formData: {
    diagnosis: string;
    prescription: string;
    notes: string;
  }) => Promise<void>;
  onClose: () => void;
  open: boolean;
  patientId: string;
}

const AddMedicalRecordDialog: React.FC<AddMedicalRecordDialogProps> = ({ onSave, onClose, open, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: "",
    prescription: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        diagnosis: "",
        prescription: "",
        notes: "",
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Prontuário Médico</DialogTitle>
          <DialogDescription>
            Registre um novo prontuário para o paciente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Ex: Transtorno de Ansiedade Generalizada"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prescription">Prescrição</Label>
            <Textarea
              id="prescription"
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
              placeholder="Medicamentos, dosagem, frequência..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Médicas Gerais</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações gerais sobre o estado de saúde do paciente..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Prontuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


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
      const { data, error } = await supabase.rpc("get_patients_for_doctor").returns<Profile[]>(); // Explicitly type RPC return
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
                <AddTherapySessionDialog
                  open={isAddSessionDialogOpen}
                  onClose={() => setIsAddSessionDialogOpen(false)}
                  onSave={handleAddSession}
                  patientId={selectedPatientId}
                />
                <Button size="sm" onClick={() => setIsAddSessionDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Sessão
                </Button>
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
                            <Button variant="ghost" size="icon" onClick={() => { setEditingSession(session); }}>
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
                <AddMedicalRecordDialog
                  open={isAddMedicalRecordDialogOpen}
                  onClose={() => setIsAddMedicalRecordDialogOpen(false)}
                  onSave={handleAddMedicalRecord}
                  patientId={selectedPatientId}
                />
                <Button size="sm" onClick={() => setIsAddMedicalRecordDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Prontuário
                </Button>
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
                            <Button variant="ghost" size="icon" onClick={() => { setEditingMedicalRecord(record); }}>
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
            open={!!editingSession}
            onOpenChange={() => setEditingSession(null)}
            onSessionUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["patientSessions", selectedPatientId] });
              setEditingSession(null);
            }}
          />
        )}

        {editingMedicalRecord && (
          <EditMedicalRecordDialog
            record={editingMedicalRecord}
            open={!!editingMedicalRecord}
            onOpenChange={() => setEditingMedicalRecord(null)}
            onRecordUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["patientMedicalRecords", selectedPatientId] });
              setEditingMedicalRecord(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}