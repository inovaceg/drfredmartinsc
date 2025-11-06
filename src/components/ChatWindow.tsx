"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Paperclip, Mic, FileText, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils"; // Importando cn
import { ChatInputWithAttachments } from "@/components/ChatInputWithAttachments"; // Importar o novo componente

type Message = Tables<'patient_doctor_messages'> & { sender_name?: string };
type Profile = Tables<'profiles'>;

interface ChatWindowProps {
  currentUserId: string;
  receiverId: string;
  appointmentId?: string;
}

export function ChatWindow({ currentUserId, receiverId, appointmentId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiverProfile, setReceiverProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null); // State to manage audio playback

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessagesAndReceiverProfile = async () => {
      setLoading(true);
      try {
        // Construir a string do filtro para mensagens entre os dois usuários
        const filterString = `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId}))`;
        console.log("ChatWindow: Filter string for fetching messages:", filterString);

        const { data: fetchedMessages, error: messagesError } = await supabase
          .from("patient_doctor_messages")
          .select("*")
          .or(filterString) // Usar a string do filtro corrigida
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch sender names for all messages
        const messagesWithSenderNames = await Promise.all(
          (fetchedMessages || []).map(async (msg) => {
            const { data: senderProfile, error: senderError } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .single();

            if (senderError) {
              console.error("Error fetching sender profile:", senderError.message);
              return { ...msg, sender_name: "Desconhecido" };
            }
            return { ...msg, sender_name: senderProfile?.full_name || "Desconhecido" };
          })
        );

        setMessages(messagesWithSenderNames);

        // Fetch receiver profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", receiverId)
          .single();

        if (profileError) throw profileError;
        setReceiverProfile(profileData);
      } catch (error: any) {
        console.error("Error fetching chat data:", error.message);
        toast.error("Erro ao carregar o chat: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessagesAndReceiverProfile();

    // Setup real-time subscription
    // Os filtros de realtime já estavam corretos, pois usam 'and' separadamente
    const channel = supabase
      .channel(`chat_room_${currentUserId}_${receiverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "patient_doctor_messages",
          filter: `sender_id.eq.${currentUserId}.and.receiver_id.eq.${receiverId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          const { data: senderProfile, error } = await supabase.from('profiles').select('full_name').eq('id', newMessage.sender_id).single();
          if (!error && senderProfile) {
            setMessages((prev) => [...prev, { ...newMessage, sender_name: senderProfile.full_name }]);
          } else {
            setMessages((prev) => [...prev, { ...newMessage, sender_name: "Desconhecido" }]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "patient_doctor_messages",
          filter: `sender_id.eq.${receiverId}.and.receiver_id.eq.${currentUserId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          const { data: senderProfile, error } = await supabase.from('profiles').select('full_name').eq('id', newMessage.sender_id).single();
          if (!error && senderProfile) {
            setMessages((prev) => [...prev, { ...newMessage, sender_name: senderProfile.full_name }]);
          } else {
            setMessages((prev) => [...prev, { ...newMessage, sender_name: "Desconhecido" }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, fileUrl?: string, fileType?: string) => {
    if (!content.trim() && !fileUrl || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("patient_doctor_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          appointment_id: appointmentId || null,
          content: content.trim(),
          is_read: false,
          file_url: fileUrl || null,
          file_type: fileType || null,
        })
        .select()
        .single();

      if (error) throw error;

      // The subscription will handle adding the message to the state
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      toast.error("Erro ao enviar mensagem: " + error.message);
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.file_url && msg.file_type?.startsWith("image/")) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block max-w-xs rounded-lg overflow-hidden">
          <img src={msg.file_url} alt="Anexo de imagem" className="w-full h-auto object-cover" />
          {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
        </a>
      );
    } else if (msg.file_url && msg.file_type?.startsWith("audio/")) {
      const isPlaying = playingAudio === msg.id;
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isPlaying) {
                setPlayingAudio(null); // Stop playing
              } else {
                setPlayingAudio(msg.id); // Start playing this audio
                const audio = new Audio(msg.file_url);
                audio.onended = () => setPlayingAudio(null);
                audio.play();
              }
            }}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-sm">Mensagem de Áudio</span>
          {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
        </div>
      );
    } else if (msg.file_url) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-400 hover:underline">
          <FileText className="h-5 w-5" />
          <span className="text-sm">Anexo: {msg.file_url.split('/').pop()}</span>
          {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
        </a>
      );
    }
    return <p>{msg.content}</p>;
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
        <CardTitle>Chat com {receiverProfile?.full_name || "Usuário"}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender_id === currentUserId ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] p-3 rounded-lg",
                msg.sender_id === currentUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <p className="font-semibold text-sm mb-1">
                {msg.sender_id === currentUserId ? "Você" : msg.sender_name}
              </p>
              {renderMessageContent(msg)}
              <span className="block text-xs text-right opacity-75 mt-1">
                {new Date(msg.created_at || "").toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t p-4">
        <ChatInputWithAttachments onSendMessage={handleSendMessage} disabled={false} />
      </CardFooter>
    </Card>
  );
}