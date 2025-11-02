-- Adicionando as colunas 'name' e 'whatsapp' à tabela 'newsletter_subscriptions'
ALTER TABLE public.newsletter_subscriptions
ADD COLUMN name text NULL,
ADD COLUMN whatsapp text NULL;

-- Criando ou atualizando a política RLS para 'select' para incluir as novas colunas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.newsletter_subscriptions;

CREATE POLICY "Enable read access for all users"
ON public.newsletter_subscriptions
FOR SELECT
USING (true);

-- Criando ou atualizando a política RLS para 'insert' para permitir a inserção das novas colunas
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.newsletter_subscriptions;

CREATE POLICY "Allow authenticated users to insert"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true); -- Permitir que qualquer usuário autenticado insira, incluindo as novas colunas