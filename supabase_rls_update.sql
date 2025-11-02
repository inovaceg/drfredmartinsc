-- Remove qualquer política RLS existente para newsletter_subscriptions para garantir uma configuração limpa
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to read newsletter subscriptions" ON public.newsletter_subscriptions;

-- Cria uma nova política RLS para permitir que usuários autenticados leiam todas as colunas de newsletter_subscriptions
CREATE POLICY "Allow authenticated users to read all newsletter subscriptions"
ON public.newsletter_subscriptions FOR SELECT
TO authenticated
USING (true);