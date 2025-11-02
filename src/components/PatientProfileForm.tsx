"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User as UserIcon } from "lucide-react";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { formatPhone, unformatPhone } from "@/lib/format-phone";
import { formatDateToDisplay, parseDateFromInput } from "@/lib/utils";

// Input mask handler for date field
const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: string) => void) => {
  let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
  let formattedValue = '';

  if (value.length > 0) {
    formattedValue += value.substring(0, 2);
    if (value.length > 2) {
      formattedValue += '/' + value.substring(2, 4);
    }
    if (value.length > 4) {
      formattedValue += '/' + value.substring(4, 8);
    }
  }
  fieldOnChange(formattedValue);
};

const profileSchema = z.object({
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  birth_date: z.string().optional(), // Will store dd/mm/yyyy string
  street: z.string().optional(),
  street_number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PatientProfileFormProps {
  profile: any; // Assuming 'any' for now, but ideally a specific Profile type
  onProfileUpdated: () => void;
}

export function PatientProfileForm({ profile, onProfileUpdated }: PatientProfileFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone ? formatPhone(profile.phone) : "",
      whatsapp: profile.whatsapp ? formatPhone(profile.whatsapp) : "",
      birth_date: profile.birth_date ? formatDateToDisplay(profile.birth_date) : "",
      street: profile.street || "",
      street_number: profile.street_number || "",
      neighborhood: profile.neighborhood || "",
      city: profile.city || "",
      state: profile.state || "",
      zip_code: profile.zip_code || "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        phone: profile.phone ? formatPhone(profile.phone) : "",
        whatsapp: profile.whatsapp ? formatPhone(profile.whatsapp) : "",
        birth_date: profile.birth_date ? formatDateToDisplay(profile.birth_date) : "",
        street: profile.street || "",
        street_number: profile.street_number || "",
        neighborhood: profile.neighborhood || "",
        city: profile.city || "",
        state: profile.state || "",
        zip_code: profile.zip_code || "",
      });
      if (profile.state) {
        fetchCities(profile.state);
      }
    }
  }, [profile, form]);

  const fetchCities = async (stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`
      );
      const data = await response.json();
      setCities(data.map((city: any) => city.nome).sort());
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleZipCodeLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    form.setValue("zip_code", cleanedCep);

    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado e tente novamente.",
            variant: "destructive",
          });
          form.setValue("state", "");
          form.setValue("city", "");
          setCities([]);
        } else {
          form.setValue("street", data.logradouro);
          form.setValue("neighborhood", data.bairro);
          form.setValue("state", data.uf);
          form.setValue("city", data.localidade);
          fetchCities(data.uf);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({
          title: "Erro na consulta de CEP",
          description: "Não foi possível buscar o CEP. Tente novamente mais tarde.",
          variant: "destructive",
        });
        form.setValue("state", "");
        form.setValue("city", "");
        setCities([]);
      } finally {
        setIsFetchingCep(false);
      }
    } else if (cleanedCep.length < 8) {
      form.setValue("state", "");
      form.setValue("city", "");
      setCities([]);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);

    const parsedBirthDate = parseDateFromInput(values.birth_date);
    if (values.birth_date && !parsedBirthDate) {
      toast({
        title: "Erro de Data",
        description: "O formato da data de nascimento deve ser DD/MM/AAAA e ser uma data válida.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        phone: values.phone ? unformatPhone(values.phone) : null,
        whatsapp: values.whatsapp ? unformatPhone(values.whatsapp) : null,
        birth_date: parsedBirthDate,
        street: values.street || null,
        street_number: values.street_number || null,
        neighborhood: values.neighborhood || null,
        city: values.city || null,
        state: values.state || null,
        zip_code: values.zip_code || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Seu perfil foi atualizado com sucesso!",
      });
      onProfileUpdated();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Meu Perfil</h2>
          <p className="text-muted-foreground">Atualize suas informações pessoais e de contato.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="99-9-9999-9999"
                      maxLength={15}
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="99-9-9999-9999"
                      maxLength={15}
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento (DD/MM/AAAA)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    {...field}
                    onChange={(e) => handleDateInputChange(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <h3 className="font-semibold text-lg mt-8">Endereço</h3>

          <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00000-000"
                    maxLength={9}
                    {...field}
                    onChange={(e) => handleZipCodeLookup(e.target.value)}
                    onBlur={(e) => handleZipCodeLookup(e.target.value)}
                    disabled={isFetchingCep}
                  />
                </FormControl>
                {isFetchingCep && <p className="text-xs text-muted-foreground mt-1">Buscando CEP...</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Estado"
                      readOnly
                      disabled={isFetchingCep}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cidade"
                      readOnly
                      disabled={isFetchingCep}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rua/Avenida</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da rua ou avenida" {...field} disabled={isFetchingCep} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="street_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} disabled={isFetchingCep} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do bairro" {...field} disabled={isFetchingCep} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || isFetchingCep}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </Form>
    </div>
  );
}