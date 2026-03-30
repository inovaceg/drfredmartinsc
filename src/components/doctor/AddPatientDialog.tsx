"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Camera, X } from "lucide-react";
import { formatPhone, unformatPhone } from "@/lib/format-phone";
import { useQueryClient } from "@tanstack/react-query";
import { parseDateFromInput } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { v4 as uuidv4 } from 'uuid';

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
}

export function AddPatientDialog({ open, onOpenChange, doctorId }: AddPatientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    birth_date: "",
    zip_code: "",
    state: "",
    city: "",
    street: "",
    street_number: "",
    neighborhood: "",
    avatar_url: "",
  });

  const handleZipCodeLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, zip_code: cleanedCep }));

    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado.",
            variant: "destructive",
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            state: data.uf,
            city: data.localidade,
            street: data.logradouro,
            neighborhood: data.bairro,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `patient-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Sucesso", description: "Foto carregada!" });
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    if (value.length > 0) {
      formattedValue += value.substring(0, 2);
      if (value.length > 2) formattedValue += '/' + value.substring(2, 4);
      if (value.length > 4) formattedValue += '/' + value.substring(4, 8);
    }
    setFormData((prev) => ({ ...prev, birth_date: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedBirthDate = formData.birth_date ? parseDateFromInput(formData.birth_date) : null;
      const newPatientId = uuidv4();

      console.log("Tentando cadastrar paciente com ID:", newPatientId, "Doutor Responsável:", doctorId);

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: newPatientId,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: unformatPhone(formData.phone) || null,
          whatsapp: unformatPhone(formData.whatsapp) || null,
          birth_date: parsedBirthDate,
          zip_code: formData.zip_code || null,
          state: formData.state || null,
          city: formData.city || null,
          street: formData.street || null,
          street_number: formData.street_number || null,
          neighborhood: formData.neighborhood || null,
          avatar_url: formData.avatar_url || null,
          therapist_id: doctorId,
          is_doctor: false,
          is_active: true,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Paciente cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["doctorPatients"] });
      onOpenChange(false);
      setFormData({
        full_name: "", email: "", phone: "", whatsapp: "", birth_date: "",
        zip_code: "", state: "", city: "", street: "", street_number: "",
        neighborhood: "", avatar_url: "",
      });
    } catch (error: any) {
      console.error('Erro detalhado ao cadastrar paciente:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Erro desconhecido no banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Novo Paciente
          </DialogTitle>
          <DialogDescription>Preencha os dados para criar o prontuário.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-muted">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-primary/10">
                  <Camera className="w-8 h-8 text-primary/40" />
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </Button>
              {formData.avatar_url && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full w-6 h-6"
                  onClick={() => setFormData(prev => ({ ...prev, avatar_url: "" }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 0000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Nascimento</Label>
              <Input id="birth_date" value={formData.birth_date} onChange={handleDateInputChange} placeholder="DD/MM/AAAA" maxLength={10} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input id="zip_code" value={formData.zip_code} onChange={(e) => handleZipCodeLookup(e.target.value)} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" value={formData.state} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={formData.city} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || isFetchingCep || isUploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}