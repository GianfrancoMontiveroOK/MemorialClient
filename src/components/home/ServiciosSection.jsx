import * as React from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

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
      title: "TRASLADOS",
      description:
        "Nuestros propios coches, discretos y puntales, coordinados las 24 hs.",
      image: coches,
    },
    {
      title: "CREMACIONES",
      description: "Acompañamiento integral y gestión completa.",
      image: urna,
    },
    {
      title: "PREPAGO",
      description: "Coberturas de sepelio prepagas.",
      image: seguro,
    },
  ];

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const WHATSAPP = "5492610000000"; // reemplazar
  const wsp = (servicio) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      `Hola, me gustaría consultar sobre ${servicio.toLowerCase()}.`
    )}`;

return (
  <Box
    component="section"
    aria-labelledby="aboutus-title"
    sx={(t) => {
      const primary = t.palette.primary.main;
      const warn = t.palette.warning.main;
      const isDark = t.palette.mode === "dark";

      return {
        minHeight: "85svh",
        display: "grid",
        placeItems: "center",
        px: { xs: 2, md: 4 },
        py: { xs: 4, md: 4 },

        // color de texto correcto por modo
        color: isDark ? t.palette.common.white : t.palette.text.primary,

        // 🎨 fondos separados x modo (tu dark intacto)
        background: isDark
          ? `
            radial-gradient(90rem 40rem at 15% 110%, ${alpha(warn, 0.10)} 0%, transparent 80%),
            radial-gradient(70rem 30rem at 110% 110%, ${alpha(warn, 0.08)} 0%, transparent 80%),
            linear-gradient(to top, ${alpha(warn, 0.08)} 0%, ${alpha(primary, 0)} 35%),
            ${primary}
          `
          : `
            /* halos suaves amarillos, apoyados sobre el bg del theme */
            radial-gradient(70rem 28rem at 18% 105%, ${alpha(warn, 0.12)} 0%, transparent 70%),
            radial-gradient(60rem 26rem at 105% 110%, ${alpha(warn, 0.10)} 0%, transparent 75%),
            /* velo sutil desde abajo para separar cards del fondo */
            linear-gradient(to top, ${alpha(warn, 0.06)} 0%, ${alpha(primary, 0)} 40%),
            ${t.palette.background.default}
          `,

        /* opcional: mejora contraste de las cards internas sin tocar componentes */
        "& .serviceCard": {
          background: isDark
            ? alpha(t.palette.common.white, 0.05)
            : t.palette.background.paper,
          borderColor: isDark
            ? alpha("#000", 0.6)
            : alpha("#000", 0.12),
        },
        "& .serviceCard h3, & .serviceCard .MuiTypography-root": {
          color: isDark ? t.palette.common.white : t.palette.text.primary,
        },
      };
    }}
  >
      <Container
        disableGutters
        maxWidth={false}
        sx={{ width: maxWidth, mx: "auto" }}
      >
        {/* Título */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography
            component="h2"
            variant="h2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
              color: theme.palette.text.primary,
              letterSpacing: 0.2,
            }}
          >
            NUESTROS SERVICIOS
          </Typography>

          <Divider
            sx={{
              mt: 1.2,
              width: 72,
              height: 4,
              borderRadius: 3,
              border: "none",
              backgroundColor:
                theme.palette.roles?.accent || theme.palette.primary.main,
            }}
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

function ServiceCard({ title, description, image, href = "/contacto" }) {
  return (
    <Card
      elevation={0}
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        const primary = theme.palette.primary.main;
        const accent = theme.palette.roles?.accent || primary;
        return {
          position: "relative", // ⬅️ necesario para posicionar el botón
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

        {/* Imagen cuadrada */}
        <Box
          sx={(theme) => ({
            mt: "auto",
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${
              theme.palette.roles?.accent || alpha(theme.palette.accent, 0.12)
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

      {/* Botón flotante — esquina inferior derecha */}
      <Box
        component="a"
        href={href}
        aria-label={`Consultar ${title}`}
        sx={(t) => ({
          position: "absolute",
          right: 14,
          bottom: 14,
          textDecoration: "none",
          borderRadius: 10,
          backgroundColor: t.palette.warning.main,
          color: t.palette.primary.text || "#231C1C",
          px: 2,
          py: 1,
          fontWeight: 800,
          fontSize: "0.9rem",
          lineHeight: 1,
          boxShadow: `0 6px 18px ${alpha(t.palette.warning.main, 0.28)}`,
          border: `1px solid ${alpha(t.palette.common.black, 0.15)}`,
          transition: "transform .15s ease, box-shadow .15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: `0 10px 24px ${alpha(t.palette.warning.main, 0.34)}`,
          },
          "&:focus-visible": {
            outline: `3px solid ${alpha(t.palette.warning.main, 0.45)}`,
            outlineOffset: 2,
          },
        })}
      >
        Solicitar
      </Box>
    </Card>
  );
}
