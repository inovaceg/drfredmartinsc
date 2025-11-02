import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, CalendarDays, Phone, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone } from "@/lib/format-phone";

type NewsletterSubscription = Database['public']['Tables']['newsletter_subscriptions']['Row'];

export const DoctorNewsletterSubscriptionsTab: React.FC = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    // Seleção explícita das colunas para garantir que 'name' e 'whatsapp' sejam buscados
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, name, whatsapp, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar inscrições da newsletter:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as inscrições da newsletter.",
        variant: "destructive",
      });
    } else {
      // Adicionado console.log para depuração
      console.log("Dados da newsletter recebidos do Supabase:", data);
      setSubscriptions(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Inscrições na Newsletter
        </CardTitle>
        <CardDescription>
          Visualize todos os e-mails inscritos para receber sua newsletter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma inscrição na newsletter encontrada.
          </p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Data de Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {subscription.name || 'Não Informado'}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {subscription.whatsapp ? formatPhone(subscription.whatsapp) : 'Não Informado'}
                    </TableCell>
                    <TableCell>{subscription.email}</TableCell>
                    <TableCell className="text-right">
                      {subscription.created_at ? format(new Date(subscription.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};