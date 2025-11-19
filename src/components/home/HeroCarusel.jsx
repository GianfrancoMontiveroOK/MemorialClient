import React from "react";
import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import carrusel1 from "../../images/salas1.webp?url";
import carrusel2 from "../../images/carrusel2.webp?url";
import carrusel3 from "../../images/carrusel3.webp?url";
import carrusel4 from "../../images/carrusel4.webp?url";

const SLIDES = [carrusel1, carrusel2, carrusel3, carrusel4];
const MotionBox = motion(Box);

export default function HeroCarousel({
  autoIntervalMs = 6000,
  onContactClick,
  onServicesClick,
}) {
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(() => SLIDES.map(() => false));

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // 👈 true en md+

  // Preload todas
  React.useEffect(() => {
    SLIDES.forEach((src, i) => {
      const img = new Image();
      img.onload = () =>
        setLoaded((prev) =>
          prev[i] ? prev : prev.map((v, k) => (k === i ? true : v))
        );
      img.src = src;
    });
  }, []);

  // Autoplay
  React.useEffect(() => {
    const tick = () => {
      const next = (index + 1) % SLIDES.length;
      if (loaded[next]) setIndex(next);
    };
    const id = setInterval(tick, autoIntervalMs);
    return () => clearInterval(id);
  }, [index, loaded, autoIntervalMs]);

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        width: "100%",
        minHeight: { xs: "55vh", md: "90vh", xl: "92vh" },
        overflow: "hidden",
        backgroundColor: "#000",
      }}
      aria-label="Hero con carrusel de imágenes"
    >
      {SLIDES.map((src, i) => {
        const isActive = i === index;
        return (
          <MotionBox
            key={i}
            aria-hidden={!isActive}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 1.02,
            }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              willChange: "opacity, transform",
            }}
          />
        );
      })}

      {/* Overlay oscuro */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Contenido */}
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          bottom: { xs: 24, md: 40 },
          left: { xs: 16, md: 48 },
          right: { xs: 16, md: "auto" },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
          flexWrap="wrap"
        >
          <motion.div>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 32, sm: 38, md: 60 },
                lineHeight: 1.1,
                px: { xs: 1, md: 8 },
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                maxWidth: { xs: "100%", md: 720 },
              }}
            >
              El más bello homenaje
              <br />
              para los que amamos
            </Typography>
          </motion.div>

          {/* Botones al costado derecho del texto */}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button
              size="large"
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/contacto"
              onClick={onContactClick}
              sx={{
                px: 3,
                fontWeight: 700,
                backdropFilter: "blur(2px)",
                backgroundColor: "#e2c044",
                color: "#231C1C",
              }}
            >
              Contactanos ahora
            </Button>

            {isMdUp && (
              <Button
                size="large"
                variant="outlined"
                color="inherit"
                component={RouterLink}
                to="/servicios"
                onClick={onServicesClick}
                sx={{
                  px: 3,
                  fontWeight: 700,
                  color: "#F7F7F7",
                  "&:hover": { backgroundColor: "#F7F7F7", color: "#3f4447" },
                }}
              >
                Nuestros servicios
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
