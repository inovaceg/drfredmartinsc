"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { formatPhone, unformatPhone } from "@/lib/format-phone";
import { useQueryClient } from "@tanstack/react-query";
import { parseDateFromInput } from "@/lib/utils";

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
      
      // Geramos um UUID para o paciente, já que ele está sendo cadastrado manualmente pelo médico
      // Nota: Este paciente não terá um login associado inicialmente até que um usuário auth seja criado/vinculado.
      const newPatientId = crypto.randomUUID();

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: newPatientId,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: unformatPhone(formData.phone),
          whatsapp: unformatPhone(formData.whatsapp),
          birth_date: parsedBirthDate,
          zip_code: formData.zip_code,
          state: formData.state,
          city: formData.city,
          street: formData.street,
          street_number: formData.street_number,
          neighborhood: formData.neighborhood,
          therapist_id: doctorId,
          is_doctor: false,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente cadastrado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ["doctorPatients", doctorId] });
      onOpenChange(false);
      setFormData({
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
      });
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar o paciente.",
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
          <DialogDescription>
            Preencha os dados básicos para criar o prontuário do paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="Nome do paciente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Nascimento (DD/MM/AAAA)</Label>
              <Input
                id="birth_date"
                value={formData.birth_date}
                onChange={handleDateInputChange}
                placeholder="DD/MM/AAAA"
                maxLength={10}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={formData.city} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="street">Rua/Avenida</Label>
                <Input id="street" value={formData.street} readOnly className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isFetchingCep}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}