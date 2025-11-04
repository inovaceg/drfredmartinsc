-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'draft' NOT NULL, -- 'draft', 'published'
    image_url TEXT, -- Optional image for the post
    excerpt TEXT -- Short summary for listing
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Doctors can create their own posts
CREATE POLICY "Doctors can create their own blog posts" ON public.blog_posts
FOR INSERT WITH CHECK (auth.uid() = author_id AND (SELECT is_doctor FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- Doctors can view their own posts (draft or published)
CREATE POLICY "Doctors can view their own blog posts" ON public.blog_posts
FOR SELECT USING (auth.uid() = author_id AND (SELECT is_doctor FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- All authenticated users can view published blog posts
CREATE POLICY "All authenticated users can view published blog posts" ON public.blog_posts
FOR SELECT USING (status = 'published');

-- Doctors can update their own posts
CREATE POLICY "Doctors can update their own blog posts" ON public.blog_posts
FOR UPDATE USING (auth.uid() = author_id AND (SELECT is_doctor FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- Doctors can delete their own posts
CREATE POLICY "Doctors can delete their own blog posts" ON public.blog_posts
FOR DELETE USING (auth.uid() = author_id AND (SELECT is_doctor FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- Add trigger to update updated_at column
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();