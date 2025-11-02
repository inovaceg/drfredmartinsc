import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Licensee from "./pages/Licensee";
import { Owners } from "./pages/Owners";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LicenseDisclosure from "./pages/LicenseDisclosure";
import Accessibility from "./pages/Accessibility";
import CookiePolicy from "./pages/CookiePolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import Redirect from "./pages/Redirect";
import { AuthPage } from "./pages/Auth";
import Patient from "./pages/Patient";
import Doctor from "./pages/Doctor";
import { WhatsappTranscriptionsPage } from "./pages/WhatsappTranscriptionsPage";
import AnnouncementBanner from "@/components/AnnouncementBanner"; // Importar o AnnouncementBanner

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnReconnect: true,
    },
  },
});

const ScrollToHashElement = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("[ScrollToHashElement]: Current location hash:", location.hash);
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      
      if (element) {
        console.log(`[ScrollToHashElement]: Element with ID '${id}' found.`, element);
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          console.log(`[ScrollToHashElement]: Scroll initiated for #${id}.`);
        }, 100);
      } else {
        console.warn(`[ScrollToHashElement]: Element with ID '${id}' NOT found for scrolling.`);
      }
    }
  }, [location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="relative">
        <AnnouncementBanner /> {/* Adicionado aqui, fora do BrowserRouter */}
        <BrowserRouter>
          <ScrollToHashElement />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/licensee" element={<Licensee />} />
            <Route path="/owners" element={<Owners />} />
            <Route path="/redirect" element={<Redirect />} />
            <Route path="/auth" element={<AuthPage />} />
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
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;