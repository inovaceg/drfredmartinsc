import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { SupabaseRealtimeProvider } from './providers/SupabaseRealtimeProvider.tsx'; // Importar o provedor

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <SupabaseRealtimeProvider> {/* Envolver o App com o provedor */}
            <App />
        </SupabaseRealtimeProvider>
    </ErrorBoundary>
);