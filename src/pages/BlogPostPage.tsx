"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown'; // Importar ReactMarkdown
import remarkGfm from 'remark-gfm'; // Importar remarkGfm para suporte a tabelas, etc.

type BlogPost = Tables<'blog_posts'> & { author_profile?: { full_name: string } };

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError("Slug do post não fornecido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            author_profile:author_id(full_name)
          `)
          .eq('slug', slug)
          .eq('status', 'published') // Apenas posts publicados
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // No rows found
            setError("Post não encontrado ou não publicado.");
          } else {
            throw error;
          }
        } else {
          setPost(data || null);
        }
      } catch (err: any) {
        console.error("Erro ao buscar post do blog:", err.message);
        setError("Não foi possível carregar o post: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-destructive mb-4">Erro</h1>
          <p className="text-lg text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => navigate('/#blog')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Blog
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Post Não Encontrado</h1>
          <p className="text-lg text-muted-foreground mb-8">
            O artigo que você está procurando não existe ou não está disponível.
          </p>
          <Button onClick={() => navigate('/#blog')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Blog
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => navigate('/#blog')} variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Blog
          </Button>

          <Card className="p-6 md:p-10">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
              />
            )}

            {post.category && (
              <p className="text-sm text-muted-foreground mb-2">
                <BookOpen className="h-4 w-4 mr-2 inline-block" />
                {post.category}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-red-700 mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center text-muted-foreground text-sm mb-8">
              <span>
                Por {post.author_profile?.full_name || 'Autor Desconhecido'} em{' '}
                {format(new Date(post.created_at!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="prose max-w-none text-foreground leading-relaxed space-y-6">
              {/* Renderizar conteúdo Markdown */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;