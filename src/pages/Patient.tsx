import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, FileText, LogOut, Video, LayoutGrid, MessageSquare, Menu } from "lucide-react"; // Adicionado Menu
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { OnlineConsultationTab } from "@/components/OnlineConsultationTab";
import PatientDocumentsPage from "@/pages/PatientDocumentsPage";

// Importar os novos componentes modulares
import { PatientOverviewTab } from "@/components/patient/PatientOverviewTab";
import { PatientScheduleTab } from "@/components/patient/PatientScheduleTab";
import { PatientAppointmentsTab } from "@/components/patient/PatientAppointmentsTab";
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

const Patient = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null); // Explicitly type user state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Estado para controlar o Drawer
  const { toast } = useToast();

  const fetchPatientProfile = useCallback(async (userId: string) => {
    console.log("Patient.tsx: Buscando perfil do paciente para userId:", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Patient.tsx: Erro ao buscar perfil do paciente:", error);
      toast({
        title: "Erro ao carregar perfil do paciente",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      console.log("Patient.tsx: Perfil do paciente encontrado:", data);
      setPatientProfile(data);
    }
  }, [toast]);

  // Centralized auth state management for this component
  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log("Patient.tsx: Auth state change event:", event, "Sessão:", session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        console.log("Patient.tsx: Evento SIGNED_OUT detectado. Redirecionando para /auth.");
        setPatientProfile(null);
        navigate("/auth");
      } else if (currentUser) {
        console.log("Patient.tsx: Usuário logado, buscando perfil.");
        await fetchPatientProfile(currentUser.id);
      } else {
        console.log("Patient.tsx: Nenhum usuário logado, redirecionando para /auth.");
        navigate("/auth");
      }
    };

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Patient.tsx: Verificação inicial da sessão. Sessão:", session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log("Patient.tsx: Usuário logado inicialmente, buscando perfil.");
        await fetchPatientProfile(currentUser.id);
      } else {
        console.log("Patient.tsx: Nenhum usuário logado inicialmente, redirecionando para /auth.");
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Patient.tsx: Desinscrevendo do listener de auth state change.");
      subscription.unsubscribe();
    };
  }, [navigate, fetchPatientProfile, toast]);

  const handleSignOut = async () => {
    console.log("Patient.tsx: Tentando deslogar...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Patient.tsx: Erro ao deslogar:", error);
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Patient.tsx: Deslogado com sucesso.");
      toast({
        title: "Sucesso",
        description: "Você foi desconectado(a).",
      });
      // A navegação para /auth será tratada pelo listener onAuthStateChange
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsDrawerOpen(false); // Fecha o drawer ao selecionar uma aba
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Portal do Paciente</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo(a), {patientProfile?.full_name || user?.user_metadata?.full_name || user?.email}
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
              <LayoutGrid className="h-4 w-4 mr-2" />
              Início
            </TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 py-2 text-sm whitespace-nowrap">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </TabsTrigger>
            <TabsTrigger value="appointments" className="px-3 py-2 text-sm whitespace-nowrap">
              <Clock className="h-4 w-4 mr-2" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="online-consultation" className="px-3 py-2 text-sm whitespace-nowrap">
              <MessageSquare className="h-4 w-4 mr-2" />
              Consulta Online
            </TabsTrigger>
            <TabsTrigger value="documents" className="px-3 py-2 text-sm whitespace-nowrap">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Mobile Drawer Menu */}
          <div className="md:hidden mb-4">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Menu className="h-4 w-4 mr-2" />
                  {activeTab === "overview" && "Início"}
                  {activeTab === "schedule" && "Agendar"}
                  {activeTab === "appointments" && "Consultas"}
                  {activeTab === "online-consultation" && "Consulta Online"}
                  {activeTab === "documents" && "Documentos"}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh] rounded-t-[10px] flex flex-col">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Navegação do Portal</DrawerTitle>
                  <DrawerDescription>Selecione uma opção abaixo</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex-1 overflow-y-auto">
                  <TabsList className="flex flex-col w-full bg-muted p-1 rounded-lg border space-y-1">
                    <TabsTrigger value="overview" className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left" onClick={() => handleTabChange("overview")}>
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Início
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left" onClick={() => handleTabChange("schedule")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left" onClick={() => handleTabChange("appointments")}>
                      <Clock className="h-4 w-4 mr-2" />
                      Consultas
                    </TabsTrigger>
                    <TabsTrigger value="online-consultation" className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left" onClick={() => handleTabChange("online-consultation")}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Consulta Online
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="w-full justify-start px-4 py-3 text-base whitespace-nowrap text-left" onClick={() => handleTabChange("documents")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Documentos
                    </TabsTrigger>
                  </TabsList>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Fechar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <PatientOverviewTab setActiveTab={handleTabChange} />
          </TabsContent>

          <TabsContent value="schedule">
            <PatientScheduleTab
              user={user}
              setActiveTab={handleTabChange}
              onAppointmentBooked={() => {
                // This callback will trigger a re-fetch in PatientAppointmentsTab
                // by changing the key or directly calling a refetch function if passed down.
                // For simplicity, we'll just rely on the Appointments tab re-fetching on mount/tab change.
              }}
            />
          </TabsContent>

          <TabsContent value="appointments">
            <PatientAppointmentsTab
              user={user}
              onAppointmentsChanged={() => {
                // This callback can be used to refresh data in other tabs if needed
                // For now, it just ensures the appointments tab itself refreshes.
              }}
            />
          </TabsContent>

          <TabsContent value="online-consultation">
            {user && <OnlineConsultationTab currentUserId={user.id} />}
          </TabsContent>

          <TabsContent value="documents">
            {user && <PatientDocumentsPage />}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Patient;