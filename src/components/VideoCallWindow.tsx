"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { connect, LocalVideoTrack, LocalAudioTrack, RemoteVideoTrack, RemoteAudioTrack, Room, Participant } from 'twilio-video';
import { VideoParticipant } from "./VideoParticipant";

type VideoSession = Tables<'video_sessions'>;
type Profile = Tables<'profiles'>;

interface VideoCallWindowProps {
  currentUserId: string;
  sessionId: string;
  otherUserId: string;
  appointmentId?: string;
  isDoctor: boolean;
  onClose: () => void;
}

export function VideoCallWindow({
  currentUserId,
  sessionId,
  otherUserId,
  appointmentId,
  isDoctor,
  onClose,
}: VideoCallWindowProps) {
  const [loading, setLoading] = useState(true);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [remoteParticipant, setRemoteParticipant, ] = useState<Participant | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("connecting"); // connecting, active, ended

  const activeRoom = useRef<Room | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("Participante");

  const fetchOtherUserName = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherUserId)
        .single();
      if (error) throw error;
      setOtherUserName(data?.full_name || "Participante Desconhecido");
    } catch (error: any) {
      console.error("VideoCallWindow: Erro ao buscar nome do outro usuário:", error.message);
      setOtherUserName("Participante Desconhecido");
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchOtherUserName();
  }, [fetchOtherUserName]);

  const handleEndCall = useCallback(async () => {
    console.log("VideoCallWindow: handleEndCall chamado. Status atual:", callStatus);
    if (activeRoom.current) {
      console.log("VideoCallWindow: Desconectando da sala Twilio...");
      activeRoom.current.disconnect();
      activeRoom.current = null;
    } else {
      console.log("VideoCallWindow: activeRoom.current é nulo, não há sala Twilio para desconectar.");
    }
    setLocalParticipant(null);
    setRemoteParticipant(null);
    setCallStatus("ended");
    onClose();

    try {
      console.log("VideoCallWindow: Atualizando status da sessão de vídeo no Supabase para 'ended'...");
      const { error } = await supabase
        .from("video_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
      toast.info("Chamada encerrada.");
      console.log("VideoCallWindow: Status da sessão atualizado no Supabase.");
    } catch (error: any) {
      console.error("VideoCallWindow: Erro ao atualizar status da sessão para 'ended':", error.message);
      toast.error("Erro ao finalizar a sessão: " + error.message);
    }
  }, [sessionId, onClose, callStatus]);

  useEffect(() => {
    const startTwilioCall = async () => {
      setLoading(true);
      console.log("VideoCallWindow: Iniciando chamada Twilio...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Usuário não autenticado para iniciar a chamada.");
        }
        console.log("VideoCallWindow: Sessão Supabase obtida. Buscando token Twilio...");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-twilio-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ identity: currentUserId, roomName: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("VideoCallWindow: Erro na resposta da função Twilio:", errorData);
          throw new Error(errorData.error || 'Falha ao obter token Twilio.');
        }

        const { token } = await response.json();
        console.log("VideoCallWindow: Token Twilio obtido. Conectando à sala...");

        const room = await connect(token, {
          name: sessionId,
          audio: true,
          video: { width: 640 },
        });
        activeRoom.current = room;
        setLocalParticipant(room.localParticipant);
        setCallStatus("active");
        toast.success("Conectado à sala de vídeo!");
        console.log("VideoCallWindow: Conectado à sala Twilio. LocalParticipant definido.");

        room.participants.forEach(participant => {
          if (participant.identity === otherUserId) {
            setRemoteParticipant(participant);
            console.log(`VideoCallWindow: RemoteParticipant "${participant.identity}" encontrado e definido.`);
          }
        });

        room.on('participantConnected', participant => {
          console.log(`VideoCallWindow: Participante "${participant.identity}" conectado`);
          if (participant.identity === otherUserId) {
            setRemoteParticipant(participant);
          }
        });

        room.on('participantDisconnected', participant => {
          console.log(`VideoCallWindow: Participante "${participant.identity}" desconectado`);
          if (participant.identity === otherUserId) {
            setRemoteParticipant(null);
          }
        });

        room.on('disconnected', (room, error) => {
          if (error) {
            console.error('VideoCallWindow: Sala Twilio desconectada com erro:', error);
            toast.error("Conexão de vídeo perdida: " + error.message);
          } else {
            console.log('VideoCallWindow: Sala Twilio desconectada graciosamente.');
          }
          handleEndCall();
        });

        if (room.sid) {
          console.log("VideoCallWindow: Atualizando sessão de vídeo no Supabase com twilio_room_sid e status 'active'...");
          await supabase
            .from("video_sessions")
            .update({ twilio_room_sid: room.sid, status: "active", started_at: new Date().toISOString() })
            .eq("id", sessionId);
          console.log("VideoCallWindow: Sessão de vídeo atualizada no Supabase.");
        }

      } catch (error: any) {
        console.error("VideoCallWindow: Erro fatal ao iniciar chamada Twilio:", error.message);
        toast.error("Erro ao iniciar a chamada de vídeo: " + error.message);
        handleEndCall(); // Tenta encerrar a chamada e limpar o estado mesmo em caso de erro
      } finally {
        setLoading(false);
        console.log("VideoCallWindow: startTwilioCall finalizado. setLoading(false).");
      }
    };

    startTwilioCall();

    return () => {
      console.log("VideoCallWindow: Cleanup useEffect. Desconectando da sala Twilio se ainda estiver ativa.");
      if (activeRoom.current) {
        activeRoom.current.disconnect();
      }
    };
  }, [currentUserId, sessionId, otherUserId, handleEndCall]);

  const toggleMute = () => {
    if (localParticipant) {
      const audioTracks = Array.from(localParticipant.audioTracks.values());
      audioTracks.forEach(publication => {
        if (isMuted) {
          publication.track?.enable();
        } else {
          publication.track?.disable();
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localParticipant) {
      const videoTracks = Array.from(localParticipant.videoTracks.values());
      videoTracks.forEach(publication => {
        if (isVideoOff) {
          publication.track?.enable();
        } else {
          publication.track?.disable();
        }
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b">
        <CardTitle>
          Chamada de Vídeo{" "}
          {callStatus === "connecting"
            ? "(Conectando...)"
            : callStatus === "active"
            ? "(Ativa)"
            : "(Encerrada)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {localParticipant && (
          <VideoParticipant
            participant={localParticipant}
            isLocal={true}
            displayName="Você"
          />
        )}
        {remoteParticipant ? (
          <VideoParticipant
            participant={remoteParticipant}
            isLocal={false}
            displayName={otherUserName}
          />
        ) : (
          <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center text-white">
            Aguardando {otherUserName}...
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className={isMuted ? "bg-red-500 text-white" : ""}
          disabled={callStatus === "ended"}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className="sr-only">{isMuted ? "Desmutar" : "Mutar"}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleVideo}
          className={isVideoOff ? "bg-red-500 text-white" : ""}
          disabled={callStatus === "ended"}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          <span className="sr-only">{isVideoOff ? "Ligar Vídeo" : "Desligar Vídeo"}</span>
        </Button>
        <Button variant="destructive" size="icon" onClick={handleEndCall} disabled={callStatus === "ended"}>
          <PhoneOff className="h-5 w-5" />
          <span className="sr-only">Encerrar Chamada</span>
        </Button>
      </CardFooter>
    </Card>
  );
}