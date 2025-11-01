import React from 'react';
import { CheckCircle, User, Users, HeartCrack, Brain, Leaf, Lightbulb } from "lucide-react"; // Importando novos ícones
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ServicesSection = () => {
  return (
    <section id="services" className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-4">
            Meus Serviços
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Terapias e Tratamentos
            <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Para Sua Jornada
            </span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Ofereço uma variedade de abordagens terapêuticas para auxiliar no seu processo de autoconhecimento e bem-estar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {servicesList.map((service, index) => (
            <div key={index} className="bg-white/10 border border-white/10 p-8 rounded-2xl backdrop-blur-md hover:border-blue-400/30 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white tracking-tight">{service.title}</h3>
              <p className="text-white/70 mb-4">{service.description}</p>
              <ul className="space-y-2 text-sm text-white/80">
                {service.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/patient">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold px-8 py-4 text-lg rounded-full">
              Agende Sua Consulta Agora
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const servicesList = [
  {
    icon: <User className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Terapia Individual",
    description: "Sessões focadas no seu desenvolvimento pessoal, superação de desafios e autoconhecimento.",
    benefits: [
      "Redução de ansiedade e estresse",
      "Melhora da autoestima",
      "Desenvolvimento de habilidades de enfrentamento",
      "Clareza sobre objetivos de vida"
    ]
  },
  {
    icon: <Users className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Terapia de Casal",
    description: "Apoio para casais que buscam melhorar a comunicação, resolver conflitos e fortalecer o relacionamento.",
    benefits: [
      "Comunicação eficaz",
      "Resolução de conflitos",
      "Reconexão emocional",
      "Construção de parceria"
    ]
  },
  {
    icon: <HeartCrack className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Sexologia",
    description: "Abordagem especializada para questões relacionadas à sexualidade, intimidade e bem-estar sexual.",
    benefits: [
      "Superação de disfunções sexuais",
      "Melhora da intimidade",
      "Educação sexual",
      "Bem-estar na vida sexual"
    ]
  },
  {
    icon: <Brain className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Psicanálise",
    description: "Exploração profunda do inconsciente para compreender padrões de comportamento e emoções.",
    benefits: [
      "Compreensão de traumas passados",
      "Resolução de conflitos internos",
      "Autoconhecimento profundo",
      "Transformação duradoura"
    ]
  },
  {
    icon: <Leaf className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Espiritualidade e Bem-Estar",
    description: "Integração de aspectos espirituais na busca por um equilíbrio e sentido de vida.",
    benefits: [
      "Conexão com o propósito de vida",
      "Redução do vazio existencial",
      "Desenvolvimento da resiliência",
      "Paz interior"
    ]
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-white" />, // Ícone atualizado
    title: "Workshops e Palestras",
    description: "Eventos e conteúdos educativos sobre saúde mental, relacionamentos e desenvolvimento pessoal.",
    benefits: [
      "Aprendizado em grupo",
      "Ferramentas práticas para o dia a dia",
      "Networking e troca de experiências",
      "Conhecimento especializado"
    ]
  }
];

export default ServicesSection;