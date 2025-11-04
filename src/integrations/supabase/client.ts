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
console.log("Dyad Debug: supabaseAnonKey sendo usado (DO .ENV):", supabaseAnonKey ? "******** (presente)" : "NÃO PRESENTE");


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
  global: {
    headers: { "x-my-custom-header": "my-app-name" },
    // Aumenta o tempo limite para 30 segundos (30000 ms) para todas as requisições Supabase
    fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }),
  },
});