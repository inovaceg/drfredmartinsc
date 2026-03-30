"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, FileText, LogOut, Users, Video, Loader2, Edit, User as UserIcon, MessageSquare, Trash2, BookOpen, Menu, ClipboardList, Mail, UserPlus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { AddPatientDialog } from "@/components/doctor/AddPatientDialog";
import { formatPhone } from "@/lib/format-phone";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { DoctorMedicalRecordsTab } from "@/components/doctor/DoctorMedicalRecordsTab";
import { OnlineConsultationTab } from "@/components/OnlineConsultationTab";
import { DoctorFormResponsesTab } from "@/components/DoctorFormResponsesTab";
import { DoctorNewsletterSubscriptionsTab } from "@/components/doctor/DoctorNewsletterSubscriptionsTab";
import { DoctorBlogPostsTab } from "@/components/doctor/DoctorBlogPostsTab";
import { Label } from "@/components/ui/label";
import { cn, createLocalDateFromISOString } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeletePatientAlertDialog } from "@/components/doctor/DeletePatientAlertDialog";
import { useUser } from "@/hooks/useUser";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toUtcIso } from "@/lib/dates";
import { getDoctorAvailabilitySlots } from "@/lib/supabase-queries";

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  patient_profile?: {
    id: string;
    full_name: string;
    whatsapp: string;
    avatar_url?: string;
  };
};
type PatientProfile = Database['public']['Tables']['profiles']['Row'];

const Doctor = () => {
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading, profile } = useUser();
  const [activeTab, setActiveTab] = useState("patients"); // Começar na aba de pacientes para facilitar
  const [selectedDate, setSelectedDate] = useState<string | undefined>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingScheduleSlots, setIsLoadingScheduleSlots] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientIdToEdit, setSelectedPatientIdToEdit] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initiatingCallForPatientId, setInitiatingCallForPatientId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listagem de Pacientes
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["doctorPatients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_patients_for_doctor');
      if (error) throw error;
      return (data as PatientProfile[]) || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!isUserLoading && (!user || !profile?.is_doctor)) {
      navigate("/auth");
    }
  }, [user, isUserLoading, profile, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeletePatient = useCallback(async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', patientToDelete.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Paciente excluído!" });
      queryClient.invalidateQueries({ queryKey: ["doctorPatients"] });
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [patientToDelete, queryClient, toast]);

  const handleInitiateVideoSession = async (patientId: string) => {
    if (!user?.id) return;
    setInitiatingCallForPatientId(patientId);
    try {
      const newSessionId = crypto.randomUUID();
      await supabase.from("video_sessions").insert({
        id: newSessionId,
        user_id: user.id,
        doctor_id: user.id,
        patient_id: patientId,
        room_id: newSessionId,
        status: "ringing",
      });
      toast({ title: "Sucesso", description: "Chamada iniciada!" });
      setActiveTab("online-consultation");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setInitiatingCallForPatientId(null);
    }
  };

  if (isUserLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ErrorBoundary>
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Portal do Profissional</h1>
              <p className="text-muted-foreground">Bem-vindo(a), {profile?.full_name || user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex w-full bg-muted p-1 rounded-lg border overflow-x-auto whitespace-nowrap scrollbar-hide">
              <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
              <TabsTrigger value="schedule">Gerenciar Agenda</TabsTrigger>
              <TabsTrigger value="appointments">Agenda Consultas</TabsTrigger>
              <TabsTrigger value="patients">Meus Pacientes</TabsTrigger>
              <TabsTrigger value="medical-records">Prontuários</TabsTrigger>
              <TabsTrigger value="online-consultation">Consulta Online</TabsTrigger>
              <TabsTrigger value="blog-posts">Gerenciar Blog</TabsTrigger>
              <TabsTrigger value="contact-forms">Formulário Contato</TabsTrigger>
              <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card><CardContent className="p-6">{user?.id && <DoctorProfileForm userId={user.id} onProfileUpdated={() => queryClient.invalidateQueries({ queryKey: ["userProfile"] })} />}</CardContent></Card>
            </TabsContent>

            <TabsContent value="patients">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle>Meus Pacientes</CardTitle>
                    <CardDescription>Gerencie os dados dos seus pacientes.</CardDescription>
                  </div>
                  <Button onClick={() => setAddPatientDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingPatients ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : patients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum paciente cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {patients.map((patient) => (
                        <Card key={patient.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={patient.avatar_url || ""} />
                              <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-lg">{patient.full_name}</p>
                              <p className="text-sm text-muted-foreground">{patient.whatsapp ? `WhatsApp: ${formatPhone(patient.whatsapp)}` : 'Sem WhatsApp'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 sm:mt-0">
                            <Button variant="outline" size="sm" onClick={() => handleInitiateVideoSession(patient.id)} disabled={initiatingCallForPatientId === patient.id}>
                              <Video className="h-4 w-4 mr-2" /> Iniciar Consulta Online
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPatientIdToEdit(patient.id); setEditDialogOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => { setPatientToDelete(patient); setIsDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical-records">
              {user && <DoctorMedicalRecordsTab currentUserId={user.id} setSelectedPatient={setSelectedPatientIdToEdit} />}
            </TabsContent>

            <TabsContent value="online-consultation">
              <OnlineConsultationTab isDoctorView={true} />
            </TabsContent>

            <TabsContent value="blog-posts">
              {user && <DoctorBlogPostsTab currentUserId={user.id} />}
            </TabsContent>

            <TabsContent value="contact-forms">
              <DoctorFormResponsesTab />
            </TabsContent>

            <TabsContent value="newsletter">
              <DoctorNewsletterSubscriptionsTab />
            </TabsContent>
          </Tabs>
        </main>
      </ErrorBoundary>
      <Footer />
      
      {selectedPatientIdToEdit && (
        <EditPatientDialog
          patientId={selectedPatientIdToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onPatientUpdated={() => queryClient.invalidateQueries({ queryKey: ["doctorPatients"] })}
        />
      )}

      {user && (
        <AddPatientDialog
          open={addPatientDialogOpen}
          onOpenChange={setAddPatientDialogOpen}
          doctorId={user.id}
        />
      )}

      <DeletePatientAlertDialog
        patient={patientToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={handleDeletePatient}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Doctor;