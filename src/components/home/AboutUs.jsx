import * as React from "react";
import { Box, Container, Typography, Button, Divider } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function AboutUsSection() {
  return (
    <Box
      component="section"
      sx={(theme) => ({
        minHeight: "100svh",              // 100vh real también en mobile
        display: "grid",
        placeItems: "center",
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(80rem 40rem at 10% 0%, ${alpha(theme.palette.roles?.accent || theme.palette.primary.main, 0.10)} 0%, transparent 50%),
               ${theme.palette.background.default}`
            : theme.palette.background.default,
        px: { xs: 2, md: 4 },
        py: { xs: 8, md: 12 },
      })}
    >
      <Container maxWidth="md" sx={{ textAlign: { xs: "left", md: "center" } }}>
        <Typography
          variant="h1"
          component="h1"
          sx={(theme) => ({
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 700,
            lineHeight: 1.1,
            color: theme.palette.text.primary,
            letterSpacing: 0.2,
          })}
        >
          Nuestra trayectoria de acompañamiento
        </Typography>

        <Divider
          sx={(theme) => ({
            mt: 1.2,
            mb: { xs: 3, md: 4 },
            width: 160,
            height: 4,
            border: "none",
            borderRadius: 3,
            backgroundColor: theme.palette.roles?.accent || theme.palette.primary.main,
            mx: { md: "auto" },
          })}
        />

        <Typography
          variant="body1"
          sx={(theme) => ({
            color: theme.palette.text.secondary,
            lineHeight: 1.9,
            fontSize: "1.05rem",
            maxWidth: 720,
            mx: { md: "auto" },
            mb: { xs: 3.5, md: 4.5 },
          })}
        >
          Desde hace años brindamos un servicio humano y profesional, cuidando cada
          detalle para acompañar a las familias con respeto, claridad y calidez.
          Nuestra vocación es estar presentes cuando más se nos necesita.
        </Typography>

        <Button
          variant="brandYellow"   // tu variante (amarillo marca, texto negro)
          size="large"
          href="/sucursales"      // cámbialo por tel: o la ruta que prefieras
          sx={(theme) => ({
            px: 3.5,
            py: 1.5,
            borderRadius: 1,
          })}
        >
          Hablar a sucursal
        </Button>
      </Container>
    </Box>
  );
}