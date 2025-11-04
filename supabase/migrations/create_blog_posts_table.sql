CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    image_url text,
    author_id uuid NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
    CONSTRAINT blog_posts_slug_key UNIQUE (slug)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.blog_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users who own the post" ON public.blog_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for users who own the post" ON public.blog_posts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;