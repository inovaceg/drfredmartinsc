-- Create the storage bucket for blog post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog_images', 'blog_images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket (already enabled by default for new buckets, but good to be explicit)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for the blog_images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated upload to blog_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog_images');

-- Allow all users to view images (since they are public blog posts)
CREATE POLICY "Allow public read access to blog_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog_images');

-- Allow authenticated users to update their own images (if needed)
CREATE POLICY "Allow authenticated update to own blog_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog_images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'blog_images' AND auth.uid() = owner);

-- Allow authenticated users to delete their own images (if needed)
CREATE POLICY "Allow authenticated delete to own blog_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog_images' AND auth.uid() = owner);