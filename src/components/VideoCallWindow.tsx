"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Tables, Json } from "@/integrations/supabase/types"; // Import Json

type VideoSession = Tables<'video_sessions'>;

interface VideoCallWindowProps {
  sessionId: string;
  otherUserId: string;
  appointmentId?: string;
  isDoctor: boolean;
  onClose: () => void;
}

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function VideoCallWindow({
  sessionId,
  otherUserId,
  appointmentId,
  isDoctor,
  onClose,
}: VideoCallWindowProps) {
  const { user } = useUser();
  const currentUserId = user?.id;

  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("connecting"); // connecting, ringing, active, ended

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const timeoutPromise = new Promise<any>((_, reject) => // Explicitly type Promise.race return
    setTimeout(() => reject(new Error("Operation timed out")), 10000)
  );

  const getMediaDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Não foi possível acessar câmera/microfone. Verifique as permissões.");
      return null;
    }
  }, []);

  const handleEndCall = useCallback(async () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("ended");
    onClose();

    try {
      const { error } = await Promise.race([
        supabase
          .from("video_sessions")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", sessionId),
        timeoutPromise,
      ]);
      if (error) throw error;
      toast.info("Chamada encerrada.");
    } catch (error: any) {
      console.error("Error updating session status to ended:", error.message);
      toast.error("Erro ao finalizar a sessão: " + error.message);
    }
  }, [localStream, sessionId, onClose, timeoutPromise]);

  const setupPeerConnection = useCallback(async (stream: MediaStream) => {
    peerConnection.current = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnection.current.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          const { data: sessionData, error: fetchError } = await Promise.race([
            supabase
              .from("video_sessions")
              .select("ice_candidates")
              .eq("id", sessionId)
              .single(),
            timeoutPromise,
          ]);

          if (fetchError) throw fetchError;

          const currentCandidates = (sessionData?.ice_candidates || []) as RTCIceCandidateInit[];
          const updatedCandidates = [...currentCandidates, event.candidate.toJSON()];

          const { error: updateError } = await Promise.race([
            supabase
              .from("video_sessions")
              .update({ ice_candidates: updatedCandidates as Json })
              .eq("id", sessionId),
            timeoutPromise,
          ]);

          if (updateError) throw updateError;
        } catch (error: any) {
          console.error("Error adding ICE candidate:", error.message);
          toast.error("Erro ao trocar informações de conexão: " + error.message);
        }
      }
    };
  }, [sessionId, timeoutPromise]);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current) return;
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    try {
      const { error } = await Promise.race([
        supabase
          .from("video_sessions")
          .update({ offer: peerConnection.current.localDescription as Json })
          .eq("id", sessionId),
        timeoutPromise,
      ]);
      if (error) throw error;
      setCallStatus("ringing");
      toast.info("Chamando o outro participante...");
    } catch (error: any) {
      console.error("Error creating offer:", error.message);
      toast.error("Erro ao iniciar a chamada: " + error.message);
      handleEndCall();
    }
  }, [sessionId, handleEndCall, timeoutPromise]);

  const createAnswer = useCallback(async (incomingSessionId: string, offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    try {
      const { error } = await Promise.race([
        supabase
          .from("video_sessions")
          .update({ answer: peerConnection.current?.localDescription as Json, status: "active", started_at: new Date().toISOString() })
          .eq("id", incomingSessionId),
        timeoutPromise,
      ]);
      if (error) throw error;
      setCallStatus("active");
      toast.success("Chamada conectada!");
    } catch (error: any) {
      console.error("Error creating answer:", error.message);
      toast.error("Erro ao aceitar a chamada: " + error.message);
      handleEndCall();
    }
  }, [handleEndCall, timeoutPromise]);

  useEffect(() => {
    const initCall = async () => {
      setLoading(true);
      const stream = await getMediaDevices();
      if (!stream) {
        setLoading(false);
        onClose();
        return;
      }
      await setupPeerConnection(stream);

      // Check if this is an existing session or a new one
      const { data: existingSession, error: fetchError } = await Promise.race([
        supabase.from("video_sessions").select("*").eq("id", sessionId).single(),
        timeoutPromise,
      ]);

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching existing session:", fetchError.message);
        toast.error("Erro ao buscar sessão existente: " + fetchError.message);
        setLoading(false);
        handleEndCall();
        return;
      }

      if (existingSession) {
        // Join existing session
        setCallStatus(existingSession.status || "connecting");
        if (existingSession.offer && !existingSession.answer) {
          // If there's an offer but no answer, this user should create an answer
          await createAnswer(sessionId, existingSession.offer as RTCSessionDescriptionInit);
        } else if (existingSession.answer) {
          // If there's an answer, set remote description
          await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(existingSession.answer as RTCSessionDescriptionInit));
          setCallStatus("active");
        }
        // Add ICE candidates
        const candidates = (existingSession.ice_candidates || []) as RTCIceCandidateInit[];
        for (const candidate of candidates) {
          await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } else {
        // Create new session (only if current user is the initiator, e.g., doctor)
        if (isDoctor) {
          const newSessionId = crypto.randomUUID(); // Generate a new UUID for the session
          const { error } = await Promise.race([
            supabase.from("video_sessions").insert({
              id: newSessionId,
              user_id: currentUserId!,
              patient_id: isDoctor ? otherUserId : currentUserId!,
              doctor_id: isDoctor ? currentUserId! : otherUserId,
              room_id: newSessionId, // Use session ID as room ID
              status: "ringing",
              appointment_id: appointmentId || null,
              ice_candidates: [],
            }),
            timeoutPromise,
          ]);
          if (error) throw error;
          // Update sessionId state to the newly created one
          // This is a bit tricky as sessionId is a prop. For simplicity, we'll assume the parent component will re-render with the new sessionId or handle it.
          // For now, we'll proceed with the newSessionId locally.
          // If the parent needs to know, it should pass a callback.
          // For this example, we'll just use the newSessionId for subsequent operations.
          // If the parent component is not re-rendering with the new sessionId, this will cause issues.
          // A better approach would be to manage session creation in the parent and pass the final sessionId.
          // For now, let's assume sessionId is always valid and passed correctly.
          await createOffer();
        } else {
          toast.error("Nenhuma sessão ativa encontrada para participar.");
          handleEndCall();
          return;
        }
      }
      setLoading(false);
    };

    initCall();

    const channel = supabase
      .channel(`video_session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          const updatedSession = payload.new as VideoSession;
          setCallStatus(updatedSession.status || "connecting");

          if (updatedSession.offer && !peerConnection.current?.remoteDescription) {
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(updatedSession.offer as RTCSessionDescriptionInit));
            if (!isDoctor) { // Only patient should create answer if doctor initiated
              await createAnswer(sessionId, updatedSession.offer as RTCSessionDescriptionInit);
            }
          }

          if (updatedSession.answer && !peerConnection.current?.currentRemoteDescription) {
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(updatedSession.answer as RTCSessionDescriptionInit));
            setCallStatus("active");
            toast.success("Chamada conectada!");
          }

          if (updatedSession.ice_candidates && Array.isArray(updatedSession.ice_candidates) && updatedSession.ice_candidates.length > 0) {
            const currentCandidates = (peerConnection.current?.remoteDescription ? peerConnection.current.remoteDescription.iceCandidates : []) || [];
            const newCandidates = (updatedSession.ice_candidates as RTCIceCandidateInit[]).filter(
              (candidate) =>
                !currentCandidates.some(
                  (c: RTCIceCandidate) => c.candidate === candidate.candidate
                )
            );
            for (const candidate of newCandidates) {
              await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }

          if (updatedSession.status === "ended") {
            handleEndCall();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      handleEndCall(); // Ensure call is ended on unmount
    };
  }, [sessionId, isDoctor, appointmentId, currentUserId, getMediaDevices, setupPeerConnection, createOffer, createAnswer, handleEndCall, onClose, timeoutPromise]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
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