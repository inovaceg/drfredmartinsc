-- Add name column to newsletter_subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='newsletter_subscriptions' AND column_name='name') THEN
        ALTER TABLE public.newsletter_subscriptions ADD COLUMN name text;
    END IF;
END
$$;

-- Add whatsapp column to newsletter_subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='newsletter_subscriptions' AND column_name='whatsapp') THEN
        ALTER TABLE public.newsletter_subscriptions ADD COLUMN whatsapp text;
    END IF;
END
$$;