"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      // User is authenticated, redirect to home or dashboard
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Upsert user profile
          const { user: supabaseUser } = session;
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: supabaseUser.id,
              full_name: supabaseUser.user_metadata.full_name || supabaseUser.email,
              email: supabaseUser.email,
              created_at: supabaseUser.created_at,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' }); // Use onConflict to handle existing profiles

          if (profileError) {
            console.error("Error upserting profile:", profileError.message);
            toast.error("Erro ao criar/atualizar perfil: " + profileError.message);
          } else {
            toast.success("Login realizado com sucesso!");
            navigate("/");
          }
        } else if (event === "SIGNED_OUT") {
          toast.info("Você foi desconectado.");
          navigate("/auth");
        } else if (event === "USER_UPDATED") {
          toast.info("Seu perfil foi atualizado.");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Entrar / Cadastrar</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--primary))",
                  brandAccent: "hsl(var(--primary-foreground))",
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}