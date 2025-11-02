"use client";

import HeroSection from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import StorySection from "@/components/StorySection"; // Reutilizando
import FaqSection from "@/components/FaqSection"; // Corrected import
import { ContactSection } from "@/components/ContactSection"; // Novo
import { useEffect } from "react"; // Import useEffect
import { useLocation } from "react-router-dom"; // Import useLocation
import ServicesSection from "@/components/ServicesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BlogSection from "@/components/BlogSection";
import AnnouncementBanner from "@/components/AnnouncementBanner"; // Importar o AnnouncementBanner

export default function Index() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner /> {/* Adicionado o banner aqui */}
      <HeroSection />
      <StorySection />
      <ServicesSection />
      <TestimonialsSection />
      <BlogSection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </div>
  );
}