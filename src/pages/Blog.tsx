import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Como a Psicanálise Pode Ajudar na Ansiedade",
      excerpt: "A ansiedade é um dos males do século, e a psicanálise oferece ferramentas profundas para entender suas raízes e desenvolver mecanismos de enfrentamento.",
      date: "15 de Outubro de 2024",
      link: "#"
    },
    {
      id: 2,
      title: "A Importância da Comunicação na Terapia de Casal",
      excerpt: "A comunicação é a base de qualquer relacionamento saudável. Descubra como a terapia de casal pode transformar a forma como vocês se conectam.",
      date: "10 de Outubro de 2024",
      link: "#"
    },
    {
      id: 3,
      title: "Desvendando Mitos sobre a Sexualidade Humana",
      excerpt: "A sexologia busca desmistificar tabus e promover uma vida sexual mais plena e saudável. Conheça os principais mitos e verdades.",
      date: "05 de Outubro de 2024",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-4">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Artigos e Reflexões
              <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Sobre Saúde Mental
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Conteúdo relevante para sua jornada de autoconhecimento e bem-estar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white/10 border border-white/10 p-8 rounded-2xl backdrop-blur-md hover:border-blue-400/30 transition-all">
                <BookOpen className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white tracking-tight">{post.title}</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <p className="text-white/60 text-xs mb-4">{post.date}</p>
                <a href={post.link} className="text-blue-400 hover:underline font-medium">
                  Leia Mais &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;