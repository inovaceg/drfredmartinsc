-- Habilitar RLS na tabela video_sessions se ainda não estiver habilitado
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que possam conflitar com as novas políticas
DROP POLICY IF EXISTS "Doctors can insert their own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors can view their own and their patients' video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors can update their own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors can delete their own video sessions" ON public.video_sessions;

-- Criar política para permitir que doutores insiram novas sessões de vídeo
-- A política agora verifica se o doctor_id E o user_id da sessão são o usuário autenticado,
-- e se o usuário autenticado é de fato um doutor.
CREATE POLICY "Doctors can insert their own video sessions"
ON public.video_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  (doctor_id = auth.uid()) AND -- O doutor da sessão deve ser o usuário autenticado
  (user_id = auth.uid()) AND   -- O usuário que inicia a sessão (initiator) também deve ser o usuário autenticado
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_doctor = TRUE)) -- E o usuário autenticado deve ter o perfil de doutor
);

-- Criar política para permitir que doutores visualizem suas próprias sessões e as sessões de seus pacientes
CREATE POLICY "Doctors can view their own and their patients' video sessions"
ON public.video_sessions
FOR SELECT
TO authenticated
USING (
  (doctor_id = auth.uid()) OR -- Pode ver sessões onde ele é o doutor
  (patient_id IN (SELECT id FROM public.profiles WHERE therapist_id = auth.uid())) -- Pode ver sessões de seus pacientes atribuídos
);

-- Criar política para permitir que doutores atualizem suas próprias sessões
CREATE POLICY "Doctors can update their own video sessions"
ON public.video_sessions
FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

-- Criar política para permitir que doutores deletem suas próprias sessões
CREATE POLICY "Doctors can delete their own video sessions"
ON public.video_sessions
FOR DELETE
TO authenticated
USING (doctor_id = auth.uid());