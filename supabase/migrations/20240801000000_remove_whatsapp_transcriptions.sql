-- Remove a tabela whatsapp_transcriptions
DROP TABLE IF EXISTS public.whatsapp_transcriptions CASCADE;

-- Remove o bucket de armazenamento whatsapp_screenshots
SELECT supabase_storage.drop_bucket('whatsapp_screenshots');