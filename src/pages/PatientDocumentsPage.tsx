"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "@/integrations/supabase/types";

type Document = Tables<'documents'>;

export function PatientDocumentsPage() {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const patientId = user?.id;

  useEffect(() => {
    if (!patientId) return;

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error: any) {
        console.error("Error fetching documents:", error.message);
        toast.error("Erro ao carregar documentos: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    const channel = supabase
      .channel("documents_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `patient_id=eq.${patientId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDocuments((prev) => [payload.new as Document, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !patientId) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    setUploading(true);
    try {
      const fileExtension = file.name.split(".").pop();
      const filePath = `${patientId}/${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("patient_documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("patient_documents")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("documents").insert({
        patient_id: patientId,
        file_name: file.name,
        file_path: publicUrlData.publicUrl,
        file_type: file.type,
        description: description || null,
        file_size: file.size,
        created_at: new Date().toISOString(), // Use created_at instead of uploaded_at
      });

      if (insertError) throw insertError;

      toast.success("Documento enviado com sucesso!");
      setFile(null);
      setDescription("");
      setIsUploadDialogOpen(false);
    } catch (error: any) {
      console.error("Error uploading document:", error.message);
      toast.error("Erro ao enviar documento: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      // Extract the path relative to the bucket
      const pathSegments = filePath.split('/patient_documents/');
      const relativePath = pathSegments.length > 1 ? pathSegments[1] : filePath;

      const { error: storageError } = await supabase.storage
        .from("patient_documents")
        .remove([relativePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (dbError) throw dbError;

      toast.success("Documento excluído com sucesso!");
    } catch (error: any) {
      console.error("Error deleting document:", error.message);
      toast.error("Erro ao excluir documento: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Documentos</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Novo Documento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  Arquivo
                </Label>
                <Input id="file" type="file" className="col-span-3" onChange={handleFileChange} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  placeholder="Breve descrição do documento (opcional)"
                  className="col-span-3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Enviar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum documento encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <FileText className="h-6 w-6 text-primary" />
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer" download={doc.file_name}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Baixar</span>
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id, doc.file_path)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-semibold text-lg">{doc.file_name}</p>
                {doc.description && <p className="text-gray-600 text-sm mt-1">{doc.description}</p>}
                <p className="text-gray-500 text-xs mt-2">
                  Enviado em: {new Date(doc.created_at || "").toLocaleDateString()}
                </p>
                {doc.file_size && (
                  <p className="text-gray-500 text-xs">Tamanho: {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}