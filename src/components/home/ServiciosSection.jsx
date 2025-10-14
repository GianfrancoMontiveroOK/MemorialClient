import * as React from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// ✅ IMPORTS (dos carpetas hacia atrás)
import salas2 from "../../images/salas2.webp";
import coches from "../../images/coches.webp";
import urna from "../../images/urna.webp";
import seguro from "../../images/seguro.webp";

export default function ServiciosSection({ maxWidth = "90vw" }) {
  const items = [
    {
      title: "SEPELIOS",
      description:
        "Conocé nuestras salas exclusivas, para despedidas en tranquilidad y serenidad.",
      image: salas2,
    },
    {
      title: "COCHES",
      description:
        "Traslados con flota propia, discreta y puntal, coordinados las 24 hs.",
      image: coches,
    },
    {
      title: "CREMACIONES",
      description: "Acompañamiento integral y gestión completa.",
      image: urna,
    },
    {
      title: "SEGUROS",
      description: "Seguros de sepelio preventivo.",
      image: seguro,
    },
  ];

  return (
    <Box
      component="section"
      sx={(theme) => ({
        display: "flex",
        justifyContent: "center",
        py: { xs: 6, md: 5 },
        backgroundColor: theme.palette.background.default,
      })}
    >
      <Container
        disableGutters
        maxWidth={false}
        sx={{ width: maxWidth, mx: "auto" }}
      >
        {/* Título */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
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
            NUESTROS SERVICIOS
          </Typography>
          <Divider
            sx={(theme) => ({
              mt: 1.2,
              width: 72,
              height: 4,
              borderRadius: 3,
              border: "none",
              backgroundColor:
                theme.palette.roles?.accent || theme.palette.primary.main,
            })}
          />
        </Box>

        {/* Grid 1/2/4 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: { xs: 2, md: 1 },
            alignItems: "stretch", // ⬅️ que todas las columnas tengan la misma altura
          }}
        >
          {items.map((it) => (
            <ServiceCard
              key={it.title}
              title={it.title}
              description={it.description}
              image={it.image}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function ServiceCard({ title, description, image }) {
  return (
    <Card
      elevation={0}
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        const primary = theme.palette.primary.main;
        const accent = theme.palette.roles?.accent || primary;

        return {
          height: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          backgroundColor: isDark ? theme.palette.common.white : primary,
          border: `1px solid ${
            isDark
              ? alpha(theme.palette.common.black, 0.08)
              : alpha(theme.palette.common.black, 0.15)
          }`,
          transition:
            "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
          "&:hover": isDark
            ? {
                transform: "translateY(-2px)",
                boxShadow: `0 0 0 3px ${alpha(
                  accent,
                  0.55
                )}, 0 10px 24px ${alpha(accent, 0.22)}`,
                borderColor: alpha(accent, 0.6),
              }
            : {
                transform: "translateY(-2px)",
                boxShadow: `0 10px 28px ${alpha("#000", 0.32)}`,
                borderColor: alpha(accent, 0.55),
              },
          "&:focus-within": {
            outline: `3px solid ${alpha(accent, 0.28)}`,
            outlineOffset: 2,
          },
        };
      }}
      aria-label={title}
      tabIndex={0}
    >
      <CardContent
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          height: "100%",
        }}
      >
        <Typography
          variant="h4"
          component="h3"
          sx={(theme) => ({
            fontFamily: theme.typography.h2.fontFamily,
            fontWeight: 700,
            lineHeight: 1.15,
            color:
              theme.palette.mode === "dark"
                ? theme.palette.primary.main
                : theme.palette.common.white,
          })}
        >
          {title}
        </Typography>

        <Divider
          sx={(theme) => ({
            width: 66,
            height: 3,
            borderRadius: 2,
            border: "none",
            backgroundColor:
              theme.palette.roles?.accent || theme.palette.primary.main,
            transition: "width .18s ease",
            ".MuiCard-root:hover &": { width: 86 },
          })}
        />

        <Typography
          variant="body1"
          sx={(theme) => ({
            color:
              theme.palette.mode === "dark"
                ? theme.palette.primary.main
                : alpha(theme.palette.common.white, 0.9),
            lineHeight: 1.8,
          })}
        >
          {description}
        </Typography>

        {/* Imagen cuadrada debajo del texto */}
        <Box
          sx={(theme) => ({
            mt: "auto", // ⬅️ empuja la imagen al fondo de la card
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1", // ⬅️ cuadrada sin usar padding-top
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${
              theme.palette.roles?.accent  ||
              alpha(theme.palette.accent, 0.12)
            }`,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Box
            component="img"
            src={image}
            alt={title}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
