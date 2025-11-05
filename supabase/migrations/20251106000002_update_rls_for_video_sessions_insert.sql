-- 1. Remove a política RLS existente que permite apenas pacientes inserirem sessões de vídeo.
DROP POLICY IF EXISTS "Allow patients to create video sessions" ON public.video_sessions;

-- 2. Cria uma nova política RLS que permite que usuários autenticados (sejam pacientes ou doutores)
-- insiram sessões de vídeo, desde que o auth.uid() corresponda ao patient_id ou ao doctor_id da nova linha.
CREATE POLICY "Allow authenticated users to create their own video sessions"
ON public.video_sessions FOR INSERT
WITH CHECK (
    (auth.uid() = patient_id) OR (auth.uid() = doctor_id)
);