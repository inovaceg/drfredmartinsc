"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, formatDateToDisplay, parseDateFromInput } from "@/lib/utils"; // Importar funções de data
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { formatPhone, unformatPhone } from "@/lib/format-phone"; // Importar funções de telefone

const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório").transform(val => unformatPhone(val)), // Desformata para salvar no DB
  date_of_birth: z.string().optional().nullable().refine(val => !val || parseDateFromInput(val) !== null, { message: "Formato de data inválido (DD/MM/AAAA)" }), // Valida formato dd/mm/aaaa
  zip_code: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  content: z.string().min(1, "Mensagem é obrigatória"),
});

export function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false); // Novo estado para o CEP

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      date_of_birth: null,
      zip_code: "",
      state: "",
      city: "",
      street: "",
      neighborhood: "",
      content: "",
    },
  });

  // Função para buscar CEP
  const handleZipCodeLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    form.setValue("zip_code", cleanedCep); // Atualiza o campo CEP no formulário

    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast.error("CEP não encontrado. Verifique o CEP digitado e tente novamente.");
          form.setValue("state", "");
          form.setValue("city", "");
          form.setValue("street", "");
          form.setValue("neighborhood", "");
        } else {
          form.setValue("street", data.logradouro);
          form.setValue("neighborhood", data.bairro);
          form.setValue("city", data.localidade);
          form.setValue("state", data.uf);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast.error("Não foi possível buscar o CEP. Tente novamente mais tarde.");
        form.setValue("state", "");
        form.setValue("city", "");
        form.setValue("street", "");
        form.setValue("neighborhood", "");
      } finally {
        setIsFetchingCep(false);
      }
    } else if (cleanedCep.length < 8) {
      // Limpa os campos se o CEP estiver incompleto
      form.setValue("state", "");
      form.setValue("city", "");
      form.setValue("street", "");
      form.setValue("neighborhood", "");
    }
  };

  const onSubmit = async (formData: z.infer<typeof contactSchema>) => {
    setLoading(true);
    try {
      // Converte a data de nascimento para o formato YYYY-MM-DD para o Supabase
      const parsedDateOfBirth = formData.date_of_birth ? parseDateFromInput(formData.date_of_birth) : null;

      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          whatsapp: formData.whatsapp, // Já desformatado pelo transform no schema
          date_of_birth: parsedDateOfBirth, // Salva no formato YYYY-MM-DD
          zip_code: formData.zip_code || null,
          state: formData.state || null,
          city: formData.city || null,
          street: formData.street || null,
          neighborhood: formData.neighborhood || null,
          content: formData.content,
          is_read: false,
        });

      if (error) {
        throw error;
      }

      toast.success("Sua mensagem foi enviada com sucesso!");
      form.reset();
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Entre em Contato
            </h2>
            <p className="max-w-[900px] text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Tem alguma dúvida ou gostaria de agendar uma consulta? Preencha o
              formulário abaixo e entraremos em contato.
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-2xl mt-8 bg-white/10 border border-white/10 backdrop-blur-md p-8 rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} className="bg-white text-foreground placeholder:text-muted-foreground" />
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
                        placeholder="(XX) XXXXX-XXXX"
                        maxLength={15} // (99) 99999-9999
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))} // Formata ao digitar
                        className="bg-white text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento (DD/MM/AAAA)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white text-foreground hover:bg-white/90",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              field.value // Exibe a string dd/mm/aaaa diretamente
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseDateFromInput(field.value) : undefined} // Converte string para Date para o Calendar
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(formatDateToDisplay(date.toISOString().split('T')[0])); // Formata Date para string dd/mm/aaaa
                            } else {
                              field.onChange(null);
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXXXX-XXX"
                        maxLength={9} // 99999-999
                        {...field}
                        onChange={(e) => handleZipCodeLookup(e.target.value)}
                        onBlur={(e) => handleZipCodeLookup(e.target.value)}
                        disabled={isFetchingCep}
                        className="bg-white text-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    {isFetchingCep && <p className="text-xs text-muted-foreground mt-1">Buscando CEP...</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu estado" {...field} readOnly disabled={isFetchingCep} className="bg-white text-foreground placeholder:text-muted-foreground" />
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
                      <Input placeholder="Sua cidade" {...field} readOnly disabled={isFetchingCep} className="bg-white text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua rua" {...field} readOnly disabled={isFetchingCep} className="bg-white text-foreground placeholder:text-muted-foreground" />
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
                      <Input placeholder="Seu bairro" {...field} readOnly disabled={isFetchingCep} className="bg-white text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Sua mensagem..."
                        className="min-h-[100px] bg-white text-foreground placeholder:text-muted-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Enviar Mensagem"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}