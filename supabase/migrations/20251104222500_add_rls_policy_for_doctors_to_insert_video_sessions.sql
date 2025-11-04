-- Habilitar RLS na tabela video_sessions se ainda não estiver habilitado
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que possam conflitar com a nova política de INSERT para doutores
DROP POLICY IF EXISTS "Doctors can insert their own video sessions" ON public.video_sessions;

-- Criar política para permitir que doutores insiram novas sessões de vídeo
CREATE POLICY "Doctors can insert their own video sessions"
ON public.video_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  (doctor_id = auth.uid()) AND -- O doutor que está inserindo deve ser o doutor da sessão
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_doctor = TRUE)) -- E o usuário deve ter o perfil de doutor
);

-- Opcional: Adicionar uma política de SELECT para que doutores possam ver todas as sessões que eles criaram ou que são para seus pacientes
DROP POLICY IF EXISTS "Doctors can view their own and their patients' video sessions" ON public.video_sessions;
CREATE POLICY "Doctors can view their own and their patients' video sessions"
ON public.video_sessions
FOR SELECT
TO authenticated
USING (
  (doctor_id = auth.uid()) OR -- Pode ver sessões onde ele é o doutor
  (patient_id = auth.uid()) OR -- Pode ver sessões onde ele é o paciente
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_doctor = TRUE)) -- Doutores podem ver todas as sessões (ajuste se quiser restringir mais)
);

-- Opcional: Adicionar uma política de UPDATE para que doutores possam atualizar suas sessões
DROP POLICY IF EXISTS "Doctors can update their own video sessions" ON public.video_sessions;
CREATE POLICY "Doctors can update their own video sessions"
ON public.video_sessions
FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

-- Opcional: Adicionar uma política de DELETE para que doutores possam deletar suas sessões
DROP POLICY IF EXISTS "Doctors can delete their own video sessions" ON public.video_sessions;
CREATE POLICY "Doctors can delete their own video sessions"
ON public.video_sessions
FOR DELETE
TO authenticated
USING (doctor_id = auth.uid());