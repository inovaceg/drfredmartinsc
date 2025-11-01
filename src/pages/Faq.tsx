import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const Faq = () => {
  const faqItems = [
    {
      question: "Como funciona a terapia online?",
      answer: "A terapia online é realizada por videochamada, em um ambiente seguro e confidencial. As sessões têm a mesma duração e estrutura das sessões presenciais, permitindo flexibilidade e acesso de qualquer lugar."
    },
    {
      question: "Qual a duração de uma sessão?",
      answer: "Geralmente, as sessões têm duração de 50 minutos, mas isso pode ser ajustado conforme a necessidade e o tipo de terapia, sempre em comum acordo com o paciente."
    },
    {
      question: "Os dados e conversas são confidenciais?",
      answer: "Sim, a confidencialidade é um pilar fundamental da ética profissional. Todas as informações compartilhadas durante as sessões são estritamente confidenciais e protegidas por sigilo profissional."
    },
    {
      question: "Quais são as formas de pagamento?",
      answer: "Aceitamos diversas formas de pagamento, incluindo Pix, transferência bancária e cartões de crédito. Os detalhes são combinados no primeiro contato ou na sessão inicial."
    },
    {
      question: "Posso cancelar ou reagendar uma sessão?",
      answer: "Sim, é possível cancelar ou reagendar sessões com aviso prévio de 24 horas. Para cancelamentos ou reagendamentos fora desse prazo, a sessão poderá ser cobrada."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-4">
              FAQ
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Perguntas Frequentes
              <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Suas Dúvidas Respondidas
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Encontre respostas para as perguntas mais comuns sobre terapia, agendamento e serviços.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-white/10">
                  <AccordionTrigger className="text-lg font-semibold text-white hover:text-blue-300 transition-colors">
                    <HelpCircle className="h-5 w-5 text-blue-400 mr-3" />
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 text-base pl-8">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;