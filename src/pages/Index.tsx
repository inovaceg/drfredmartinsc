"use client";

import HeroSection from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import StorySection from "@/components/StorySection";
import FaqSection from "@/components/FaqSection";
import { ContactSection } from "@/components/ContactSection";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ServicesSection from "@/components/ServicesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BlogSection from "@/components/BlogSection";
// import AnnouncementBanner from "@/components/AnnouncementBanner"; // Removido daqui
import Navbar from "@/components/Navbar";

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
      <Navbar />
      {/* <AnnouncementBanner /> Removido daqui */}
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