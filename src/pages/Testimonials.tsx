import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";

const Testimonials = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;