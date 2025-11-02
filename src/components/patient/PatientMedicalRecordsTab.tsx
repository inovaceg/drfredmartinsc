"use client";

import React from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type MedicalRecord = Tables<'medical_records'>;

export function PatientMedicalRecordsTab() {
  const { user } = useUser();
  const currentUserId = user?.id;

  const {
    data: patientMedicalRecords,
    isLoading,
    isError,
    error,
  } = useQuery<MedicalRecord[], Error>({
    queryKey: ["patientMedicalRecords", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar prontuários: {error?.message}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Prontuários Médicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {patientMedicalRecords && patientMedicalRecords.length > 0 ? (
          <div className="space-y-3">
            {patientMedicalRecords.map((record) => (
              <div key={record.id} className="border rounded-lg p-3 bg-background">
                <p className="font-medium">
                  Registro em: {format(parseISO(record.created_at || ""), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {record.diagnosis && <p className="text-sm text-muted-foreground">Diagnóstico: {record.diagnosis}</p>}
                {record.prescription && <p className="text-sm text-muted-foreground">Prescrição: {record.prescription}</p>}
                {record.notes && <p className="text-sm mt-1">Notas: {record.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Nenhum prontuário médico registrado.</p>
        )}
      </CardContent>
    </Card>
  );
}