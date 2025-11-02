"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function Shop() {
  const isMobile = useIsMobile();

  const products = [
    {
      id: 1,
      name: "Ebook: Guia Completo de Saúde Mental",
      price: 49.90,
      description: "Um guia aprofundado para entender e cuidar da sua saúde mental.",
      image: "/placeholder.svg",
    },
    {
      id: 2,
      name: "Sessão de Meditação Guiada (Áudio)",
      price: 29.90,
      description: "Áudio de meditação para relaxamento e foco.",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      name: "Workshop Online: Gerenciamento de Estresse",
      price: 199.90,
      description: "Workshop interativo para aprender técnicas eficazes de controle do estresse.",
      image: "/placeholder.svg",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Nossa Loja</h1>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Explore nossos produtos digitais e recursos para apoiar sua jornada de saúde mental.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader className="flex-row items-center space-x-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-muted-foreground mb-4">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <Button>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}