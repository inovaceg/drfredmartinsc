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

// New component to handle scrolling to hash links
const ScrollToHashElement = () => {
  const location = useLocation();
  const navbarHeight = 80; // Ensure this matches the Navbar's height

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1); // Remove '#'
      const element = document.getElementById(id);
      if (element) {
        // Use a small delay to ensure the element is rendered and its position is stable
        setTimeout(() => {
          const targetPosition = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          console.log(`App.tsx: Scrolled to #${id} at position ${targetPosition}`);
        }, 50); // Small delay
      } else {
        console.warn(`App.tsx: Element with ID ${id} not found for scrolling.`);
      }
    }
  }, [location, navbarHeight]); // Depend on location and navbarHeight

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToHashElement /> {/* Add the new component here */}
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Rotas removidas para About, Services, Testimonials, Blog, Faq, Contact */}
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