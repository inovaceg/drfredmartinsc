import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação adicional para depuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase client: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing!");
  // Você pode adicionar um toast aqui se quiser que o usuário veja o erro na UI
  // toast.error("Erro de configuração: Chaves do Supabase ausentes.");
}

// Adicionando logs explícitos para depuração
console.log("Dyad Debug: supabaseUrl sendo usado:", supabaseUrl);


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
  global: {
    headers: { "x-my-custom-header": "my-app-name" },
  },
});