ALTER TABLE public.video_sessions
ADD COLUMN twilio_room_sid TEXT;

-- Opcional: Adicionar uma política RLS para que apenas o doutor ou paciente da sessão possa atualizar este campo
-- Esta política já deve estar coberta pelas políticas existentes de UPDATE para video_sessions,
-- mas se precisar de uma mais específica, pode ser adicionada aqui.
-- Por exemplo:
-- CREATE POLICY "Doctors and patients can update their own video sessions"
-- ON public.video_sessions FOR UPDATE
-- USING (auth.uid() = doctor_id OR auth.uid() = patient_id);