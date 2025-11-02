import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, User as UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const newsletterFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  whatsapp: z.string().regex(/^\d{10,11}$/, { message: "WhatsApp inválido. Use apenas números (ex: 11987654321)." }).optional().or(z.literal('')),
});

const Footer = () => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof newsletterFormSchema>>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof newsletterFormSchema>) => {
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .insert([{ name: values.name, email: values.email, whatsapp: values.whatsapp || null }]);

    if (error) {
      console.error("Erro ao assinar newsletter:", error);
      toast({
        title: "Erro na Inscrição",
        description: "Não foi possível assinar a newsletter. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Você se inscreveu na newsletter com sucesso.",
      });
      form.reset();
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Clínica Médica</h3>
          <p className="text-sm">
            Cuidando da sua saúde com excelência e dedicação.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Links Rápidos</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:underline">
                Início
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline">
                Sobre Nós
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:underline">
                Serviços
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contato
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Assine nossa Newsletter</h3>
          <p className="text-sm mb-4">
            Receba as últimas notícias e dicas de saúde diretamente na sua caixa de entrada.
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
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Seu Nome" 
                          {...field} 
                          className="pl-10 bg-primary-foreground text-primary" // Adicionado estilo
                        />
                      </div>
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
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="Seu Email" 
                          {...field} 
                          className="pl-10 bg-primary-foreground text-primary" // Adicionado estilo
                        />
                      </div>
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
                    <FormLabel className="sr-only">WhatsApp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="Seu WhatsApp (opcional)" 
                          {...field} 
                          className="pl-10 bg-primary-foreground text-primary" // Adicionado estilo
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Inscrevendo..." : "Inscrever-se"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="container mx-auto text-center text-sm mt-8 border-t border-primary-foreground/20 pt-8">
        &copy; {new Date().getFullYear()} Clínica Médica. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;