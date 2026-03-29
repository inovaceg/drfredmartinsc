"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Camera, X } from "lucide-react";
import { formatPhone, unformatPhone } from "@/lib/format-phone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDateToDisplay, parseDateFromInput } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { v4 as uuidv4 } from 'uuid';

type PatientProfile = Database['public']['Tables']['profiles']['Row'];

interface EditPatientDialogProps {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientUpdated: (patientId: string) => void;
}

export function EditPatientDialog({ patientId, open, onOpenChange, onPatientUpdated }: EditPatientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    street: "",
    street_number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    birth_date: "",
    mental_health_history: "",
    main_complaints: "",
    previous_diagnoses: "",
    current_medications: "",
    past_sessions_history: "",
    therapist_id: "",
    consent_status: false,
    consent_date: "",
    avatar_url: "",
  });
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [existingNotes, setExistingNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const { data: patient, isLoading: isLoadingPatient } = useQuery<PatientProfile | null, Error>({
    queryKey: ["patientProfile", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!patientId,
  });

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Database['public']['Tables']['profiles']['Row'][], Error>({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_doctors_public");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (patient && open) {
      setFormData({
        full_name: patient.full_name || "",
        phone: patient.phone ? formatPhone(patient.phone) : "",
        whatsapp: patient.whatsapp ? formatPhone(patient.whatsapp) : "",
        street: patient.street || "",
        street_number: patient.street_number || "",
        neighborhood: patient.neighborhood || "",
        city: patient.city || "",
        state: patient.state || "",
        zip_code: patient.zip_code || "",
        birth_date: patient.birth_date ? formatDateToDisplay(patient.birth_date) : "",
        mental_health_history: patient.mental_health_history || "",
        main_complaints: patient.main_complaints || "",
        previous_diagnoses: patient.previous_diagnoses || "",
        current_medications: patient.current_medications || "",
        past_sessions_history: patient.past_sessions_history || "",
        therapist_id: patient.therapist_id || "",
        consent_status: patient.consent_status || false,
        consent_date: patient.consent_status ? (patient.consent_date ? format(new Date(patient.consent_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")) : "",
        avatar_url: patient.avatar_url || "",
      });
      fetchDoctorNotes();
    }
  }, [patient, open]);

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
      toast({ title: "Sucesso", description: "Foto atualizada!" });
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

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

  const fetchDoctorNotes = async () => {
    if (!patient) return;
    setLoadingNotes(true);
    const { data } = await supabase
      .from('doctor_notes')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });
    setExistingNotes(data || []);
    setLoadingNotes(false);
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

    if (!patientId) return;

    try {
      const parsedBirthDate = formData.birth_date ? parseDateFromInput(formData.birth_date) : null;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: unformatPhone(formData.phone),
          whatsapp: unformatPhone(formData.whatsapp),
          street: formData.street,
          street_number: formData.street_number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          birth_date: parsedBirthDate,
          mental_health_history: formData.mental_health_history || null,
          main_complaints: formData.main_complaints || null,
          previous_diagnoses: formData.previous_diagnoses || null,
          current_medications: formData.current_medications || null,
          past_sessions_history: formData.past_sessions_history || null,
          therapist_id: formData.therapist_id || null,
          consent_status: formData.consent_status,
          consent_date: formData.consent_status ? (formData.consent_date || new Date().toISOString()) : null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);

      if (profileError) throw profileError;

      if (doctorNotes.trim()) {
        const user = await supabase.auth.getUser();
        await supabase.from('doctor_notes').insert({
          patient_id: patientId,
          doctor_id: user.data.user?.id,
          notes: doctorNotes.trim(),
        });
      }

      toast({ title: "Sucesso", description: "Dados atualizados!" });
      queryClient.invalidateQueries({ queryKey: ["patientProfile", patientId] });
      queryClient.invalidateQueries({ queryKey: ["doctorPatients"] });
      onPatientUpdated(patientId);
      onOpenChange(false);
      setDoctorNotes("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingPatient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados do Paciente</DialogTitle>
          <DialogDescription>Atualize as informações e adicione observações</DialogDescription>
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
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <h3 className="font-semibold text-lg">Informações Pessoais</h3>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="99-9-9999-9999"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                placeholder="99-9-9999-9999"
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento (DD/MM/AAAA)</Label>
            <Input
              id="birth_date"
              value={formData.birth_date}
              onChange={handleDateInputChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
            />
          </div>

          <h3 className="font-semibold text-lg mt-8">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleZipCodeLookup(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={formData.state} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={formData.city} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Rua/Avenida</Label>
            <Input id="street" value={formData.street} readOnly className="bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="street_number">Número</Label>
              <Input
                id="street_number"
                value={formData.street_number}
                onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" value={formData.neighborhood} readOnly className="bg-muted" />
            </div>
          </div>

          <h3 className="font-semibold text-lg mt-8">Informações Terapêuticas</h3>
          <div className="space-y-2">
            <Label htmlFor="mental_health_history">Histórico de Saúde Mental</Label>
            <Textarea
              id="mental_health_history"
              value={formData.mental_health_history}
              onChange={(e) => setFormData({ ...formData, mental_health_history: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="therapist_id">Terapeuta Principal</Label>
            <Select
              value={formData.therapist_id}
              onValueChange={(value) => setFormData({ ...formData, therapist_id: value })}
              disabled={isLoadingDoctors}
            >
              <SelectTrigger id="therapist_id">
                <SelectValue placeholder="Selecione um terapeuta" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="consent_status"
              checked={formData.consent_status}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, consent_status: checked as boolean }))}
            />
            <Label htmlFor="consent_status">Consentimento Assinado</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Adicionar Observação Médica</Label>
            <Textarea
              id="notes"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Escreva suas observações..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}