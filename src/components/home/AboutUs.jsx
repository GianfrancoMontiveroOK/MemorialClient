import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Divider,
  Grid,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function AboutUsSection() {
  return (
    <Box
      component="section"
      aria-labelledby="aboutus-title"
      sx={(theme) => {
        const primary = theme.palette.primary.main;
        const warn = theme.palette.warning.main;

        return {
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          color: theme.palette.common.white,
          background: `
            radial-gradient(90rem 40rem at 15% -10%, ${alpha(
              warn,
              0.1
            )}, transparent 80%),
            radial-gradient(70rem 30rem at 110% 10%, ${alpha(
              warn,
              0.08
            )}, transparent 80%),
            linear-gradient(180deg, ${alpha(warn, 0.08)} 0%, ${alpha(
            primary,
            0
          )} 35%),
            ${primary}
          `,
          px: { xs: 2, md: 4 },
          py: { xs: 8, md: 8 },
        };
      }}
    >
      {/* 💡 centrado en todos los breakpoints */}
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Typography
          variant="overline"
          sx={(t) => ({
            display: "block",
            mb: 1,
            letterSpacing: 1.2,
            color: alpha(t.palette.common.white, 0.85),
            fontWeight: 700,
          })}
        >
          Quiénes somos
        </Typography>

        <Typography
          id="aboutus-title"
          variant="h1"
          component="h1"
          sx={(theme) => ({
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 700,
            lineHeight: 1.1,
            color: theme.palette.common.white,
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
            backgroundColor: theme.palette.warning.main,
            mx: "auto", // ⬅️ centrado siempre
          })}
        />

        <Typography
          variant="body1"
          sx={(theme) => ({
            color: alpha(theme.palette.common.white, 0.88),
            lineHeight: 1.9,
            fontSize: "1.06rem",
            maxWidth: 720,
            mx: "auto", // ⬅️ centrado
            mb: { xs: 3.5, md: 4.5 },
          })}
        >
          Desde hace años brindamos un servicio humano y profesional, cuidando
          cada detalle para acompañar a las familias con respeto, claridad y
          calidez. Nuestra vocación es estar presentes cuando más se nos
          necesita.
        </Typography>

        {/* Valores centrados + Métricas centradas */}
        <Grid
          container
          spacing={3}
          sx={{
            mb: { xs: 4, md: 6 },
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          {/* Valores */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2} sx={{ textAlign: "center" }}>
              <Typography
                variant="h2"
                sx={(t) => ({
                  fontFamily: t.typography.h1.fontFamily,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                })}
              >
                Valores que nos diferencian:
              </Typography>

              {/* Lista en 1/2 columnas con “línea” amarilla como viñeta */}
              <Box
                component="ul"
                sx={(t) => ({
                  mt: 1,
                  mx: "auto",
                  maxWidth: 720,
                  p: 0,
                  display: "grid",
                  gap: { xs: 1.25, md: 2 },
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  textAlign: "left",
                  listStyle: "none",
                  color: alpha(t.palette.common.white, 0.9),
                })}
              >
                {[
                  "Respeto y confidencialidad.",
                  "Claridad total.",
                  "Acompañamiento cálido.",
                  "Compromiso con la excelencia.",
                ].map((v) => (
                  <Box
                    key={v}
                    component="li"
                    sx={(t) => ({
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      lineHeight: 1.7,
                      "&::before": {
                        content: '""',
                        display: "inline-block",
                        width: 14, // largo de la “línea”
                        height: 2, // espesor
                        mt: "0.7em", // alinea con el texto
                        borderRadius: 2,
                        backgroundColor: t.palette.warning.main, // amarillo memorial
                        flex: "0 0 14px",
                      },
                    })}
                  >
                    <Typography variant="body1">{v}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Grid>

          {/* Caja de métricas con dividers, centrada */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Box
              aria-label="Indicadores de trayectoria"
              sx={(t) => ({
                p: { xs: 2.5, md: 3 },
                borderRadius: 2,
                background: alpha(t.palette.common.black, 0.25),
                border: `1px solid ${alpha(t.palette.warning.main, 0.25)}`,
                width: "100%",
                maxWidth: 720,
                textAlign: "center",
              })}
            >
              {/* XS: columnas apiladas con divider horizontal */}
              <Stack
                direction="column"
                spacing={1.25}
                divider={
                  <Divider
                    flexItem
                    sx={{ borderColor: "rgba(255,255,255,0.15)" }}
                  />
                }
                sx={{ display: { xs: "flex", md: "none" } }}
              >
                {[
                  { n: "Más de 20", label: "años de trayectoria" },
                  { n: "24/7", label: "Atención permanente" },
                  { n: "Más de 6.000", label: "familias asistidas" },
                ].map((s) => (
                  <Box key={s.label} sx={{ px: 0.5 }}>
                    <Typography
                      variant="h4"
                      component="p"
                      sx={(t) => ({
                        fontWeight: 800,
                        lineHeight: 1.15,
                        color: t.palette.warning.main,
                        mb: 0.5,
                      })}
                    >
                      {s.n}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={(t) => ({
                        color: alpha(t.palette.common.white, 0.85),
                        lineHeight: 1.4,
                        whiteSpace: "normal",
                      })}
                    >
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* MD+: en fila con divider vertical */}
              <Stack
                direction="row"
                spacing={0}
                divider={
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ borderColor: "rgba(255,255,255,0.15)" }}
                  />
                }
                justifyContent="center"
                alignItems="stretch"
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                {[
                  { n: "Más de 20", label: "años de trayectoria" },
                  { n: "24/7", label: "Atención permanente" },
                  { n: "Más de 6.000", label: "familias asistidas" },
                ].map((s) => (
                  <Box key={s.label} sx={{ px: 2 }}>
                    <Typography
                      variant="h3"
                      component="p"
                      sx={(t) => ({
                        fontWeight: 800,
                        lineHeight: 1,
                        color: t.palette.warning.main,
                        mb: 0.75,
                      })}
                    >
                      {s.n}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={(t) => ({
                        color: alpha(t.palette.common.white, 0.8),
                      })}
                    >
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* CTAs iguales en ancho/alto */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="stretch"
          sx={{
            mt: { xs: 3, md: 3 },
            width: "100%",
            maxWidth: 500,
            mx: "auto",
          }}
        >
          <Button
            variant="brandYellow"
            href="/sucursales"
            fullWidth
            sx={{
              flex: 1,
              minHeight: 46,
              px: 3,
              py: 1,
              borderRadius: 1,
              fontWeight: 700,
            }}
          >
            Hablar a sucursal
          </Button>

          <Button
            variant="outlined"
            href="tel:+5492610000000"
            fullWidth
            sx={(t) => ({
              flex: 1,
              minHeight: 46,
              px: 3,
              py: 1,
              borderRadius: 1,
              fontWeight: 700,
              color: t.palette.common.white,
              borderColor: alpha(t.palette.common.white, 0.6),
              "&:hover": {
                borderColor: t.palette.common.white,
                bgcolor: "transparent",
              },
            })}
          >
            Llamar ahora
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
