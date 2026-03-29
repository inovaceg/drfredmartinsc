"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Video, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ChatWindow } from "@/components/ChatWindow";
import { VideoCallWindow } from "@/components/VideoCallWindow";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showIncomingCallToast } from "@/components/IncomingCallNotification";

type Profile = Tables<'profiles'>;
type VideoSession = Tables<'video_sessions'>;

interface ActiveSession extends VideoSession {
  patient_profile?: Profile;
  doctor_profile?: Profile;
}

interface OnlineConsultationTabProps {
  isDoctorView: boolean;
}

export function OnlineConsultationTab({ isDoctorView }: OnlineConsultationTabProps) {
  const { user } = useUser();
  const currentUserId = user?.id;

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [incomingCallToastId, setIncomingCallToastId] = useState<string | number | null>(null);

  const fetchActiveSessions = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      let query = supabase
        .from("video_sessions")
        .select(`
          *,
          patient_profile:patient_id(full_name),
          doctor_profile:doctor_id(full_name)
        `);

      if (isDoctorView) {
        query = query.eq("doctor_id", currentUserId);
      } else {
        query = query.eq("patient_id", currentUserId);
      }

      query = query.in("status", ["ringing", "active"]).order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setActiveSessions(data as ActiveSession[]);
    } catch (error: any) {
      console.error("Error fetching active sessions:", error.message);
      toast.error("Erro ao carregar sessões ativas.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isDoctorView]);

  useEffect(() => {
    fetchActiveSessions();

    const channel = supabase
      .channel("video_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_sessions",
          filter: isDoctorView ? `doctor_id=eq.${currentUserId}` : `patient_id=eq.${currentUserId}`,
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSessions, currentUserId, isDoctorView]);

  useEffect(() => {
    if (isDoctorView || !currentUserId) return;

    const ringingSession = activeSessions.find(
      (session) => session.status === "ringing" && session.patient_id === currentUserId
    );

    if (ringingSession && incomingCallToastId !== ringingSession.id) {
      if (incomingCallToastId) {
        toast.dismiss(incomingCallToastId);
      }
      
      const callerName = ringingSession.doctor_profile?.full_name;
      
      const newToastId = showIncomingCallToast({
        sessionId: ringingSession.id,
        callerName: callerName || "Doutor(a) Desconhecido",
        onAccept: handleAcceptCall,
        onReject: handleRejectCall,
      });
      setIncomingCallToastId(newToastId);
    } else if (!ringingSession && incomingCallToastId) {
      toast.dismiss(incomingCallToastId);
      setIncomingCallToastId(null);
    }
  }, [activeSessions, currentUserId, isDoctorView, incomingCallToastId]);


  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("video_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Sessão encerrada!");
      fetchActiveSessions();
      setSelectedSession(null);
      setIsChatOpen(false);
      setIsVideoCallOpen(false);
    } catch (error: any) {
      toast.error("Erro ao encerrar sessão.");
    }
  };

  const handleAcceptCall = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("video_sessions")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Chamada aceita!");
      const sessionToStart = activeSessions.find(s => s.id === sessionId);
      if (sessionToStart) {
        setSelectedSession(sessionToStart);
        setIsVideoCallOpen(true);
        setIsChatOpen(false);
      }
      setIncomingCallToastId(null);
    } catch (error: any) {
      toast.error("Erro ao aceitar chamada.");
    }
  };

  const handleRejectCall = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("video_sessions")
        .update({ status: "cancelled", ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      toast.info("Chamada rejeitada.");
      fetchActiveSessions();
      setIncomingCallToastId(null);
    } catch (error: any) {
      toast.error("Erro ao rejeitar chamada.");
    }
  };

  const handleOpenChat = (session: ActiveSession) => {
    setSelectedSession(session);
    setIsChatOpen(true);
    setIsVideoCallOpen(false);
  };

  const handleOpenVideoCall = (session: ActiveSession) => {
    setSelectedSession(session);
    setIsVideoCallOpen(true);
    setIsChatOpen(false);
  };

  const handleCloseVideoCall = () => {
    setIsVideoCallOpen(false);
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isChatOpen && selectedSession && currentUserId) {
    const otherUserId = isDoctorView ? selectedSession.patient_id! : selectedSession.doctor_id!;
    return (
      <ChatWindow
        currentUserId={currentUserId}
        receiverId={otherUserId}
        appointmentId={selectedSession.appointment_id || undefined}
      />
    );
  }

  if (isVideoCallOpen && selectedSession && currentUserId) {
    const otherUserId = isDoctorView ? selectedSession.patient_id! : selectedSession.doctor_id!;
    return (
      <VideoCallWindow
        currentUserId={currentUserId}
        sessionId={selectedSession.id}
        otherUserId={otherUserId}
        appointmentId={selectedSession.appointment_id || undefined}
        isDoctor={isDoctorView}
        onClose={handleCloseVideoCall}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultas Online Ativas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSessions.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma consulta online ativa no momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeSessions.map((session) => (
              <Card key={session.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">
                    {isDoctorView ? session.patient_profile?.full_name : session.doctor_profile?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">Status: {session.status}</p>
                  {session.started_at && (
                    <p className="text-xs text-muted-foreground">
                      Iniciada em: {format(new Date(session.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenChat(session)}>
                    <MessageSquare className="h-4 w-4" />
                    <span className="sr-only">Abrir Chat</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleOpenVideoCall(session)}>
                    <Video className="h-4 w-4" />
                    <span className="sr-only">Iniciar Vídeo Chamada</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleEndSession(session.id)}>
                    Encerrar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}