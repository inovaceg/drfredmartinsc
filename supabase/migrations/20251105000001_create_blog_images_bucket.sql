-- Cria o bucket 'blog_images' se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog_images', 'blog_images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Define as políticas de RLS para o bucket 'blog_images'
-- Permite que qualquer usuário autenticado faça upload de imagens
CREATE POLICY "Allow authenticated users to upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog_images' AND auth.uid() IS NOT NULL);

-- Permite que qualquer usuário (anônimo ou autenticado) visualize imagens do blog
CREATE POLICY "Allow public access to blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog_images');

-- Permite que o autor do post (usuário autenticado) atualize suas próprias imagens
CREATE POLICY "Allow authenticated users to update their own blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog_images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'blog_images' AND auth.uid() = owner);

-- Permite que o autor do post (usuário autenticado) delete suas próprias imagens
CREATE POLICY "Allow authenticated users to delete their own blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog_images' AND auth.uid() = owner);