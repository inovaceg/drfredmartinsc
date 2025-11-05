import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type BlogPost = Tables<'blog_posts'> & { author_profile?: { full_name: string } };

const BlogSection = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            author_profile:author_id(full_name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setBlogPosts(data || []);
      } catch (err: any) {
        console.error("Erro ao buscar posts do blog:", err.message);
        setError("Não foi possível carregar os posts do blog.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();

    // Setup real-time subscription for published posts
    const channel = supabase
      .channel("blog_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blog_posts",
          filter: `status=eq.published`,
        },
        (payload) => {
          fetchBlogPosts(); // Re-fetch posts on any change to published posts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="blog" className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
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

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : blogPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum post de blog publicado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 p-8 rounded-2xl transition-all hover:shadow-md">
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                {/* Campo de texto fino acima do título */}
                <p className="text-xs text-gray-600 mb-1">{post.category || "Categoria do Post"}</p>
                <h3 className="text-xl font-semibold mb-2 text-red-500 tracking-tight">{post.title}</h3>
                {/* Meta-informações combinadas */}
                <p className="text-sm text-muted-foreground mb-4">
                  Por: {post.author_profile?.full_name || 'Autor Desconhecido'} —{' '}
                  {format(new Date(post.created_at!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt || post.content}</p>
                <a href={`/blog/${post.slug}`} className="text-blue-700 hover:underline font-medium">
                  Leia Mais &rarr;
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;