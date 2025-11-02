-- Remove any existing RLS policies for newsletter_subscriptions to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to read newsletter subscriptions" ON public.newsletter_subscriptions;

-- Create a new RLS policy to allow authenticated users to read all columns from newsletter_subscriptions
CREATE POLICY "Allow authenticated users to read all newsletter subscriptions"
ON public.newsletter_subscriptions FOR SELECT
TO authenticated
USING (true);