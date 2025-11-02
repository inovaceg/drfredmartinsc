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

  const fetchProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchProfile(user.id);
    }
  }, [user, isUserLoading, navigate, toast]);

  const handleProfileUpdated = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  if (isUserLoading || loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Área do Paciente</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex flex-wrap justify-center w-full bg-muted p-1 rounded-lg border gap-1">
            <TabsTrigger value="profile" className="px-3 py-2 text-sm whitespace-nowrap">Meu Perfil</TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 py-2 text-sm whitespace-nowrap">Agendar Consulta</TabsTrigger>
            <TabsTrigger value="appointments" className="px-3 py-2 text-sm whitespace-nowrap">Meus Agendamentos</TabsTrigger>
            <TabsTrigger value="medical-records" className="px-3 py-2 text-sm whitespace-nowrap">Prontuários</TabsTrigger>
            <TabsTrigger value="documents" className="px-3 py-2 text-sm whitespace-nowrap">Documentos</TabsTrigger>
            <TabsTrigger value="online-consultation" className="px-3 py-2 text-sm whitespace-nowrap">Consulta Online</TabsTrigger>
            <TabsTrigger value="whatsapp-transcriptions" className="px-3 py-2 text-sm whitespace-nowrap">Transcrições WhatsApp</TabsTrigger>
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