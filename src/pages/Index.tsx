import AnnouncementBanner from "@/components/AnnouncementBanner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import StorySection from "@/components/StorySection"; // Reutilizando
import CredentialsSection from "@/components/CredentialsSection"; // Reutilizando
import TestimonialsSection from "@/components/TestimonialsSection"; // Reutilizando
import ServicesSection from "@/components/ServicesSection"; // Novo
import BlogSection from "@/components/BlogSection"; // Novo
import FaqSection from "@/components/FaqSection"; // Novo
import ContactSection from "@/components/ContactSection"; // Novo
import { useEffect } from "react"; // Import useEffect

const Index = () => {
  useEffect(() => {
    console.log("[Index]: Main page rendered.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner />
      <Navbar />
      <main>
        <HeroSection />
        <StorySection />
        <ServicesSection />
        <TestimonialsSection />
        <BlogSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;