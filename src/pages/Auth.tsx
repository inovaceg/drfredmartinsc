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
      console.log("AuthPage: User already authenticated, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Profile creation is handled by the 'handle_new_user' trigger in Supabase.
          // We just need to ensure the user is redirected after successful sign-in.
          console.log("AuthPage: SIGNED_IN event, user:", session.user.id, ". Relying on trigger for profile creation.");
          toast.success("Login realizado com sucesso!");
          navigate("/");
        } else if (event === "SIGNED_OUT") {
          console.log("AuthPage: SIGNED_OUT event.");
          toast.info("Você foi desconectado.");
          navigate("/auth");
        } else if (event === "USER_UPDATED") {
          console.log("AuthPage: USER_UPDATED event.");
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