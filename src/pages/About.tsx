import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StorySection from "@/components/StorySection";
import CredentialsSection from "@/components/CredentialsSection";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <StorySection />
        <CredentialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default About;