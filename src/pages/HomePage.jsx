import React from "react";
import HeroCarusel from "../components/home/HeroCarusel";
import ServiciosSection from "../components/home/ServiciosSection";
import AboutUs from "../components/home/AboutUs";

function HomePage() {
  return (
    <div>
      <HeroCarusel />    
      <ServiciosSection/>
      <AboutUs/>
      </div>
  );
}

export default HomePage;
