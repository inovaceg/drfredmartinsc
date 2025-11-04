"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, StopCircle, Paperclip, XCircle, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

interface ChatInputWithAttachmentsProps {
  onSendMessage: (content: string, fileUrl?: string, fileType?: string) => void;
  disabled?: boolean;
}

export function ChatInputWithAttachments({ onSendMessage, disabled }: ChatInputWithAttachmentsProps) {
  const [messageContent, setMessageContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (disabled) return;

    if (messageContent.trim() || selectedFile || audioBlob) {
      let fileUrl: string | undefined;
      let fileType: string | undefined;

      if (selectedFile) {
        const { url, type } = await uploadFile(selectedFile);
        fileUrl = url;
        fileType = type;
      } else if (audioBlob) {
        const { url, type } = await uploadFile(audioBlob, "audio/webm");
        fileUrl = url;
        fileType = type;
      }

      onSendMessage(messageContent.trim(), fileUrl, fileType);
      setMessageContent("");
      setSelectedFile(null);
      setAudioBlob(null);
      setAudioUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFile = async (file: File | Blob, customType?: string) => {
    const fileExtension = file instanceof File ? file.name.split('.').pop() : (customType === "audio/webm" ? "webm" : "bin");
    const fileName = `${uuidv4()}.${fileExtension}`;
    const bucket = "chat_attachments"; // You'll need to create this bucket in Supabase Storage

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: customType || (file instanceof File ? file.type : undefined),
      });

    if (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao fazer upload do arquivo: " + error.message);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, type: customType || (file instanceof File ? file.type : undefined) };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAudioBlob(null); // Clear audio if a file is selected
      setAudioUrl(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setSelectedFile(null); // Clear file if recording audio
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop(); // Ensure recorder stops and releases mic
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isInputEmpty = messageContent.trim() === "" && !selectedFile && !audioBlob;

  return (
    <div className="flex w-full space-x-2 items-center">
      {selectedFile && (
        <div className="flex items-center p-2 border rounded-md bg-muted text-muted-foreground">
          <Paperclip className="h-4 w-4 mr-2" />
          <span>{selectedFile.name}</span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="ml-2 h-6 w-6">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center p-2 border rounded-md bg-muted text-muted-foreground">
          <audio src={audioUrl} controls className="h-8" />
          <Button variant="ghost" size="icon" onClick={cancelAudio} className="ml-2 h-6 w-6">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!selectedFile && !audioUrl && (
        <>
          <Input
            placeholder="Digite sua mensagem..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isInputEmpty) {
                handleSend();
              }
            }}
            disabled={disabled || isRecording}
            className="flex-1"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isRecording}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isRecording}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Anexar arquivo</span>
          </Button>
          {isRecording ? (
            <Button variant="destructive" size="icon" onClick={stopRecording} disabled={disabled}>
              <StopCircle className="h-4 w-4 animate-pulse" />
              <span className="sr-only">Parar gravação</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={startRecording} disabled={disabled}>
              <Mic className="h-4 w-4" />
              <span className="sr-only">Gravar áudio</span>
            </Button>
          )}
        </>
      )}

      <Button onClick={handleSend} disabled={disabled || isInputEmpty}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Enviar</span>
      </Button>
    </div>
  );
}