import React from "react";
import HeroCarusel from "../components/home/HeroCarusel";
import ServiciosSection from "../components/home/ServiciosSection";
import AboutUs from "../components/home/AboutUs";
import ContactUs from "../components/home/ContactUs";

function HomePage() {
  return (
    <div>
      <HeroCarusel />    
      <ServiciosSection/>
      <AboutUs/>
      <ContactUs/>
      </div>
  );
}

export default HomePage;
