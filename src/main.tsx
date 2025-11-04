import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { FirebaseAuthProvider } from './providers/FirebaseAuthProvider.tsx'; // Importar o provedor Firebase

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <FirebaseAuthProvider> {/* Envolver o App com o provedor Firebase */}
            <App />
        </FirebaseAuthProvider>
    </ErrorBoundary>
);