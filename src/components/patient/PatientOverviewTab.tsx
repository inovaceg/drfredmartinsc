import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Video, LayoutGrid, Stethoscope } from "lucide-react"; // Adicionado Stethoscope

interface PatientOverviewTabProps {
  setActiveTab: (tab: string) => void;
}

export const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({ setActiveTab }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("schedule")}>
        <CardHeader>
          <Calendar className="h-8 w-8 mb-2 text-primary" />
          <CardTitle>Agendar Consulta</CardTitle>
          <CardDescription>
            Veja os horários disponíveis e agende sua consulta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Agendar Agora</Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("appointments")}>
        <CardHeader>
          <Clock className="h-8 w-8 mb-2 text-primary" />
          <CardTitle>Minhas Consultas</CardTitle>
          <CardDescription>
            Veja suas consultas agendadas e histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">Ver Consultas</Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("online-consultation")}>
        <CardHeader>
          <Video className="h-8 w-8 mb-2 text-primary" />
          <CardTitle>Consulta Online</CardTitle>
          <CardDescription>
            Inicie uma consulta por vídeo chamada ou chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">Iniciar Consulta</Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("documents")}>
        <CardHeader>
          <FileText className="h-8 w-8 mb-2 text-primary" />
          <CardTitle>Meus Documentos</CardTitle>
          <CardDescription>
            Upload e visualização de exames e documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">Ver Documentos</Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("medical-records")}> {/* Atualizado para a nova aba */}
        <CardHeader>
          <Stethoscope className="h-8 w-8 mb-2 text-primary" /> {/* Ícone para prontuário */}
          <CardTitle>Prontuário</CardTitle>
          <CardDescription>
            Acesse seu histórico médico e prontuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">Ver Prontuário</Button>
        </CardContent>
      </Card>
    </div>
  );
};