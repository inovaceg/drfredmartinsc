"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Licensee() {
  const benefits = [
    "Acesso a uma plataforma completa de gestão de pacientes",
    "Ferramentas de agendamento e teleconsulta integradas",
    "Suporte técnico e treinamento contínuo",
    "Comunidade exclusiva de profissionais de saúde mental",
    "Recursos de marketing para impulsionar sua prática",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Seja um Licenciado</h1>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Junte-se à nossa rede de profissionais e leve seus serviços de saúde
          mental para o próximo nível com nossa plataforma inovadora.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Por que se tornar um Licenciado?</h2>
            <p className="text-lg text-muted-foreground">
              Oferecemos uma solução robusta e intuitiva para otimizar a gestão
              da sua clínica ou consultório, permitindo que você foque no que
              realmente importa: o bem-estar dos seus pacientes.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-lg">
                  <CheckCircle2 className="mr-3 h-6 w-6 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-6">
              Saiba Mais e Candidate-se
            </Button>
          </div>
          <div className="flex justify-center">
            <img
              src="/placeholder.svg"
              alt="Licenciamento"
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>
        </div>

        <Card className="mt-12 p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Pronto para Crescer?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Entre em contato conosco para descobrir como nossa parceria pode
              transformar sua prática.
            </p>
            <Button size="lg" variant="secondary">
              Fale Conosco
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}