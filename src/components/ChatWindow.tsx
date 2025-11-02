"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils"; // Importando cn

type Message = Tables<'patient_doctor_messages'> & { sender_name?: string };
type Profile = Tables<'profiles'>;

interface ChatWindowProps {
  receiverId: string;
  appointmentId?: string;
}

export function ChatWindow({ receiverId, appointmentId }: ChatWindowProps) {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiverProfile, setReceiverProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessagesAndReceiverProfile = async () => {
      setLoading(true);
      try {
        // Fetch messages
        const { data: fetchedMessages, error: messagesError } = await supabase
          .from("patient_doctor_messages")
          .select("*")
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .or(`sender_id.eq.${receiverId},receiver_id.eq.${receiverId}`)
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
    const channel = supabase
      .channel(`chat_room_${currentUserId}_${receiverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "patient_doctor_messages",
          filter: `(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId})`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          // Fetch sender name for the new message
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

  const handleSendMessage = async () => {
    if (!newMessageContent.trim() || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("patient_doctor_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          appointment_id: appointmentId || null,
          content: newMessageContent,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // The subscription will handle adding the message to the state
      setNewMessageContent("");
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      toast.error("Erro ao enviar mensagem: " + error.message);
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
              <p>{msg.content}</p>
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
        <div className="flex w-full space-x-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={!newMessageContent.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}