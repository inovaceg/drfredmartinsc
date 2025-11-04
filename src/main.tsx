import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Importar SessionContextProvider
import { supabase } from './integrations/supabase/client.ts'; // Importar o cliente Supabase
import { SupabaseRealtimeProvider } from './providers/SupabaseRealtimeProvider.tsx'; // Importar SupabaseRealtimeProvider

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <SessionContextProvider supabaseClient={supabase}>
            <SupabaseRealtimeProvider> {/* Envolver o App com o provedor de Realtime */}
                <App />
            </SupabaseRealtimeProvider>
        </SessionContextProvider>
    </ErrorBoundary>
);