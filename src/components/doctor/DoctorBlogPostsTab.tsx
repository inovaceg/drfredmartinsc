"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2, BookOpen, Eye, EyeOff, Save, X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames

type BlogPost = Tables<'blog_posts'>;

const blogPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (apenas letras minúsculas, números e hífens)"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  excerpt: z.string().optional().nullable(),
  image_url: z.string().url("URL da imagem inválida").optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "published"], { message: "Status inválido" }),
  category: z.string().optional().nullable(), // Novo campo de categoria
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

interface BlogPostFormProps {
  initialData?: BlogPost;
  onSave: (data: BlogPostFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({ initialData, onSave, onCancel, isSaving }) => {
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      content: initialData?.content || "",
      excerpt: initialData?.excerpt || "",
      image_url: initialData?.image_url || "",
      status: initialData?.status || "draft",
      category: initialData?.category || "", // Valor padrão para categoria
    },
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.image_url || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para o input de arquivo

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    console.log("BlogPostForm: useEffect (initialData) triggered. initialData:", initialData?.id);
    if (initialData) {
      form.reset({
        title: initialData.title,
        slug: initialData.slug,
        content: initialData.content,
        excerpt: initialData.excerpt,
        image_url: initialData.image_url,
        status: initialData.status as "draft" | "published",
        category: initialData.category || "", // Resetar categoria
      });
      setImagePreviewUrl(initialData.image_url || null);
    } else {
      // If initialData is null/undefined, it means we are creating a new post or clearing the form
      form.reset({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        image_url: "",
        status: "draft",
        category: "", // Limpar categoria
      });
      setImagePreviewUrl(null);
      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [initialData, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      form.clearErrors("image_url"); // Clear any URL validation errors
      form.setValue("image_url", ""); // Clear manual URL if file is selected
      console.log("BlogPostForm: File selected for upload:", file.name);
    } else {
      setSelectedImageFile(null);
      if (!form.getValues("image_url")) { // Only clear preview if no manual URL is set
        setImagePreviewUrl(null);
      }
      console.log("BlogPostForm: File selection cleared.");
    }
  };

  const uploadImageToSupabase = async (file: File) => {
    setIsUploadingImage(true);
    console.log("BlogPostForm: Starting image upload for file:", file.name);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const bucket = "blog_images";

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log("BlogPostForm: Image uploaded successfully. Public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("BlogPostForm: Error uploading image:", error);
      toast.error("Erro ao fazer upload da imagem: " + error.message);
      return null;
    } finally {
      setIsUploadingImage(false);
      console.log("BlogPostForm: Image upload finished.");
    }
  };

  const handleSubmit = async (values: BlogPostFormValues) => {
    console.log("BlogPostForm: handleSubmit triggered. Values:", values);
    let finalImageUrl = values.image_url;

    if (selectedImageFile) {
      const uploadedUrl = await uploadImageToSupabase(selectedImageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        console.log("BlogPostForm: Image upload failed, preventing form submission.");
        // If upload failed, prevent saving and show error
        return;
      }
    } else if (values.image_url === "") {
      finalImageUrl = null; // Ensure empty string becomes null for DB
    }

    await onSave({ ...values, image_url: finalImageUrl });
    setSelectedImageFile(null); // Clear file input after save
    setImagePreviewUrl(finalImageUrl); // Update preview with final URL
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input element
    }
    console.log("BlogPostForm: Form submission logic completed.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="title">Título *</Label>
              <FormControl>
                <Input
                  id="title"
                  placeholder="Título do seu post"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!initialData) { // Only auto-generate slug for new posts
                      form.setValue("slug", generateSlug(e.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="slug">Slug (URL amigável) *</Label>
              <FormControl>
                <Input
                  id="slug"
                  placeholder="titulo-do-seu-post"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category" // Novo campo de categoria
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="category">Categoria</Label>
              <FormControl>
                <Input
                  id="category"
                  placeholder="Ex: Saúde Mental, Relacionamentos"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="excerpt">Resumo (para listagem)</Label>
              <FormControl>
                <Textarea
                  id="excerpt"
                  placeholder="Um breve resumo do conteúdo do post..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="content">Conteúdo *</Label>
              <FormControl>
                <Textarea
                  id="content"
                  placeholder="Escreva o conteúdo do seu post aqui..."
                  rows={10}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <Label htmlFor="image_upload">Imagem do Post (Upload ou URL)</Label>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              id="image_upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden" // Esconde o input de arquivo nativo
              ref={fileInputRef}
              disabled={isUploadingImage || isSaving}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()} // Clica no input escondido
              disabled={isUploadingImage || isSaving}
              className="w-full sm:w-auto flex-shrink-0"
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              {isUploadingImage ? "Carregando..." : "Escolher Arquivo"}
            </Button>
            <span className="text-muted-foreground hidden sm:block">ou</span>
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormControl>
                  <Input
                    placeholder="Cole a URL da imagem aqui"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setImagePreviewUrl(e.target.value || null); // Update preview if manual URL is entered
                      setSelectedImageFile(null); // Clear file input if manual URL is entered
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""; // Reset the file input element
                      }
                    }}
                    disabled={isUploadingImage || isSaving}
                    className="flex-1"
                  />
                </FormControl>
              )}
            />
          </div>
          {form.formState.errors.image_url && (
            <FormMessage>{form.formState.errors.image_url.message}</FormMessage>
          )}
          {imagePreviewUrl && (
            <div className="mt-4 relative w-full h-48 bg-muted rounded-md overflow-hidden flex items-center justify-center">
              <img src={imagePreviewUrl} alt="Pré-visualização da imagem" className="object-contain h-full w-full" />
              <Button
                type="button" // Changed to type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/50 hover:bg-background/70"
                onClick={() => {
                  setImagePreviewUrl(null);
                  setSelectedImageFile(null);
                  form.setValue("image_url", "");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""; // Reset the file input element
                  }
                  console.log("BlogPostForm: Image preview cleared.");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </FormItem>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || isUploadingImage}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving || isUploadingImage}>
            {(isSaving || isUploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploadingImage ? "Carregando Imagem..." : (initialData ? "Salvar Alterações" : "Criar Post")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export function DoctorBlogPostsTab({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  console.log("DoctorBlogPostsTab: Rendered. isFormDialogOpen:", isFormDialogOpen, "editingPost:", editingPost?.id);

  const {
    data: blogPosts,
    isLoading,
    isError,
    error,
  } = useQuery<BlogPost[], Error>({
    queryKey: ["doctorBlogPosts", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', currentUserId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId,
  });

  const handleCreatePost = async (formData: BlogPostFormValues) => {
    setIsSaving(true);
    console.log("DoctorBlogPostsTab: handleCreatePost called.");
    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          ...formData,
          author_id: currentUserId,
        });
      if (error) throw error;
      toast.success("Post criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["doctorBlogPosts", currentUserId] });
      setIsFormDialogOpen(false);
      console.log("DoctorBlogPostsTab: Post created, dialog closed.");
    } catch (error: any) {
      console.error("DoctorBlogPostsTab: Erro ao criar post:", error);
      toast.error("Erro ao criar post: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePost = async (formData: BlogPostFormValues) => {
    if (!editingPost) return;
    setIsSaving(true);
    console.log("DoctorBlogPostsTab: handleUpdatePost called for post ID:", editingPost.id);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPost.id);
      if (error) throw error;
      toast.success("Post atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["doctorBlogPosts", currentUserId] });
      setIsFormDialogOpen(false);
      setEditingPost(null);
      console.log("DoctorBlogPostsTab: Post updated, dialog closed.");
    } catch (error: any) {
      console.error("DoctorBlogPostsTab: Erro ao atualizar post:", error);
      toast.error("Erro ao atualizar post: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    console.log("DoctorBlogPostsTab: handleDeletePost called for post ID:", postId);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
      toast.success("Post excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["doctorBlogPosts", currentUserId] });
      console.log("DoctorBlogPostsTab: Post deleted.");
    } catch (error: any) {
      console.error("DoctorBlogPostsTab: Erro ao excluir post:", error);
      toast.error("Erro ao excluir post: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar posts do blog: {error?.message}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Gerenciar Posts do Blog
        </CardTitle>
        <Button onClick={() => { 
          setEditingPost(null); 
          setIsFormDialogOpen(true); 
          console.log("DoctorBlogPostsTab: 'Novo Post' button clicked. Opening dialog.");
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Post
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {blogPosts && blogPosts.length > 0 ? (
          <div className="space-y-3">
            {blogPosts.map((post) => (
              <div key={post.id} className="border rounded-lg p-3 bg-background">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-lg">{post.title}</p>
                    {post.category && <p className="text-sm text-muted-foreground">Categoria: {post.category}</p>} {/* Exibe a categoria */}
                    <p className="text-sm text-muted-foreground">
                      Status: {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {format(new Date(post.created_at!), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { 
                        setEditingPost(post); 
                        setIsFormDialogOpen(true); 
                        console.log("DoctorBlogPostsTab: 'Editar Post' button clicked for ID:", post.id, ". Opening dialog.");
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar Post</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Excluir Post</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhum post de blog encontrado. Crie seu primeiro post!
          </p>
        )}
      </CardContent>

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        setIsFormDialogOpen(open);
        if (!open) {
          setEditingPost(null); // Clear editingPost when dialog closes
          console.log("DoctorBlogPostsTab: Dialog closed. Clearing editingPost.");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Editar Post do Blog" : "Criar Novo Post do Blog"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Edite os detalhes do seu post." : "Preencha os detalhes para criar um novo post."}
            </DialogDescription>
          </DialogHeader>
          <BlogPostForm
            initialData={editingPost || undefined}
            onSave={editingPost ? handleUpdatePost : handleCreatePost}
            onCancel={() => { 
              setIsFormDialogOpen(false); 
              setEditingPost(null); 
              console.log("DoctorBlogPostsTab: BlogPostForm 'Cancelar' clicked. Closing dialog.");
            }}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}