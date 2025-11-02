import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Linha original comentada

// TEMPORÁRIO: Chave de API hardcoded para depuração. REMOVA ISSO DEPOIS!
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c3FwamVzY2FtcHdveWazY2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNDc1ODYsImV4cCI6MjA3NTcyMzU4Nn0.dsEq9Gvr9i3H_WVQYa46WvZIsQgL5KjqM7WibRr63UA";


// Verificação adicional para depuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase client: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing!");
}

// Adicionando logs explícitos para depuração
console.log("Dyad Debug: supabaseUrl sendo usado:", supabaseUrl);
console.log("Dyad Debug: supabaseAnonKey sendo usado (HARDCODED TEMPORÁRIO):", supabaseAnonKey);


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
  global: {
    headers: { "x-my-custom-header": "my-app-name" },
  },
});