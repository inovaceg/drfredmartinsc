-- Verifica se a coluna 'name' existe e a adiciona se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscriptions' AND column_name='name') THEN
        ALTER TABLE newsletter_subscriptions ADD COLUMN name VARCHAR(255);
    END IF;
END$$;

-- Verifica se a coluna 'whatsapp' existe e a adiciona se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscriptions' AND column_name='whatsapp') THEN
        ALTER TABLE newsletter_subscriptions ADD COLUMN whatsapp VARCHAR(20);
    END IF;
END$$;