-- Desativa temporariamente o RLS para facilitar a remoção e criação de políticas
ALTER TABLE public.newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

-- Remove todas as políticas RLS existentes para a tabela newsletter_subscriptions
DROP POLICY IF EXISTS "Allow anon insert for newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to read all newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to read their own newslett..." ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Doctors and Admins can view all newsletter subscript..." ON public.newsletter_subscriptions;

-- Re-cria a política para permitir inserção anônima (para o formulário do site)
CREATE POLICY "Allow anon insert for newsletter subscriptions"
ON public.newsletter_subscriptions FOR INSERT
WITH CHECK (true);

-- Re-cria a política para permitir que usuários autenticados (doutores/admins) leiam TODAS as colunas
CREATE POLICY "Allow authenticated users to read all newsletter subscriptions"
ON public.newsletter_subscriptions FOR SELECT
TO authenticated
USING (true);

-- Re-ativa o RLS na tabela
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;