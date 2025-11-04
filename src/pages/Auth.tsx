"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { auth } from "@/integrations/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      console.log("AuthPage: User already authenticated, redirecting to /");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Cadastro realizado com sucesso! Você está logado.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login realizado com sucesso!");
      }
      navigate("/");
    } catch (error: any) {
      console.error("Firebase Auth Error:", error.message);
      toast.error("Erro de autenticação: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Por favor, insira seu e-mail para redefinir a senha.");
      return;
    }
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.info("Um e-mail de redefinição de senha foi enviado para " + email);
    } catch (error: any) {
      console.error("Firebase Password Reset Error:", error.message);
      toast.error("Erro ao redefinir senha: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isRegistering ? "Cadastrar" : "Entrar"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isRegistering ? (
                "Cadastrar"
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Button
              variant="link"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={authLoading}
            >
              {isRegistering
                ? "Já tem uma conta? Entrar"
                : "Não tem uma conta? Cadastrar"}
            </Button>
            {!isRegistering && (
              <Button variant="link" onClick={handlePasswordReset} disabled={authLoading}>
                Esqueceu a senha?
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}