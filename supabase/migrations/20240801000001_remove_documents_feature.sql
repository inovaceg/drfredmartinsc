-- Remove a tabela documents
DROP TABLE IF EXISTS public.documents CASCADE;

-- Remove o bucket de armazenamento patient_documents
SELECT supabase_storage.drop_bucket('patient_documents');