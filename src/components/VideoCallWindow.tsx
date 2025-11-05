"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Tables, Json } from "@/integrations/supabase/types";
import { connect, LocalVideoTrack, LocalAudioTrack, RemoteVideoTrack, RemoteAudioTrack, Room, Participant } from 'twilio-video'; // Import Twilio Video

type VideoSession = Tables<'video_sessions'>;

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("connecting"); // connecting, ringing, active, ended

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const activeRoom = useRef<Room | null>(null); // Twilio Room object

  const handleEndCall = useCallback(async () => {
    if (activeRoom.current) {
      activeRoom.current.disconnect();
      activeRoom.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("ended");
    onClose();

    try {
      const { error } = await supabase
        .from("video_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
      toast.info("Chamada encerrada.");
    } catch (error: any) {
      console.error("Error updating session status to ended:", error.message);
      toast.error("Erro ao finalizar a sessão: " + error.message);
    }
  }, [localStream, sessionId, onClose]);

  const attachParticipantTracks = (participant: Participant, container: HTMLVideoElement) => {
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        const track = publication.track;
        if (track) {
          container.appendChild(track.attach());
        }
      }
    });
  };

  const detachParticipantTracks = (participant: Participant) => {
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        const track = publication.track;
        if (track) {
          track.detach().forEach(element => element.remove());
        }
      }
    });
  };

  useEffect(() => {
    const startTwilioCall = async () => {
      setLoading(true);
      try {
        // 1. Get Twilio Token from Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-twilio-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.session()?.access_token}`, // Use Supabase session token
          },
          body: JSON.stringify({ identity: currentUserId, roomName: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get Twilio token');
        }

        const { token } = await response.json();

        // 2. Connect to Twilio Room
        const room = await connect(token, {
          name: sessionId,
          audio: true,
          video: { width: 640 },
        });
        activeRoom.current = room;
        setCallStatus("active");
        toast.success("Conectado à sala de vídeo!");

        // 3. Attach local participant's tracks
        room.localParticipant.tracks.forEach(publication => {
          if (publication.track) {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = new MediaStream([publication.track.mediaStreamTrack]);
            }
            setLocalStream(new MediaStream([publication.track.mediaStreamTrack]));
          }
        });

        // 4. Handle remote participants
        room.participants.forEach(participant => {
          console.log(`Participant "${participant.identity}" connected`);
          if (remoteVideoRef.current) {
            attachParticipantTracks(participant, remoteVideoRef.current);
            setRemoteStream(new MediaStream()); // Indicate remote stream is present
          }
        });

        room.on('participantConnected', participant => {
          console.log(`Participant "${participant.identity}" connected`);
          participant.on('trackSubscribed', track => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.appendChild(track.attach());
              setRemoteStream(new MediaStream([track.mediaStreamTrack]));
            }
          });
          participant.on('trackUnsubscribed', track => {
            track.detach().forEach(element => element.remove());
            setRemoteStream(null); // Or re-evaluate if other tracks exist
          });
        });

        room.on('participantDisconnected', participant => {
          console.log(`Participant "${participant.identity}" disconnected`);
          detachParticipantTracks(participant);
          setRemoteStream(null); // Clear remote stream when participant leaves
        });

        room.on('disconnected', (room, error) => {
          if (error) {
            console.error('Twilio Room disconnected with error:', error);
            toast.error("Conexão de vídeo perdida: " + error.message);
          } else {
            console.log('Twilio Room disconnected gracefully.');
          }
          handleEndCall();
        });

        // Update Supabase with Twilio Room SID
        if (room.sid) {
          await supabase
            .from("video_sessions")
            .update({ twilio_room_sid: room.sid, status: "active", started_at: new Date().toISOString() })
            .eq("id", sessionId);
        }

      } catch (error: any) {
        console.error("Error starting Twilio call:", error.message);
        toast.error("Erro ao iniciar a chamada de vídeo: " + error.message);
        handleEndCall();
      } finally {
        setLoading(false);
      }
    };

    startTwilioCall();

    // Cleanup on unmount
    return () => {
      if (activeRoom.current) {
        activeRoom.current.disconnect();
        activeRoom.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentUserId, sessionId, appointmentId, isDoctor, handleEndCall]);

  const toggleMute = () => {
    if (activeRoom.current) {
      if (isMuted) {
        activeRoom.current.localParticipant.audioTracks.forEach(publication => publication.track?.enable());
      } else {
        activeRoom.current.localParticipant.audioTracks.forEach(publication => publication.track?.disable());
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (activeRoom.current) {
      if (isVideoOff) {
        activeRoom.current.localParticipant.videoTracks.forEach(publication => publication.track?.enable());
      } else {
        activeRoom.current.localParticipant.videoTracks.forEach(publication => publication.track?.disable());
      }
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
          {callStatus === "ringing"
            ? "(Chamando...)"
            : callStatus === "active"
            ? "(Ativa)"
            : "(Conectando...)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            Você
          </div>
        </div>
        <div className="relative bg-black rounded-lg overflow-hidden">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white">
              Aguardando o outro participante...
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            {isDoctor ? "Paciente" : "Doutor(a)"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className={isMuted ? "bg-red-500 text-white" : ""}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          <span className="sr-only">{isMuted ? "Desmutar" : "Mutar"}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleVideo}
          className={isVideoOff ? "bg-red-500 text-white" : ""}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          <span className="sr-only">{isVideoOff ? "Ligar Vídeo" : "Desligar Vídeo"}</span>
        </Button>
        <Button variant="destructive" size="icon" onClick={handleEndCall}>
          <PhoneOff className="h-5 w-5" />
          <span className="sr-only">Encerrar Chamada</span>
        </Button>
      </CardFooter>
    </Card>
  );
}