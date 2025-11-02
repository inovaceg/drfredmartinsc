"use client";

import React from "react";
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

const newsletterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().optional(),
});

export function Footer() {
  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof newsletterSchema>) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert([
          { name: values.name, email: values.email, whatsapp: values.whatsapp || null },
        ]);

      if (error) {
        throw error;
      }

      toast.success("Inscrição realizada com sucesso!");
      form.reset();
    } catch (error: any) {
      toast.error("Erro ao se inscrever: " + error.message);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground p-8 mt-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Sobre Nós</h3>
          <p className="text-sm">
            Oferecemos serviços de saúde mental de qualidade, com profissionais
            dedicados e um ambiente acolhedor.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Links Rápidos</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:underline">
                Serviços
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Nossa Equipe
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Contato
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Newsletter</h3>
          <p className="text-sm mb-4">
            Receba as últimas notícias e atualizações diretamente na sua caixa
            de entrada.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu email" {...field} />
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
                    <FormLabel className="sr-only">WhatsApp (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu WhatsApp (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Inscrever-se
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="mt-8 text-center text-sm border-t border-primary-foreground/20 pt-4">
        © {new Date().getFullYear()} Sua Empresa. Todos os direitos reservados.
      </div>
    </footer>
  );
}