"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Button } from "lucide-react"; // Added Button import
import { PatientProfileForm } from "@/components/PatientProfileForm";
import { PatientScheduleTab } from "@/components/patient/PatientScheduleTab";
import { PatientAppointmentsTab } from "@/components/patient/PatientAppointmentsTab";
import { PatientMedicalRecordsTab } from "@/components/patient/PatientMedicalRecordsTab";
import { OnlineConsultationTab } from "@/components/OnlineConsultationTab";
import { PatientDocumentsPage } from "@/pages/PatientDocumentsPage"; // Named export
import { WhatsappTranscriptionsPage } from "@/pages/WhatsappTranscriptionsPage"; // Named export
import { Tables } from "@/integrations/supabase/types";
import { Button as ShadcnButton } from "@/components/ui/button"; // Renamed import to avoid conflict

type Profile = Tables<'profiles'>;

export default function Patient() {
  const { user, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  console.log("Patient.tsx: Componente Patient renderizado.");
  console.log("Patient.tsx: isUserLoading:", isUserLoading, "loadingProfile:", loadingProfile);
  console.log("Patient.tsx: user:", user ? user.id : "null");
  console.log("Patient.tsx: profile:", profile ? profile.id : "null");

  const fetchProfile = async (userId: string) => {
    console.log("Patient.tsx: fetchProfile iniciado para userId:", userId);
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Patient.tsx: Erro ao buscar perfil no Supabase:", error.message);
        throw error;
      }
      setProfile(data);
      console.log("Patient.tsx: Perfil carregado com sucesso:", data);
    } catch (error: any) {
      console.error("Patient.tsx: Erro no fetchProfile:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu perfil: " + error.message,
        variant: "destructive",
      });
      setProfile(null); // Garante que o perfil seja nulo em caso de erro
    } finally {
      setLoadingProfile(false);
      console.log("Patient.tsx: fetchProfile finalizado. setLoadingProfile(false).");
    }
  };

  useEffect(() => {
    console.log("Patient.tsx: useEffect (user/isUserLoading) disparado.");
    if (!isUserLoading && !user) {
      console.log("Patient.tsx: Usuário não logado, redirecionando para /auth.");
      navigate("/auth");
    } else if (user) {
      console.log("Patient.tsx: Usuário logado, chamando fetchProfile.");
      fetchProfile(user.id);
    }
  }, [user, isUserLoading, navigate, toast]);

  const handleProfileUpdated = () => {
    console.log("Patient.tsx: handleProfileUpdated chamado.");
    if (user) {
      fetchProfile(user.id);
    }
  };

  if (isUserLoading || loadingProfile) {
    console.log("Patient.tsx: Exibindo Loader2. isUserLoading:", isUserLoading, "loadingProfile:", loadingProfile);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    console.log("Patient.tsx: Usuário ou perfil não disponível após carregamento. user:", user ? user.id : "null", "profile:", profile ? profile.id : "null");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao Carregar Perfil</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Não foi possível carregar as informações do seu perfil. Por favor, tente novamente.
        </p>
        <ShadcnButton onClick={() => navigate("/")}>Voltar para a Página Inicial</ShadcnButton> {/* Used ShadcnButton */}
      </div>
    );
  }

  console.log("Patient.tsx: Renderizando conteúdo principal do paciente.");
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Área do Paciente</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex flex-wrap justify-center w-full bg-muted p-1 rounded-lg border gap-1">
            <TabsTrigger value="profile" className="px-3 py-2 text-sm text-center">Meu Perfil</TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 py-2 text-sm text-center">Agendar Consulta</TabsTrigger>
            <TabsTrigger value="appointments" className="px-3 py-2 text-sm text-center">Meus Agendamentos</TabsTrigger>
            <TabsTrigger value="medical-records" className="px-3 py-2 text-sm text-center">Prontuários</TabsTrigger>
            <TabsTrigger value="documents" className="px-3 py-2 text-sm text-center">Documentos</TabsTrigger>
            <TabsTrigger value="online-consultation" className="px-3 py-2 text-sm text-center">Consulta Online</TabsTrigger>
            <TabsTrigger value="whatsapp-transcriptions" className="px-3 py-2 text-sm text-center">Transcrições WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <PatientProfileForm profile={profile} onProfileUpdated={handleProfileUpdated} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-6">
            <PatientScheduleTab />
          </TabsContent>
          <TabsContent value="appointments" className="mt-6">
            <PatientAppointmentsTab />
          </TabsContent>
          <TabsContent value="medical-records" className="mt-6">
            <PatientMedicalRecordsTab />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <PatientDocumentsPage />
          </TabsContent>
          <TabsContent value="online-consultation" className="mt-6">
            <OnlineConsultationTab isDoctorView={false} />
          </TabsContent>
          <TabsContent value="whatsapp-transcriptions" className="mt-6">
            <WhatsappTranscriptionsPage />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}