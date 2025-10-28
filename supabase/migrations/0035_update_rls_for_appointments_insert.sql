-- Primeiro, removemos a política existente para evitar conflitos.
-- O nome da política pode variar, então usamos um nome genérico ou o que foi definido anteriormente.
DROP POLICY IF EXISTS "allow_authenticated_patient_to_insert_their_own_appointments" ON "public"."appointments";
DROP POLICY IF EXISTS "allow_authenticated_users_to_insert_appointments" ON "public"."appointments";

-- Em seguida, criamos uma nova política que permite a inserção se o usuário autenticado
-- for o paciente OU o médico do agendamento.
CREATE POLICY "allow_patient_or_doctor_to_insert_appointments"
ON "public"."appointments"
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = patient_id) OR (auth.uid() = doctor_id)
);