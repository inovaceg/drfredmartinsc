-- Remover política DELETE existente para evitar conflitos, se houver
DROP POLICY IF EXISTS "Doctors can delete any patient" ON public.profiles;

-- Criar política para permitir que qualquer usuário com a função 'doctor' possa excluir qualquer perfil de paciente
CREATE POLICY "Doctors can delete any patient"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'doctor'
  )
);