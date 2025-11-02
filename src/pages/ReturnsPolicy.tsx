"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ReturnsPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Política de Devolução</h1>
        <div className="prose max-w-3xl mx-auto">
          <p>
            Nossa política de devolução e reembolso é válida por 30 dias. Se 30
            dias se passaram desde a sua compra, infelizmente não podemos
            oferecer um reembolso ou troca.
          </p>
          <p>
            Para ser elegível para uma devolução, seu item deve estar sem uso e
            nas mesmas condições em que você o recebeu. Também deve estar na
            embalagem original.
          </p>
          <h2>Reembolsos (se aplicável)</h2>
          <p>
            Uma vez que sua devolução é recebida e inspecionada, enviaremos um
            e-mail para notificá-lo de que recebemos seu item devolvido. Também
            o notificaremos sobre a aprovação ou rejeição do seu reembolso.
          </p>
          <p>
            Se você for aprovado, seu reembolso será processado e um crédito
            será automaticamente aplicado ao seu cartão de crédito ou método
            original de pagamento, dentro de um determinado número de dias.
          </p>
          <h2>Trocas (se aplicável)</h2>
          <p>
            Nós apenas substituímos itens se estiverem com defeito ou danificados.
            Se você precisar trocá-lo pelo mesmo item, envie-nos um e-mail para
            [seu e-mail] e envie seu item para: [seu endereço].
          </p>
          <h2>Envio</h2>
          <p>
            Você será responsável por pagar seus próprios custos de envio para
            devolver seu item. Os custos de envio não são reembolsáveis. Se você
            receber um reembolso, o custo do envio de devolução será deduzido do
            seu reembolso.
          </p>
          <p>
            Dependendo de onde você mora, o tempo que pode levar para o seu
            produto trocado chegar até você pode variar.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}