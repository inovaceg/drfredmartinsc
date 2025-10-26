-- Remover política DELETE existente para evitar conflitos, se houver
DROP POLICY IF EXISTS "Doctors can delete their own patients" ON public.profiles;

-- Criar política para permitir que um doutor exclua um paciente se o doutor logado for o 'therapist_id' do paciente
CREATE POLICY "Doctors can delete their own patients"
ON public.profiles
FOR DELETE
USING (
  auth.uid() = therapist_id
);