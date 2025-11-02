import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react"; // Import useEffect
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Licensee from "./pages/Licensee";
import Owners from "./pages/Owners";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LicenseDisclosure from "./pages/LicenseDisclosure";
import Accessibility from "./pages/Accessibility";
import CookiePolicy from "./pages/CookiePolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import Redirect from "./pages/Redirect";
import Auth from "./pages/Auth";
import Patient from "./pages/Patient";
import Doctor from "./pages/Doctor";
import { WhatsappTranscriptionsPage } from "./pages/WhatsappTranscriptionsPage";

const queryClient = new QueryClient();

// Componente para lidar com a rolagem para links de âncora (hash)
const ScrollToHashElement = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("[ScrollToHashElement]: Current location hash:", location.hash);
    if (location.hash) {
      const id = location.hash.substring(1); // Remove '#'
      const element = document.getElementById(id);
      
      if (element) {
        console.log(`[ScrollToHashElement]: Element with ID '${id}' found.`, element);
        // Usar setTimeout para garantir que a rolagem ocorra após a renderização do React
        // e para dar tempo ao navegador de aplicar o scroll-margin-top.
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          console.log(`[ScrollToHashElement]: Scroll initiated for #${id}.`);
        }, 100); // Pequeno atraso de 100ms
      } else {
        console.warn(`[ScrollToHashElement]: Element with ID '${id}' NOT found for scrolling.`);
      }
    }
  }, [location]); // Depende apenas da localização para re-executar quando o hash muda

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToHashElement /> {/* Re-adicionado o componente de rolagem */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/licensee" element={<Licensee />} />
          <Route path="/owners" element={<Owners />} />
          <Route path="/redirect" element={<Redirect />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/patient" element={<Patient />} />
          <Route path="/whatsapp-transcriptions" element={<WhatsappTranscriptionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/license-disclosure" element={<LicenseDisclosure />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/returns-policy" element={<ReturnsPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;