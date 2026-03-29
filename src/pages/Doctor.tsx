"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, FileText, LogOut, Users, Video, BarChart3, Loader2, Edit, User as UserIcon, MessageSquare, Trash2, CheckCircle, XCircle, MessageSquareText, MapPin, Phone, Mail, BookOpen, Menu, ClipboardList, AlertCircle, UserPlus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { AddPatientDialog } from "@/components/doctor/AddPatientDialog";
import { formatPhone } from "@/lib/format-phone";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { DoctorMedicalRecordsTab } from "@/components/doctor/DoctorMedicalRecordsTab";
import { DoctorOnlineConsultationTab } from "@/components/DoctorOnlineConsultationTab";
import { DoctorFormResponsesTab } from "@/components/DoctorFormResponsesTab";
import { DoctorNewsletterSubscriptionsTab } from "@/components/doctor/DoctorNewsletterSubscriptionsTab";
import { DoctorBlogPostsTab } from "@/components/doctor/DoctorBlogPostsTab";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, createLocalDateFromISOString, formatDateToDisplay } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeletePatientAlertDialog } from "@/components/doctor/DeletePatientAlertDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUser } from "@/hooks/useUser";
import ErrorBoundary from "@/components/ErrorBoundary";

import { getDatesForTimeframe, toUtcIso } from "@/lib/dates";
import { getDoctorAvailabilitySlots } from "@/lib/supabase-queries";

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
type Timeframe = "today" | "7_days" | "14_days" | "custom";

const Doctor = () => {
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading, profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<string | undefined>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingScheduleSlots, setIsLoadingScheduleSlots] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const [overview, setOverview] = useState<{total:number; available:number; occupied:number}>({total:0, available:0, occupied:0});
  const [overviewAppointments, setOverviewAppointments] = useState<Array<{
    id:string; patient_name:string; start_time:string; end_time:string;
  }>>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientIdToEdit, setSelectedPatientIdToEdit] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatientForBookingId, setSelectedPatientForBookingId] = useState<string | null>(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ id: string; start_time: string; end_time: string } | null>(null);
  const [isBookingForPatient, setIsBookingForPatient] = useState(false);

  const [patientToDelete, setPatientToDelete] = useState<PatientProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initiatingCallForPatientId, setInitiatingCallForPatientId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchDoctorProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }, []);

  const fetchOverview = useCallback(async (doctorId: string, tf: Timeframe, customS?:Date, customE?:Date) => {
    setIsLoadingOverview(true);
    try {
      const { start, end } = getDatesForTimeframe(tf, customS, customE);
      const startIso = toUtcIso(start);
      const endIso = toUtcIso(end);

      const { data: slots, error: slotsErr } = await supabase
        .from("availability_slots")
        .select("id, start_time, end_time, is_available")
        .eq("doctor_id", doctorId)
        .gte("start_time", startIso)
        .lte("end_time",   endIso)
        .order("start_time", { ascending: true });
      if (slotsErr) throw slotsErr;

      const { data: apptsData, error: apptsErr } = await supabase
        .from("appointments")
        .select("id, slot_id, start_time, end_time, patient_id")
        .eq("doctor_id", doctorId)
        .gte("start_time", startIso)
        .lte("end_time",   endIso)
        .order("start_time", { ascending: true });
      if (apptsErr) throw apptsErr;

      const patientIds = [...new Set((apptsData || []).map(a => a.patient_id))];
      let patientProfiles: Pick<PatientProfile, 'id' | 'full_name'>[] = [];
      if (patientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', patientIds);
        if (profilesError) throw profilesError;
        patientProfiles = (profilesData || []) as Pick<PatientProfile, 'id' | 'full_name'>[];
      }
      const patientMap = new Map(patientProfiles.map(p => [p.id, p.full_name]));

      const apptsWithPatientNames = (apptsData || []).map(apt => ({
        ...apt,
        patient_name: patientMap.get(apt.patient_id) || "Paciente Desconhecido"
      }));

      const occupiedSet = new Set((apptsData || []).map(a => a.slot_id));
      const total = (slots || []).length;
      const occupied = (slots || []).filter(s => occupiedSet.has(s.id) || !s.is_available).length;
      const available = Math.max(0, total - occupied);

      setOverview({ total, available, occupied });
      setOverviewAppointments(apptsWithPatientNames.map(a => ({
        id: a.id,
        patient_name: a.patient_name,
        start_time: a.start_time,
        end_time: a.end_time
      })));
    } catch (e: any) {
      console.error("fetchOverview error:", e);
      setOverview({ total: 0, available: 0, occupied: 0 });
      setOverviewAppointments([]);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id && activeTab === 'overview') {
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
  }, [user, activeTab, selectedTimeframe, customStartDate, customEndDate, fetchOverview]);

  const fetchAppointments = useCallback(async () => {
    const { data: appts, error } = await supabase.rpc('get_appointments_for_doctor');
    if (error) throw error;
    if (appts && appts.length > 0) {
      return (appts as any[]).map((a: any) => ({
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
    }
    return [];
  }, []);

  const fetchPatients = useCallback(async (doctorId: string) => {
    if (!doctorId) return [];
    const { data, error } = await supabase.rpc('get_patients_for_doctor').returns<PatientProfile[]>();
    if (error) throw error;
    return data || [];
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isUserLoading) {
        if (!user || !profile?.is_doctor) {
          navigate("/auth");
          return;
        } else if (user) {
          setLoading(true);
          try {
            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());
            const [doctorProfileData, availabilitySlotsResult, appointmentsData, patientsData] = await Promise.all([
              fetchDoctorProfile(user.id),
              getDoctorAvailabilitySlots(user.id, toUtcIso(todayStart), toUtcIso(todayEnd)),
              fetchAppointments(),
              fetchPatients(user.id)
            ]);
            setDoctorProfile(doctorProfileData);
            setSlots(availabilitySlotsResult.slots);
            setAppointments(appointmentsData);
            setPatients(patientsData as PatientProfile[]);
          } catch (error: any) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
          } finally {
            setLoading(false);
          }
        }
      }
    };
    loadInitialData();
  }, [user, isUserLoading, profile, navigate, fetchDoctorProfile, fetchAppointments, fetchPatients, toast]);

  useEffect(() => {
    const loadScheduleSlots = async () => {
      if (user?.id && activeTab === 'schedule' && selectedDate) {
        setIsLoadingScheduleSlots(true);
        try {
          const dateObj = createLocalDateFromISOString(selectedDate);
          const result = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDay(dateObj)), toUtcIso(endOfDay(dateObj)));
          setSlots(result.slots);
        } catch (error: any) {
          toast({ title: "Erro", description: error.message, variant: "destructive" });
          setSlots([]);
        } finally {
          setIsLoadingScheduleSlots(false);
        }
      }
    };
    loadScheduleSlots();
  }, [user, activeTab, selectedDate, toast]);

  const createDefaultSlots = async () => {
    if (!user || !selectedDate) return;
    setIsLoadingScheduleSlots(true);
    try {
      const newSlots: Database['public']['Tables']['availability_slots']['Insert'][] = [];
      const date = createLocalDateFromISOString(selectedDate); 
      let currentSlotTime = new Date(date);
      currentSlotTime.setHours(8, 15, 0, 0);
      const endOfDayLimit = new Date(date);
      endOfDayLimit.setHours(20, 0, 0, 0);
      const breakStartTime = new Date(date);
      breakStartTime.setHours(14, 15, 0, 0);
      const breakEndTime = new Date(date);
      breakEndTime.setHours(15, 45, 0, 0);

      while (currentSlotTime.getTime() < endOfDayLimit.getTime()) {
        const startTime = new Date(currentSlotTime);
        const endTime = new Date(currentSlotTime.getTime() + 45 * 60 * 1000);
        if (endTime.getTime() > endOfDayLimit.getTime()) break;
        const isOverlappingBreak = (startTime.getTime() < breakEndTime.getTime() && endTime.getTime() > breakStartTime.getTime());
        if (!isOverlappingBreak) {
          newSlots.push({ doctor_id: user.id, start_time: toUtcIso(startTime), end_time: toUtcIso(endTime), is_available: true });
        }
        currentSlotTime = endTime;
      }
      const { error } = await supabase.from('availability_slots').insert(newSlots);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Horários criados!" });
      const dateObj = createLocalDateFromISOString(selectedDate);
      const scheduleSlots = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDay(dateObj)), toUtcIso(endOfDay(dateObj)));
      setSlots(scheduleSlots.slots);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingScheduleSlots(false);
    }
  };

  const toggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('availability_slots').update({ is_available: !currentStatus }).eq('id', slotId);
      if (error) throw error;
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const scheduleSlots = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDay(dateObj)), toUtcIso(endOfDay(dateObj)));
      setSlots(scheduleSlots.slots);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Status atualizado!" });
      const updatedAppts = await fetchAppointments();
      setAppointments(updatedAppts);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    else navigate("/auth");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsDrawerOpen(false);
    if (value === 'overview' && user?.id) {
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
  };

  const handleDeletePatient = useCallback(async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', patientToDelete.id);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Paciente ${patientToDelete.full_name} excluído!` });
      const updatedPatients = await fetchPatients(user!.id);
      setPatients(updatedPatients);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [patientToDelete, user, fetchPatients, toast]);

  const handleInitiateVideoSession = async (patientId: string) => {
    if (!user?.id) return;
    setInitiatingCallForPatientId(patientId);
    try {
      const newSessionId = crypto.randomUUID();
      const { error } = await supabase.from("video_sessions").insert({
        id: newSessionId,
        user_id: user.id,
        doctor_id: user.id,
        patient_id: patientId,
        room_id: newSessionId,
        status: "ringing",
        ice_candidates: [],
      });
      if (error) throw error;
      toast({ title: "Sucesso", description: "Chamada iniciada!" });
      setActiveTab("online-consultation");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setInitiatingCallForPatientId(null);
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ErrorBoundary>
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">Portal do Profissional</h1>
              <p className="text-muted-foreground mt-2">
                Bem-vindo(a), {doctorProfile?.full_name || user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex-shrink-0 ml-4">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="hidden md:flex w-full bg-muted p-1 rounded-lg border space-x-1">
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
              <TabsTrigger value="blog-posts" className="px-3 py-2 text-sm whitespace-nowrap">
                <ClipboardList className="h-4 w-4 mr-2" />
                Gerenciar Blog
              </TabsTrigger>
              <TabsTrigger value="contact-forms" className="px-3 py-2 text-sm whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" />
                Formulário Contato
              </TabsTrigger>
              <TabsTrigger value="newsletter-subscriptions" className="px-3 py-2 text-sm whitespace-nowrap">
                <Mail className="h-4 w-4 mr-2" />
                Newsletter
              </TabsTrigger>
            </TabsList>

            <div className="md:hidden mb-4">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Menu className="h-4 w-4 mr-2" />
                    {activeTab === "profile" && "Meu Perfil"}
                    {activeTab === "schedule" && "Gerenciar Agenda"}
                    {activeTab === "appointments" && "Agenda Consultas"}
                    {activeTab === "patients" && "Meus Pacientes"}
                    {activeTab === "medical-records" && "Prontuários"}
                    {activeTab === "online-consultation" && "Consulta Online"}
                    {activeTab === "blog-posts" && "Gerenciar Blog"}
                    {activeTab === "contact-forms" && "Formulário Contato"}
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
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("profile")}>
                        <UserIcon className="h-4 w-4 mr-2" /> Meu Perfil
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("schedule")}>
                        <CalendarIcon className="h-4 w-4 mr-2" /> Gerenciar Agenda
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("appointments")}>
                        <Clock className="h-4 w-4 mr-2" /> Agenda Consultas
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("patients")}>
                        <Users className="h-4 w-4 mr-2" /> Meus Pacientes
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("medical-records")}>
                        <BookOpen className="h-4 w-4 mr-2" /> Prontuários
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("online-consultation")}>
                        <MessageSquare className="h-4 w-4 mr-2" /> Consulta Online
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("blog-posts")}>
                        <ClipboardList className="h-4 w-4 mr-2" /> Gerenciar Blog
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("contact-forms")}>
                        <FileText className="h-4 w-4 mr-2" /> Formulário Contato
                      </Button>
                      <Button variant="ghost" className="w-full justify-start px-4 py-3 text-base text-left" onClick={() => handleTabChange("newsletter-subscriptions")}>
                        <Mail className="h-4 w-4 mr-2" /> Newsletter
                      </Button>
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>

            <TabsContent value="profile">
              <Card><CardContent className="p-6">{user?.id && <DoctorProfileForm userId={user.id} onProfileUpdated={async () => setDoctorProfile(await fetchDoctorProfile(user.id))} />}</CardContent></Card>
            </TabsContent>

            <TabsContent value="schedule">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Selecione uma Data</CardTitle></CardHeader>
                  <CardContent>
                    <Calendar mode="single" selected={selectedDate ? createLocalDateFromISOString(selectedDate) : undefined} onSelect={(date) => {
                      if (date) setSelectedDate(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`);
                    }} locale={ptBR} className="rounded-md border" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Horários para {selectedDate ? format(createLocalDateFromISOString(selectedDate), "dd 'de' MMMM", { locale: ptBR }) : ""}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingScheduleSlots ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                      <>
                        {slots.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {slots.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <Label className="font-medium">{format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}</Label>
                                <Button variant={slot.is_available ? "default" : "outline"} size="sm" onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}>{slot.is_available ? "Disponível" : "Indisponível"}</Button>
                              </div>
                            ))}
                          </div>
                        ) : <div className="text-center py-8"><Button onClick={createDefaultSlots}>Gerar Horários Padrão</Button></div>}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <Card>
                <CardHeader><CardTitle>Agenda Consultas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {appointments.length === 0 ? <p className="text-muted-foreground text-center py-4">Nenhuma consulta agendada</p> : appointments.map((apt) => (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={apt.patient_profile?.avatar_url} />
                            <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-lg">{apt.patient_profile?.full_name || 'Paciente Desconhecido'}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(apt.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : apt.status === 'pending' ? 'secondary' : 'outline'}>{apt.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {apt.status === 'pending' && <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>Confirmar</Button>}
                        {apt.status === 'confirmed' && <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>Concluir</Button>}
                        <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>Cancelar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Meus Pacientes</CardTitle>
                    <CardDescription>Gerencie os dados dos seus pacientes.</CardDescription>
                  </div>
                  <Button onClick={() => setAddPatientDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Paciente
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patients.length === 0 ? (
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
                              <p className="text-sm text-muted-foreground">{patient.whatsapp ? `WhatsApp: ${formatPhone(patient.whatsapp)}` : 'WhatsApp não informado'}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                            <Button variant="outline" size="sm" onClick={() => handleInitiateVideoSession(patient.id)} disabled={initiatingCallForPatientId === patient.id}>
                              {initiatingCallForPatientId === patient.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                              Consulta Online
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
              {user && <DoctorOnlineConsultationTab isDoctorView={true} />}
            </TabsContent>

            <TabsContent value="blog-posts">
              {user && <DoctorBlogPostsTab currentUserId={user.id} />}
            </TabsContent>

            <TabsContent value="contact-forms">
              <DoctorFormResponsesTab />
            </TabsContent>

            <TabsContent value="newsletter-subscriptions">
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
          onPatientUpdated={async () => {
            queryClient.invalidateQueries({ queryKey: ["doctorPatients", user!.id] });
            setSelectedPatientIdToEdit(null);
          }}
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