import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Stethoscope, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

interface PatientMedicalRecordsTabProps {
  currentUserId: string;
}

export const PatientMedicalRecordsTab: React.FC<PatientMedicalRecordsTabProps> = ({ currentUserId }) => {
  const { toast } = useToast();

  const { data: patientMedicalRecords, isLoading: isLoadingMedicalRecords } = useQuery<MedicalRecord[], Error>({
    queryKey: ["patientMedicalRecords", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching patient medical records:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!currentUserId,
  });

  if (isLoadingMedicalRecords) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Meus Prontuários Médicos
        </CardTitle>
        <CardDescription>
          Visualize seu histórico de prontuários médicos registrados pelo seu profissional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {patientMedicalRecords && patientMedicalRecords.length > 0 ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {patientMedicalRecords.map((record) => (
              <div key={record.id} className="border rounded-lg p-4 space-y-2 bg-background">
                <p className="font-semibold text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  {format(new Date(record.created_at!), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {record.diagnosis && <p><span className="font-medium">Diagnóstico:</span> {record.diagnosis}</p>}
                {record.prescription && <p><span className="font-medium">Prescrição:</span> {record.prescription}</p>}
                {record.notes && <p><span className="font-medium">Notas:</span> {record.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhum prontuário médico encontrado.
          </p>
        )}
      </CardContent>
    </Card>
  );
};