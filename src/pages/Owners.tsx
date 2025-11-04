"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser"; // Usar o hook useUser
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function Owners() {
  const { user, isLoading: isUserLoading } = useUser(); // Usar o hook useUser
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (isUserLoading) return;

      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('owners_access')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        setIsOwner(!!data);
      } catch (error: any) {
        console.error("Erro ao verificar status de proprietário:", error.message);
        toast.error("Erro ao verificar permissões: " + error.message);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnerStatus();
  }, [user, isUserLoading, navigate]);

  if (loading || isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => navigate("/")}>Voltar para a Página Inicial</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Painel do Proprietário</h1>
      <p>Bem-vindo ao painel de administração. Aqui você pode gerenciar aspectos importantes do sistema.</p>
      {/* Adicione aqui o conteúdo específico do painel do proprietário */}
    </div>
  );
}