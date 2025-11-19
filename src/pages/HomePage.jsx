// src/pages/HomePage.jsx
import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";
import HeroCarusel from "../components/home/HeroCarusel";
import ServiciosSection from "../components/home/ServiciosSection";
import AboutUs from "../components/home/AboutUs";
import ContactUs from "../components/home/ContactUs";

export default function HomePage() {
  const { hash } = useLocation();

  // Si entro con /#servicios, /#nosotros, etc., scrolleo al montar
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector("header .MuiToolbar-root");
    const offset = (header?.offsetHeight ?? 72) + 8; // 8px de aire
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }, [hash]);

  return (
    <div>
      <Box id="inicio" >
        <HeroCarusel />
      </Box>

      <Box id="servicios">
        <ServiciosSection />
      </Box>

      <Box id="nosotros">
        <AboutUs />
      </Box>

      <Box id="contacto">
        <ContactUs />
      </Box>
    </div>
  );
}

