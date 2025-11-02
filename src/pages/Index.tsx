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
import Navbar from "@/components/Navbar"; // Import Navbar

export default function Index() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // Usar setTimeout para garantir que a rolagem ocorra após a renderização do React
        // e para dar tempo ao navegador de aplicar o scroll-margin-top.
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Pequeno atraso de 100ms
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar /> {/* Adicionado o Navbar aqui */}
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