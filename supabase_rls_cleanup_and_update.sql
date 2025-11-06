-- Remove todas as políticas de INSERT existentes para a tabela video_sessions
DROP POLICY IF EXISTS "Allow patients to create video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to create their own video sessions" ON public.video_sessions;

-- Cria a política RLS que permite que usuários autenticados (sejam pacientes ou doutores)
-- insiram sessões de vídeo, desde que o auth.uid() corresponda ao patient_id ou ao doctor_id da nova linha.
CREATE POLICY "Allow authenticated users to create their own video sessions"
ON public.video_sessions FOR INSERT
WITH CHECK (
    (auth.uid() = patient_id) OR (auth.uid() = doctor_id)
);