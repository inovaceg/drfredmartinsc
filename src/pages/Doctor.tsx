import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, FileText, LogOut, Users, Video, BarChart3, Loader2, Edit, User as UserIcon, MessageSquare, Trash2, CheckCircle, XCircle, MessageSquareText, MapPin, Phone, Mail, BookOpen, Menu, ClipboardList } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { formatPhone } from "@/lib/format-phone";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { DoctorMedicalRecordsTab } from "@/components/doctor/DoctorMedicalRecordsTab";
import { DoctorOnlineConsultationTab } from "@/components/DoctorOnlineConsultationTab";
import { DoctorFormResponsesTab } from "@/components/DoctorFormResponsesTab";
import { DoctorNewsletterSubscriptionsTab } from "@/components/DoctorNewsletterSubscriptionsTab";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLocalDateFromISOString, formatDateToDisplay } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Database } from "@/integrations/supabase/types";

type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row'];
type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  patient_profile?: {
    id: string;
    full_name: string;
    whatsapp: string;
    street: string;
    street_number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
};
type PatientProfile = Database['public']['Tables']['profiles']['Row'];

const Doctor = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatientForBookingId, setSelectedPatientForBookingId] = useState<string | null>(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ id: string; start_time: string; end_time: string } | null>(null);
  const [isBookingForPatient, setIsBookingForPatient] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchDoctorProfile = useCallback(async (userId: string) => {
    console.log("Doctor.tsx: Buscando perfil do doutor para userId:", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Doctor.tsx: Erro ao buscar perfil do doutor:", error);
      toast({
        title: "Erro ao carregar perfil do doutor",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      console.log("Doctor.tsx: Perfil do doutor encontrado:", data);
      setDoctorProfile(data);
    }
  }, [toast]);

  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log("Doctor.tsx: Auth state change event:", event, "Sessão:", session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        console.log("Doctor.tsx: Evento SIGNED_OUT detectado. Redirecionando para /auth.");
        setDoctorProfile(null);
        navigate("/auth");
      } else if (session?.user) {
        console.log("Doctor.tsx: Usuário logado, buscando perfil e dados.");
        await fetchDoctorProfile(session.user.id);
        fetchSlots(session.user.id, selectedDate);
        fetchAppointments();
        fetchPatients(session.user.id);
      } else {
        console.log("Doctor.tsx: Nenhum usuário logado, redirecionando para /auth.");
        navigate("/auth");
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Doctor.tsx: Verificação inicial da sessão. Sessão:", session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        console.log("Doctor.tsx: Usuário logado inicialmente, buscando perfil e dados.");
        await fetchDoctorProfile(session.user.id);
        fetchSlots(session.user.id, selectedDate);
        fetchAppointments();
        fetchPatients(session.user.id);
      } else {
        console.log("Doctor.tsx: Nenhum usuário logado inicialmente, redirecionando para /auth.");
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Doctor.tsx: Desinscrevendo do listener de auth state change.");
      subscription.unsubscribe();
    };
  }, [navigate, selectedDate, fetchDoctorProfile]);

  const fetchSlots = useCallback(async (doctorId: string | undefined = user?.id, date: string | undefined = selectedDate) => {
    if (!doctorId || !date) {
      console.log("Doctor.tsx: Skipping fetchSlots, doctorId or date is missing. DoctorId:", doctorId, "Date:", date);
      return;
    }
    setIsLoadingSlots(true);
    
    // Cria objetos Date para o início e fim do dia no fuso horário local do usuário
    const localSelectedDateObj = createLocalDateFromISOString(date);
    
    const startOfDayLocal = new Date(localSelectedDateObj);
    startOfDayLocal.setHours(0, 0, 0, 0); // Define para meia-noite local
    
    const endOfDayLocal = new Date(localSelectedDateObj);
    endOfDayLocal.setHours(23, 59, 59, 999); // Define para o final do dia local

    // Converte esses objetos Date locais para strings ISO (que serão em UTC)
    const _start_time_gte = startOfDayLocal.toISOString();
    const _end_time_lte = endOfDayLocal.toISOString();

    console.log("Doctor.tsx: Fetching slots for doctor:", doctorId, "date (startOfDayUTC):", _start_time_gte, "date (endOfDayUTC):", _end_time_lte);
    const { data, error } = await supabase.rpc("get_truly_available_slots", {
      _doctor_id: doctorId,
      _start_time_gte: _start_time_gte,
      _end_time_lte: _end_time_lte,
    });

    if (error) {
      console.error("Doctor.tsx: Error fetching slots:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setSlots([]);
    } else {
      console.log("Doctor.tsx: Slots fetched:", data);
      setSlots(data || []);
    }
    setIsLoadingSlots(false);
  }, [user?.id, selectedDate, toast]);

  useEffect(() => {
    if (user && selectedDate) {
      fetchSlots(user.id, selectedDate);
    }
  }, [user, selectedDate, fetchSlots]);

  const createDefaultSlots = async () => {
    if (!user || !selectedDate) {
      console.log("Doctor.tsx: Skipping createDefaultSlots, user or selectedDate is missing.");
      return;
    }
    
    setIsLoadingSlots(true);
    const newSlots: Database['public']['Tables']['availability_slots']['Insert'][] = [];
    const date = createLocalDateFromISOString(selectedDate); 
    
    let currentSlotTime = new Date(date);
    currentSlotTime.setHours(8, 15, 0, 0);
    
    const endOfDayLimit = new Date(date);
    endOfDayLimit.setHours(20, 0, 0, 0);

    const breakStart = new Date(date);
    breakStart.setHours(15, 45, 0, 0);
    const breakEnd = new Date(date);
    breakEnd.setHours(16, 15, 0, 0);

    console.log("Doctor.tsx: Attempting to create slots for:", selectedDate);
    console.log("Doctor.tsx: Doctor ID:", user.id);

    while (currentSlotTime.getTime() < endOfDayLimit.getTime()) {
      const startTime = new Date(currentSlotTime);
      const endTime = new Date(currentSlotTime.getTime() + 45 * 60 * 1000);

      const overlapsBreak = (startTime.getTime() < breakEnd.getTime() && endTime.getTime() > breakStart.getTime());

      if (overlapsBreak) {
        currentSlotTime = new Date(breakEnd);
        continue;
      }

      if (endTime.getTime() > endOfDayLimit.getTime()) {
        break;
      }
      
      newSlots.push({
        doctor_id: user.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_available: true,
      });
      
      currentSlotTime = endTime;
    }

    console.log("Doctor.tsx: Slots to insert:", newSlots);

    const { data, error } = await supabase
      .from('availability_slots')
      .insert(newSlots)
      .select();

    if (error) {
      console.error("Doctor.tsx: Error creating slots:", error);
      console.error("Doctor.tsx: Supabase create slots error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slots created successfully. Data:", data);
      toast({
        title: "Sucesso",
        description: "Horários criados com sucesso!",
      });
      fetchSlots();
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    }
    setIsLoadingSlots(false);
  };

  const toggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    console.log(`Doctor.tsx: Toggling slot ${slotId} from ${currentStatus} to ${!currentStatus}`);
    const { data, error } = await supabase
      .from('availability_slots')
      .update({ is_available: !currentStatus })
      .eq('id', slotId)
      .select();

    if (error) {
      console.error("Doctor.tsx: Error toggling slot availability:", error);
      console.error("Doctor.tsx: Supabase toggle slot error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slot availability updated. Data:", data);
      fetchSlots();
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    }
  };

  const handleSelectSlot = (slotId: string, isSelected: boolean) => {
    setSelectedSlotIds((prev) =>
      isSelected ? [...prev, slotId] : prev.filter((id) => id !== slotId)
    );
  };

  const handleSelectAllSlots = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedSlotIds(slots.map(slot => slot.id));
    } else {
      setSelectedSlotIds([]);
    }
  };

  const handleBulkDeleteSlots = async () => {
    if (selectedSlotIds.length === 0) return;
    setIsLoadingSlots(true);
    console.log("Doctor.tsx: Attempting to delete slots:", selectedSlotIds);
    const { data, error } = await supabase
      .from('availability_slots')
      .delete()
      .in('id', selectedSlotIds);

    if (error) {
      console.error("Doctor.tsx: Error deleting bulk slots:", error);
      console.error("Doctor.tsx: Supabase bulk delete slots error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os horários selecionados.",
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slots deleted successfully. Data:", data);
      toast({
        title: "Sucesso",
        description: `${selectedSlotIds.length} horários excluídos com sucesso!`,
      });
      setSelectedSlotIds([]);
      fetchSlots();
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    }
    setIsLoadingSlots(false);
  };

  const handleBulkToggleAvailability = async (makeAvailable: boolean) => {
    if (selectedSlotIds.length === 0) return;
    setIsLoadingSlots(true);
    console.log(`Doctor.tsx: Attempting to set availability for slots ${selectedSlotIds} to ${makeAvailable}`);
    const { data, error } = await supabase
      .from('availability_slots')
      .update({ is_available: makeAvailable })
      .in('id', selectedSlotIds)
      .select();

    if (error) {
      console.error("Doctor.tsx: Error bulk toggling availability:", error);
      console.error("Doctor.tsx: Supabase bulk toggle availability error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a disponibilidade dos horários selecionados.",
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Bulk slot availability updated. Data:", data);
      toast({
        title: "Sucesso",
        description: `${selectedSlotIds.length} horários marcados como ${makeAvailable ? 'disponíveis' : 'indisponíveis'}!`,
      });
      setSelectedSlotIds([]);
      fetchSlots();
      queryClient.invalidateQueries({ queryKey: ["availableDates"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    }
    setIsLoadingSlots(false);
  };

  const fetchAppointments = async () => {
    console.log("Doctor.tsx: Fetching appointments for doctor.");
    const { data: appts, error } = await supabase
      .rpc('get_appointments_for_doctor');

    if (error) {
      console.error("Doctor.tsx: Error fetching appointments:", error);
      toast({
        title: "Erro ao carregar consultas",
        description: error.message,
        variant: "destructive",
      });
    } else if (appts && appts.length > 0) {
      const withPatients = appts.map((a: any) => ({
        ...a,
        patient_profile: { 
          id: a.patient_id, 
          full_name: a.patient_full_name,
          whatsapp: a.patient_whatsapp,
          street: a.patient_street,
          street_number: a.patient_street_number,
          neighborhood: a.patient_neighborhood,
          city: a.patient_city,
          state: a.patient_state,
          zip_code: a.patient_zip_code,
        }
      }));
      console.log("Doctor.tsx: Appointments fetched:", withPatients);
      setAppointments(withPatients);
    } else {
      console.log("Doctor.tsx: No appointments found.");
      setAppointments([]);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    console.log(`Doctor.tsx: Updating appointment ${id} status to ${status}`);
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Doctor.tsx: Error updating appointment status:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Appointment status updated. Data:", data);
      toast({
        title: "Sucesso",
        description: "Status atualizado!",
      });
      fetchAppointments();
    }
  };

  const fetchPatients = async (doctorId: string) => {
    if (!doctorId) {
      console.log("Doctor.tsx: Skipping fetchPatients, doctorId is missing.");
      return;
    }

    console.log('Doctor.tsx: Fetching patients for doctor:', doctorId);
    const { data: patientsData, error } = await supabase
      .rpc('get_patients_for_doctor');

    if (error) {
      console.error('Doctor.tsx: Error fetching patients:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('Doctor.tsx: Patients fetched:', patientsData);
      setPatients(patientsData || []);
    }
  };

  const handleSignOut = async () => {
    console.log("Doctor.tsx: Tentando deslogar...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Doctor.tsx: Erro ao deslogar:", error);
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Deslogado com sucesso.");
      toast({
        title: "Sucesso",
        description: "Você foi desconectado(a).",
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsDrawerOpen(false);
  };

  const handleBookSlotForPatient = async () => {
    if (!user || !selectedPatientForBookingId || !selectedSlotForBooking) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um paciente e um horário disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsBookingForPatient(true);
    try {
      const { data, error } = await supabase.rpc("book_slot_and_create_appointment", {
        _slot_id: selectedSlotForBooking.id,
        _patient_id: selectedPatientForBookingId,
        _doctor_id: user.id,
        _start_time: selectedSlotForBooking.start_time,
        _end_time: selectedSlotForBooking.end_time,
      });

      if (error) {
        console.error("Doctor.tsx: Error booking slot for patient:", error);
        toast({
          title: "Erro ao agendar consulta",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log("Doctor.tsx: Appointment booked for patient. Data:", data);
        toast({
          title: "Sucesso",
          description: "Consulta agendada para o paciente!",
        });
        setSelectedPatientForBookingId(null);
        setSelectedSlotForBooking(null);
        fetchSlots(); // Refresh slots to show updated availability
        fetchAppointments(); // Refresh appointments list
      }
    } catch (error: any) {
      console.error("Doctor.tsx: Error in handleBookSlotForPatient catch block:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível agendar a consulta para o paciente.",
        variant: "destructive",
      });
    } finally {
      setIsBookingForPatient(false);
    }
  };

  // Realtime subscription for availability_slots in Doctor.tsx
  useEffect(() => {
    if (!user) return;
    console.log("Doctor.tsx: Setting up real-time subscription for availability_slots for doctor's view.");
    const channel = supabase
      .channel(`doctor_availability_slots_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability_slots', filter: `doctor_id=eq.${user.id}` },
        (payload) => {
          console.log('Doctor.tsx: Real-time change detected in availability_slots for doctor:', payload);
          fetchSlots(); // Re-fetch slots for the current doctor
        }
      )
      .subscribe();

    return () => {
      console.log("Doctor.tsx: Unsubscribing from real-time channel for doctor's view.");
      supabase.removeChannel(channel);
    };
  }, [user, fetchSlots]); // Depend on user and fetchSlots

  console.log("Doctor component is rendering. User:", user?.id, "Loading:", loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    console.log("Doctor component: No user found after loading, redirecting to /auth.");
    navigate("/auth");
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Portal do Profissional</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo(a), {doctorProfile?.full_name || user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          {/* Desktop TabsList */}
          <TabsList className="hidden md:flex w-full bg-muted p-1 rounded-lg border space-x-1">
            <TabsTrigger value="overview" className="px-3 py-2 text-sm whitespace-nowrap">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="profile" className="px-3 py-2 text-sm whitespace-nowrap">
              <UserIcon className="h-4 w-4 mr-2" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 py-2 text-sm whitespace-nowrap">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Gerenciar Agenda
            </TabsTrigger>
            <TabsTrigger value="appointments" className="px-3 py-2 text-sm whitespace-nowrap">
              <Clock className="h-4 w-4 mr-2" />
              Agenda Consultas
            </TabsTrigger>
            <TabsTrigger value="patients" className="px-3 py-2 text-sm whitespace-nowrap">
              <Users className="h-4 w-4 mr-2" />
              Meus Pacientes
            </TabsTrigger>
            <TabsTrigger value="medical-records" className="px-3 py-2 text-sm whitespace-nowrap">
              <BookOpen className="h-4 w-4 mr-2" />
              Prontuários
            </TabsTrigger>
            <TabsTrigger value="online-consultation" className="px-3 py-2 text-sm whitespace-nowrap">
              <MessageSquare className="h-4 w-4 mr-2" />
              Consulta Online
            </TabsTrigger>
            <TabsTrigger value="newsletter-subscriptions" className="px-3 py-2 text-sm whitespace-nowrap">
              <Mail className="h-4 w-4 mr-2" />
              Newsletter
            </TabsTrigger>
          </TabsList>

          {/* Mobile Drawer Menu */}
          <div className="md:hidden mb-4">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Menu className="h-4 w-4 mr-2" />
                  {activeTab === "overview" && "Visão Geral"}
                  {activeTab === "profile" && "Meu Perfil"}
                  {activeTab === "schedule" && "Gerenciar Agenda"}
                  {activeTab === "appointments" && "Agenda Consultas"}
                  {activeTab === "patients" && "Meus Pacientes"}
                  {activeTab === "medical-records" && "Prontuários"}
                  {activeTab === "online-consultation" && "Consulta Online"}
                  {activeTab === "newsletter-subscriptions" && "Newsletter"}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh] rounded-t-[10px] flex flex-col">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Navegação do Portal</DrawerTitle>
                  <DrawerDescription>Selecione uma opção abaixo</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex-1 overflow-y-auto">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("overview")}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Visão Geral
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("profile")}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("schedule")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Gerenciar Agenda
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("appointments")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Agenda Consultas
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("patients")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Meus Pacientes
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("medical-records")}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Prontuários
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("online-consultation")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Consulta Online
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left"
                      onClick={() => handleTabChange("newsletter-subscriptions")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Newsletter
                    </Button>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Fechar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Conteúdo das abas */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Portal</CardTitle>
                <CardDescription>Um resumo rápido das suas atividades e informações importantes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Esta seção pode ser expandida para incluir gráficos, estatísticas de agendamentos, 
                  novas mensagens e outras informações relevantes para o seu dia a dia.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6">
                {user?.id && <DoctorProfileForm userId={user.id} onProfileUpdated={() => {
                  console.log("Doctor profile updated!");
                  fetchDoctorProfile(user.id);
                }} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selecione uma Data</CardTitle>
                  <CardDescription>Escolha o dia para gerenciar sua agenda</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate ? createLocalDateFromISOString(selectedDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        const iso = `${year}-${month}-${day}`;
                        console.log("Doctor Calendar: Date selected (string):", iso);
                        setSelectedDate(iso);
                        setSelectedSlotIds([]);
                        setSelectedSlotForBooking(null); // Reset booking slot
                      } else {
                        setSelectedDate(undefined);
                        setSelectedSlotIds([]);
                        setSelectedSlotForBooking(null); // Reset booking slot
                      }
                    }}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Horários para {selectedDate ? format(createLocalDateFromISOString(selectedDate), "dd 'de' MMMM", { locale: ptBR }) : ""}
                  </CardTitle>
                  <CardDescription>
                    {isLoadingSlots ? "Carregando horários..." : (slots.length > 0 ? "Selecione horários para ações em massa" : "Nenhum horário cadastrado")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingSlots ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {slots.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-slots"
                              checked={selectedSlotIds.length === slots.length && slots.length > 0}
                              onCheckedChange={(checked) => handleSelectAllSlots(checked as boolean)}
                            />
                            <Label htmlFor="select-all-slots">Selecionar Todos</Label>
                          </div>
                          {selectedSlotIds.length > 0 && (
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDeleteSlots}
                                disabled={isLoadingSlots}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir ({selectedSlotIds.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggleAvailability(true)}
                                disabled={isLoadingSlots}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Disponibilizar ({selectedSlotIds.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggleAvailability(false)}
                                disabled={isLoadingSlots}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Indisponibilizar ({selectedSlotIds.length})
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {slots.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`slot-${slot.id}`}
                                  checked={selectedSlotIds.includes(slot.id)}
                                  onCheckedChange={(checked) => handleSelectSlot(slot.id, checked as boolean)}
                                />
                                <Label htmlFor={`slot-${slot.id}`} className="font-medium">
                                  {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                                </Label>
                              </div>
                              <Button
                                variant={slot.is_available ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                              >
                                {slot.is_available ? "Disponível" : "Indisponível"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Nenhum horário cadastrado para esta data
                          </p>
                          <Button onClick={createDefaultSlots} disabled={isLoadingSlots}>
                            Gerar Horários Padrão (8:15-20:00, 45min)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Agendar Horário para Paciente</CardTitle>
                <CardDescription>Selecione um paciente e um horário disponível para agendar uma consulta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="patient-for-booking-select">Paciente</Label>
                  <Select
                    onValueChange={setSelectedPatientForBookingId}
                    value={selectedPatientForBookingId || ""}
                    disabled={!patients || patients.length === 0}
                  >
                    <SelectTrigger id="patient-for-booking-select">
                      <SelectValue placeholder={!patients || patients.length === 0 ? "Nenhum paciente encontrado" : "Selecione um paciente"} />
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

                <div className="grid gap-2">
                  <Label htmlFor="slot-for-booking-select">Horário Disponível</Label>
                  <Select
                    onValueChange={(value) => {
                      const [slotId, startTime, endTime] = value.split("|");
                      setSelectedSlotForBooking({ id: slotId, start_time: startTime, end_time: endTime });
                    }}
                    value={selectedSlotForBooking ? `${selectedSlotForBooking.id}|${selectedSlotForBooking.start_time}|${selectedSlotForBooking.end_time}` : ""}
                    disabled={!selectedDate || isLoadingSlots || !slots || slots.filter(s => s.is_available).length === 0}
                  >
                    <SelectTrigger id="slot-for-booking-select">
                      <SelectValue placeholder={isLoadingSlots ? "Carregando horários..." : (slots.filter(s => s.is_available).length === 0 ? "Nenhum horário disponível" : "Selecione um horário")} />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.filter(s => s.is_available).map((slot) => (
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
                  onClick={handleBookSlotForPatient}
                  disabled={!selectedPatientForBookingId || !selectedSlotForBooking || isBookingForPatient}
                  className="w-full"
                >
                  {isBookingForPatient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    "Agendar Consulta para Paciente"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Agenda Consultas</CardTitle>
                <CardDescription>Gerencie suas consultas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma consulta agendada
                  </p>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-lg">
                            {apt.patient_profile?.full_name || 'Paciente Desconhecido'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={
                          apt.status === 'confirmed' ? 'default' :
                          apt.status === 'pending' ? 'secondary' :
                          apt.status === 'completed' ? 'outline' : 'destructive'
                        }>
                          {apt.status === 'pending' ? 'Pendente' : 
                           apt.status === 'confirmed' ? 'Confirmada' : 
                           apt.status === 'completed' ? 'Concluída' : 'Cancelada'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {apt.patient_profile?.whatsapp && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            WhatsApp: <a href={`https://wa.me/${apt.patient_profile.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              {formatPhone(apt.patient_profile.whatsapp)}
                            </a>
                          </p>
                        )}
                        {(apt.patient_profile?.street || apt.patient_profile?.city) && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Endereço: {[
                              apt.patient_profile.street && `${apt.patient_profile.street}${apt.patient_profile.street_number ? ', ' + apt.patient_profile.street_number : ''}`,
                              apt.patient_profile.neighborhood,
                              apt.patient_profile.city,
                              apt.patient_profile.state
                            ].filter(Boolean).join(' - ')}
                            {apt.patient_profile.zip_code && ` - CEP: ${apt.patient_profile.zip_code}`}
                          </p>
                        )}
                      </div>

                      {apt.notes && (
                        <p className="text-sm mb-3">
                          <span className="font-medium">Observações:</span> {apt.notes}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {apt.status === 'pending' && (
                          <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                            Confirmar
                          </Button>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                            Concluir
                          </Button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pacientes</CardTitle>
                <CardDescription>Lista completa de pacientes com todos os dados</CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum paciente encontrado
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {patients.map((patient) => (
                      <div key={patient.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg mb-3">{patient.full_name}</p>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-muted-foreground flex-shrink-0">Data de Cadastro:</span>
                                <span className="flex-grow">{patient.created_at ? format(new Date(patient.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
                              </div>
                              
                              {patient.birth_date && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-muted-foreground flex-shrink-0">Data de Nasc.:</span>
                                  <span className="flex-grow">{formatDateToDisplay(patient.birth_date)}</span>
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <span className="font-medium text-muted-foreground flex-shrink-0">WhatsApp:</span>
                                <span className="flex-grow">{patient.whatsapp ? formatPhone(patient.whatsapp) : '-'}</span>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-muted-foreground flex-shrink-0">Endereço:</span>
                                <span className="flex-grow">
                                  {[
                                        patient.street && `${patient.street}${patient.street_number ? ', ' + patient.street_number : ''}`,
                                        patient.neighborhood,
                                        patient.city,
                                        patient.state
                                      ].filter(Boolean).join(' - ')}
                                      {patient.zip_code && ` - CEP: ${patient.zip_code}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => setPatientToDelete(patient)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tem certeza que deseja excluir este paciente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil do paciente e todos os dados associados (sessões, prontuários, etc.).
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeletePatient} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Excluir Paciente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical-records">
            {user && <DoctorMedicalRecordsTab currentUserId={user.id} />}
          </TabsContent>

          <TabsContent value="online-consultation">
            {user && <DoctorOnlineConsultationTab currentUserId={user.id} />}
          </TabsContent>

          <TabsContent value="newsletter-subscriptions">
            <DoctorNewsletterSubscriptionsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      
      {selectedPatient && (
        <EditPatientDialog
          patient={selectedPatient}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onPatientUpdated={async () => {
            console.log('onPatientUpdated called');
            await fetchPatients(user!.id);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default Doctor;