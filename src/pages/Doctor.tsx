import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, FileText, LogOut, Users, Video, BarChart3, Loader2, Edit, User as UserIcon, MessageSquare, Trash2, CheckCircle, XCircle, MessageSquareText, MapPin, Phone, Mail, BookOpen, Menu, ClipboardList, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientDialog } from "@/components/EditPatientDialog";
import { formatPhone } from "@/lib/format-phone";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { DoctorMedicalRecordsTab } from "@/components/doctor/DoctorMedicalRecordsTab";
import { DoctorOnlineConsultationTab } from "@/components/DoctorOnlineConsultationTab";
import { DoctorFormResponsesTab } from "@/components/DoctorFormResponsesTab";
import { DoctorNewsletterSubscriptionsTab } from "@/components/doctor/DoctorNewsletterSubscriptionsTab";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, createLocalDateFromISOString, formatDateToDisplay } from "@/lib/utils";
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
import { useUser } from "@/hooks/useUser"; // Importar useUser do Supabase

// Importar as novas funções de data e queries
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
  const { user, isLoading: isUserLoading, profile } = useUser(); // Usar o hook useUser
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  
  // States for 'Gerenciar Agenda' tab
  const [selectedDate, setSelectedDate] = useState<string | undefined>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingScheduleSlots, setIsLoadingScheduleSlots] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  // States for 'Visão Geral' tab timeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // New states for overview data
  const [overview, setOverview] = useState<{total:number; available:number; occupied:number}>({total:0, available:0, occupied:0});
  const [overviewAppointments, setOverviewAppointments] = useState<Array<{
    id:string; patient_name:string; start_time:string; end_time:string;
  }>>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatientForBookingId, setSelectedPatientForBookingId] = useState<string | null>(null);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ id: string; start_time: string; end_time: string } | null>(null);
  const [isBookingForPatient, setIsBookingForPatient] = useState(false);

  const [patientToDelete, setPatientToDelete] = useState<PatientProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [toast, setDoctorProfile]);

  const fetchOverview = useCallback(async (doctorId: string, tf: Timeframe, customS?:Date, customE?:Date) => {
    setIsLoadingOverview(true);
    console.log("fetchOverview: Starting for doctorId:", doctorId, "timeframe:", tf, "customStart:", customS, "customEnd:", customE);
    try {
      const { start, end } = getDatesForTimeframe(tf, customS, customE);
      const startIso = toUtcIso(start);
      const endIso   = toUtcIso(end);
      console.log("fetchOverview: Calculated date range (UTC ISO):", startIso, "to", endIso);

      // 1) slots do período
      const { data: slots, error: slotsErr } = await supabase
        .from("availability_slots")
        .select("id, start_time, end_time, is_available")
        .eq("doctor_id", doctorId)
        .gte("start_time", startIso)
        .lte("end_time",   endIso)
        .order("start_time", { ascending: true });
      if (slotsErr) {
        console.error("fetchOverview: Error fetching slots:", slotsErr);
        throw slotsErr;
      }
      console.log("fetchOverview: Raw slots data:", slots);

      // 2) consultas do período (sem join inicial)
      const { data: apptsData, error: apptsErr } = await supabase
        .from("appointments")
        .select("id, slot_id, start_time, end_time, patient_id")
        .eq("doctor_id", doctorId)
        .gte("start_time", startIso)
        .lte("end_time",   endIso)
        .order("start_time", { ascending: true });
      if (apptsErr) {
        console.error("fetchOverview: Error fetching appointments:", apptsErr);
        throw apptsErr;
      }
      console.log("fetchOverview: Raw appointments data (without join):", apptsData);

      // Fetch patient profiles separately
      const patientIds = [...new Set(apptsData.map(a => a.patient_id))];
      let patientProfiles: Profile[] = [];
      if (patientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', patientIds);
        if (profilesError) {
          console.error("fetchOverview: Error fetching patient profiles:", profilesError);
          throw profilesError;
        }
        patientProfiles = profilesData || [];
      }
      const patientMap = new Map(patientProfiles.map(p => [p.id, p.full_name]));

      // Map patient names to appointments
      const apptsWithPatientNames = apptsData.map(apt => ({
        ...apt,
        patient_name: patientMap.get(apt.patient_id) || "Paciente Desconhecido"
      }));
      console.log("fetchOverview: Appointments with patient names:", apptsWithPatientNames);

      // índice de slot_id -> existe consulta
      const occupiedSet = new Set(apptsData.map(a => a.slot_id));
      const total = slots.length;
      const occupied = slots.filter(s => occupiedSet.has(s.id) || !s.is_available).length;
      const available = Math.max(0, total - occupied);

      console.log("fetchOverview: Calculated overview - Total:", total, "Available:", available, "Occupied:", occupied);
      setOverview({ total, available, occupied });

      // montar lista de pacientes para renderizar abaixo do dashboard
      const mappedAppointments = apptsWithPatientNames.map(a => ({
        id: a.id,
        patient_name: a.patient_name,
        start_time: a.start_time,
        end_time: a.end_time
      }));
      console.log("fetchOverview: Mapped overview appointments:", mappedAppointments);
      setOverviewAppointments(mappedAppointments);
    } catch (e: any) {
      console.error("fetchOverview: Overview fetch failed in catch block", e);
      toast({
        title: "Erro ao carregar visão geral",
        description: e.message || "Não foi possível carregar os dados da visão geral.",
        variant: "destructive",
      });
      setOverview({ total: 0, available: 0, occupied: 0 });
      setOverviewAppointments([]);
    } finally {
      setIsLoadingOverview(false);
      console.log("fetchOverview: Finished.");
    }
  }, [toast]);

  useEffect(() => {
    if (user?.id && activeTab === 'overview') {
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
  }, [user, activeTab, selectedTimeframe, customStartDate, customEndDate, fetchOverview]);


  const fetchAppointments = useCallback(async () => {
    console.log("Doctor.tsx: Fetching appointments for doctor.");
    const { data: appts, error } = await supabase
      .rpc('get_appointments_for_doctor');

    if (error) {
      console.error("Doctor.tsx: Error fetching appointments:", error);
      toast({
        title: "Erro",
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
  }, [toast, setAppointments]);

  const fetchPatients = useCallback(async (doctorId: string) => {
    if (!doctorId) {
      console.log("Doctor.tsx: Skipping fetchPatients, doctorId is missing.");
      return;
    }

    console.log('Doctor.tsx: Fetching patients for doctor:', doctorId);
    const { data: patientsData, error } = await supabase
      .rpc('get_patients_for_doctor').returns<PatientProfile[]>();
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
  }, [toast, setPatients]);

  useEffect(() => {
    console.log("Doctor.tsx: useEffect (user/isUserLoading/profile) disparado.");
    if (!isUserLoading) {
      if (!user || !profile?.is_doctor) {
        console.log("Doctor.tsx: Usuário não logado ou não é doutor, redirecionando para /auth.");
        navigate("/auth");
      } else if (user) {
        console.log("Doctor.tsx: Usuário logado e é doutor, buscando perfil e dados.");
        fetchDoctorProfile(user.id);
        
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        getDoctorAvailabilitySlots(user.id, toUtcIso(todayStart), toUtcIso(endOfDayLocal)).then(result => {
          setSlots(result.slots);
          setIsLoadingScheduleSlots(false);
        });

        fetchAppointments();
        fetchPatients(user.id);
      }
    }
  }, [user, isUserLoading, profile, navigate, fetchDoctorProfile, fetchAppointments, fetchPatients, toast]);


  useEffect(() => {
    const loadScheduleSlots = async () => {
      if (user?.id && activeTab === 'schedule' && selectedDate) {
        console.log("Doctor.tsx: loadScheduleSlots triggered for selectedDate:", selectedDate);
        setIsLoadingScheduleSlots(true);
        const dateObj = createLocalDateFromISOString(selectedDate);
        const startOfDayLocal = startOfDay(dateObj);
        const endOfDayLocal = endOfDay(dateObj);
        console.log("Doctor.tsx: Date objects for fetching - startOfDayLocal:", startOfDayLocal, "endOfDayLocal:", endOfDayLocal);
        console.log("Doctor.tsx: UTC ISO strings for fetching - _start_time_gte:", toUtcIso(startOfDayLocal), "_end_time_lte:", toUtcIso(endOfDayLocal));
        try {
          const result = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
          console.log("Doctor.tsx: Result from getDoctorAvailabilitySlots:", result.slots);
          setSlots(result.slots);
        } catch (error: any) {
          console.error("Doctor.tsx: Error loading schedule slots:", error);
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
          setSlots([]);
        } finally {
          setIsLoadingScheduleSlots(false);
        }
      } else {
        console.log("Doctor.tsx: loadScheduleSlots skipped. Conditions: user.id=", user?.id, "activeTab=", activeTab, "selectedDate=", selectedDate);
      }
    };
    loadScheduleSlots();
  }, [user, activeTab, selectedDate, toast]);


  const createDefaultSlots = async () => {
    if (!user || !selectedDate) {
      console.log("Doctor.tsx: Skipping createDefaultSlots, user or selectedDate is missing.");
      toast({
        title: "Erro",
        description: "Usuário não autenticado ou data não selecionada.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingScheduleSlots(true);
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

    console.log("Doctor.tsx: Attempting to create slots for selectedDate (YYYY-MM-DD):", selectedDate);
    console.log("Doctor.tsx: Doctor ID:", user.id);

    while (currentSlotTime.getTime() < endOfDayLimit.getTime()) {
      const startTime = new Date(currentSlotTime);
      const endTime = new Date(currentSlotTime.getTime() + 45 * 60 * 1000);

      if (endTime.getTime() > endOfDayLimit.getTime()) {
        break;
      }
      
      const isOverlappingBreak = 
        (startTime.getTime() < breakEndTime.getTime() && endTime.getTime() > breakStartTime.getTime());

      if (!isOverlappingBreak) {
        newSlots.push({
          doctor_id: user.id,
          start_time: toUtcIso(startTime),
          end_time: toUtcIso(endTime),
          is_available: true,
        });
      } else {
        console.log(`Doctor.tsx: Skipping slot ${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")} due to overlap with break.`);
      }
      
      currentSlotTime = endTime;
    }

    console.log("Doctor.tsx: Slots to insert:", newSlots);

    const { data, error } = await supabase
      .from('availability_slots')
      .insert(newSlots)
      .select();

    console.log("Doctor.tsx: Supabase insert response - Data:", data, "Error:", error);

    if (error) {
      console.error("Doctor.tsx: Error creating slots:", error);
      console.error("Doctor.tsx: Supabase create slots error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro ao criar horários",
        description: `Detalhes: ${error.message} (Código: ${error.code})`,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slots created successfully. Data:", data);
      toast({
        title: "Sucesso",
        description: "Horários criados com sucesso!",
      });
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const startOfDayLocal = startOfDay(dateObj);
      const endOfDayLocal = endOfDay(dateObj);
      const scheduleSlots = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
      console.log("Doctor.tsx: Slots after creation and refresh:", scheduleSlots.slots);
      setSlots(scheduleSlots.slots);
      queryClient.invalidateQueries({ queryKey: ["availableDates", user.id] });
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
    setIsLoadingScheduleSlots(false);
  };

  const toggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }
    console.log(`Doctor.tsx: Toggling slot ${slotId} from ${currentStatus} to ${!currentStatus}. User ID: ${user.id}`);
    const { data, error } = await supabase
      .from('availability_slots')
      .update({ is_available: !currentStatus })
      .eq('id', slotId)
      .select();

    console.log("Doctor.tsx: Supabase update response - Data:", data, "Error:", error);

    if (error) {
      console.error("Doctor.tsx: Error toggling slot availability:", error);
      console.error("Doctor.tsx: Supabase toggle slot error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro ao atualizar horário",
        description: `Detalhes: ${error.message} (Código: ${error.code})`,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slot availability updated. Data:", data);
      toast({
        title: "Sucesso",
        description: "Disponibilidade do horário atualizada!",
      });
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const startOfDayLocal = startOfDay(dateObj);
      const endOfDayLocal = endOfDay(dateObj);
      const scheduleSlots = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
      setSlots(scheduleSlots.slots);
      queryClient.invalidateQueries({ queryKey: ["availableDates", user.id] });
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
    setIsLoadingScheduleSlots(false);
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
    setIsLoadingScheduleSlots(true);
    console.log("Doctor.tsx: Attempting to delete slots:", selectedSlotIds);
    const { data, error } = await supabase
      .from('availability_slots')
      .delete()
      .in('id', selectedSlotIds);

    console.log("Doctor.tsx: Supabase delete response - Data:", data, "Error:", error);

    if (error) {
      console.error("Doctor.tsx: Error deleting bulk slots:", error);
      console.error("Doctor.tsx: Supabase bulk delete slots error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro ao excluir horários",
        description: `Detalhes: ${error.message} (Código: ${error.code})`,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Slots deleted successfully. Data:", data);
      toast({
        title: "Sucesso",
        description: `${selectedSlotIds.length} horários excluídos com sucesso!`,
      });
      setSelectedSlotIds([]);
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const startOfDayLocal = startOfDay(dateObj);
      const endOfDayLocal = endOfDay(dateObj);
      const scheduleSlots = await getDoctorAvailabilitySlots(user!.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
      setSlots(scheduleSlots.slots);
      queryClient.invalidateQueries({ queryKey: ["availableDates", user!.id] });
      fetchOverview(user!.id, selectedTimeframe, customStartDate, customEndDate);
    }
    setIsLoadingScheduleSlots(false);
  };

  const handleBulkToggleAvailability = async (makeAvailable: boolean) => {
    if (selectedSlotIds.length === 0) return;
    setIsLoadingScheduleSlots(true);
    console.log(`Doctor.tsx: Attempting to set availability for slots ${selectedSlotIds} to ${makeAvailable}`);
    const { data, error } = await supabase
      .from('availability_slots')
      .update({ is_available: makeAvailable })
      .in('id', selectedSlotIds)
      .select();

    console.log("Doctor.tsx: Supabase bulk update response - Data:", data, "Error:", error);

    if (error) {
      console.error("Doctor.tsx: Error bulk toggling availability:", error);
      console.error("Doctor.tsx: Supabase bulk toggle availability error details:", error.message, error.details, error.hint, error.code);
      toast({
        title: "Erro ao atualizar horários em massa",
        description: `Detalhes: ${error.message} (Código: ${error.code})`,
        variant: "destructive",
      });
    } else {
      console.log("Doctor.tsx: Bulk slot availability updated. Data:", data);
      toast({
        title: "Sucesso",
        description: `${selectedSlotIds.length} horários marcados como ${makeAvailable ? 'disponíveis' : 'indisponíveis'}!`,
      });
      setSelectedSlotIds([]);
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const startOfDayLocal = startOfDay(dateObj);
      const endOfDayLocal = endOfDay(dateObj);
      const scheduleSlots = await getDoctorAvailabilitySlots(user!.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
      setSlots(scheduleSlots.slots);
      queryClient.invalidateQueries({ queryKey: ["availableDates", user!.id] });
      fetchOverview(user!.id, selectedTimeframe, customStartDate, customEndDate);
    }
    setIsLoadingScheduleSlots(false);
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
      fetchOverview(user!.id, selectedTimeframe, customStartDate, customEndDate);
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
      console.log("Doctor.tsx: Deslogado com sucesso. Redirecionando para /auth.");
      toast({
        title: "Sucesso",
        description: "Você foi desconectado(a).",
      });
      navigate("/auth");
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsDrawerOpen(false);
    if (value === 'overview' && user?.id) {
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
    }
  };

  async function handleBookSlotForPatient() {
    if (!user?.id || !selectedSlotForBooking || !selectedPatientForBookingId) {
      toast.error("Por favor, selecione um paciente e um horário disponível para agendar.");
      return;
    }
    setIsBookingForPatient(true);
    try {
      // 1) cria a consulta
      const { data: apt, error: aptErr } = await supabase
        .from("appointments")
        .insert({
          doctor_id: user.id,
          patient_id: selectedPatientForBookingId,
          slot_id: selectedSlotForBooking.id,
          start_time: toUtcIso(new Date(selectedSlotForBooking.start_time)),
          end_time: toUtcIso(new Date(selectedSlotForBooking.end_time)),
          status: "confirmed"
        })
        .select()
        .single();
      if (aptErr) throw aptErr;

      // 2) marca o slot como indisponível
      const { error: slotErr } = await supabase
        .from("availability_slots")
        .update({ is_available: false })
        .eq("id", selectedSlotForBooking.id);
      if (slotErr) throw slotErr;

      // 3) update otimista do overview
      setOverview(o => ({ total: o.total, available: Math.max(0, o.available - 1), occupied: o.occupied + 1 }));
      setOverviewAppointments(list => [{
        id: apt.id,
        patient_name: patients.find(p => p.id === selectedPatientForBookingId)?.full_name ?? "Paciente Desconhecido",
        start_time: apt.start_time,
        end_time: apt.end_time
      }, ...list]);

      toast({
        title: "Sucesso",
        description: "Consulta agendada para o paciente!",
      });

      // 4) refresh confiável
      fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate);
      
      setSelectedPatientForBookingId(null);
      setSelectedSlotForBooking(null);
      const dateObj = createLocalDateFromISOString(selectedDate!);
      const startOfDayLocal = startOfDay(dateObj);
      const endOfDayLocal = endOfDay(dateObj);
      const scheduleSlots = await getDoctorAvailabilitySlots(user.id, toUtcIso(startOfDayLocal), toUtcIso(endOfDayLocal));
      setSlots(scheduleSlots.slots);
      fetchAppointments();

    } catch (e: any) {
      console.error("Error in handleBookSlotForPatient:", e);
      toast({
        title: "Erro ao agendar consulta",
        description: e.message || "Não foi possível agendar a consulta para o paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsBookingForPatient(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    console.log("Doctor.tsx: Setting up real-time subscription for doctor's view.");
    const channel = supabase.channel("overview-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${user.id}` },
        () => fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "availability_slots", filter: `doctor_id=eq.${user.id}` },
        () => fetchOverview(user.id, selectedTimeframe, customStartDate, customEndDate)
      )
      .subscribe();

    return () => {
      console.log("Doctor.tsx: Unsubscribing from real-time channel for doctor's view.");
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedTimeframe, customStartDate, customEndDate, fetchOverview]);


  const handleDeletePatient = useCallback(async () => {
    if (!patientToDelete) return;

    setIsDeleting(true);
    console.log("Doctor.tsx: Attempting to delete patient:", patientToDelete.id);
    try {
      const { data: deleteData, error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', patientToDelete.id)
        .select();

      if (profileError) {
        console.error("Supabase delete profile error:", profileError);
        throw profileError;
      }

      if (!deleteData || deleteData.length === 0) {
        console.warn("Doctor.tsx: Delete operation returned success but no rows were affected. Likely RLS issue.");
        toast({
          title: "Aviso",
          description: "O paciente não pôde ser excluído. Verifique as permissões de segurança (RLS) no Supabase.",
          variant: "destructive",
        });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      setPatients(prevPatients => {
        const updatedPatients = prevPatients.filter(p => p.id !== patientToDelete.id);
        console.log("Doctor.tsx: Optimistically updated patients list:", updatedPatients);
        return updatedPatients;
      });
      
      toast({ title: "Sucesso", description: `Paciente ${patientToDelete.full_name} excluído com sucesso!` });
      
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["doctorPatients", user.id] });
        await fetchPatients(user.id); 
      }
      queryClient.invalidateQueries({ queryKey: ["patientProfile", patientToDelete.id] });
      queryClient.invalidateQueries({ queryKey: ["patientSessions", patientToDelete.id] });
      queryClient.invalidateQueries({ queryKey: ["patientMedicalRecords", patientToDelete.id] });

      setSelectedPatient(null);
      setPatientToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting patient:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível excluir o paciente.", variant: "destructive",});
    } finally {
      setIsDeleting(false);
    }
  }, [patientToDelete, user, queryClient, toast, setSelectedPatient, setPatients, setPatientToDelete, setIsDeleteDialogOpen, setIsDeleting, fetchPatients]);

  const getDisplayDateRange = useCallback(() => {
    const { start, end } = getDatesForTimeframe(selectedTimeframe, customStartDate, customEndDate);
    if (selectedTimeframe === 'today') {
      return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else if (selectedTimeframe === '7_days' || selectedTimeframe === '14_days') {
      return `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
    } else if (selectedTimeframe === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(customEndDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "Período Selecionado";
  }, [selectedTimeframe, customStartDate, customEndDate]);


  console.log("Doctor component is rendering. User:", user?.id, "Loading:", loading);

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile?.is_doctor) {
    console.log("Doctor component: No user found or not a doctor after loading, redirecting to /auth.");
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
              Bem-vindo(a), {doctorProfile?.full_name || user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
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
                      onClick={() => handleTabChange("contact-forms")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Formulário Contato
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
                        setSelectedSlotForBooking(null);
                      } else {
                        setSelectedDate(undefined);
                        setSelectedSlotIds([]);
                        setSelectedSlotForBooking(null);
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
                    {isLoadingScheduleSlots ? "Carregando horários..." : (slots.length > 0 ? "Selecione horários para ações em massa" : "Nenhum horário cadastrado")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingScheduleSlots ? (
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
                                disabled={isLoadingScheduleSlots}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir ({selectedSlotIds.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggleAvailability(true)}
                                disabled={isLoadingScheduleSlots}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Disponibilizar ({selectedSlotIds.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggleAvailability(false)}
                                disabled={isLoadingScheduleSlots}
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
                          <Button onClick={createDefaultSlots} disabled={isLoadingScheduleSlots}>
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
                    disabled={!selectedDate || isLoadingScheduleSlots || !slots || slots.filter(s => s.is_available).length === 0}
                  >
                    <SelectTrigger id="slot-for-booking-select">
                      <SelectValue placeholder={isLoadingScheduleSlots ? "Carregando horários..." : (slots.filter(s => s.is_available).length === 0 ? "Nenhum horário disponível" : "Selecione um horário")} />
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
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => {
                                setPatientToDelete(patient);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
            {user && <DoctorMedicalRecordsTab currentUserId={user.id} setSelectedPatient={setSelectedPatient} />}
          </TabsContent>

          <TabsContent value="online-consultation">
            {user && <DoctorOnlineConsultationTab isDoctorView={true} />}
          </TabsContent>

          <TabsContent value="contact-forms">
            <DoctorFormResponsesTab />
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