import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Importar SessionContextProvider
import { supabase } from './integrations/supabase/client.ts'; // Importar o cliente Supabase

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <SessionContextProvider supabaseClient={supabase}> {/* Envolver o App com o provedor Supabase */}
            <App />
        </SessionContextProvider>
    </ErrorBoundary>
);