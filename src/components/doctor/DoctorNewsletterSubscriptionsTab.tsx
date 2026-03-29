"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tables } from "@/integrations/supabase/types";

type NewsletterSubscription = Tables<'newsletter_subscriptions'>;

const columns: ColumnDef<NewsletterSubscription>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "whatsapp",
    header: "WhatsApp",
  },
  {
    accessorKey: "created_at",
    header: "Data de Inscrição",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString("pt-BR");
    },
  },
];

export function DoctorNewsletterSubscriptionsTab() {
  const [newsletterSubscriptions, setNewsletterSubscriptions] = useState<
    NewsletterSubscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("newsletter_subscriptions")
          .select("id, email, name, whatsapp, created_at");

        if (error) {
          throw error;
        }

        setNewsletterSubscriptions(data || []);
      } catch (err: any) {
        console.error("Erro ao buscar inscrições na newsletter:", err.message);
        setError("Erro ao carregar inscrições.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrições na Newsletter</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <DataTable columns={columns} data={newsletterSubscriptions} />
        )}
      </CardContent>
    </Card>
  );
}