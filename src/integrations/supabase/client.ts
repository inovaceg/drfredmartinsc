import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
  global: {
    // Removido 'timeout' pois não é uma propriedade válida aqui
    headers: { "x-my-custom-header": "my-app-name" },
  },
});