-- Adiciona política RLS para permitir que doutores insiram novas sessões de vídeo
-- Apenas o doutor autenticado pode criar uma sessão onde ele mesmo é o 'doctor_id'.
create policy "Doctors can insert their own video sessions"
on public.video_sessions for insert
with check (auth.uid() = doctor_id);