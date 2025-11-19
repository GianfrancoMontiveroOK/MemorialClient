// src/components/Footer.jsx
import React from "react";
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  IconButton,
  Button,
  Divider,
  Link as MUILink,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CallIcon from "@mui/icons-material/Call";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import LoginIcon from "@mui/icons-material/Login";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import AppLogo from "./AppLogo";

const YEAR = new Date().getFullYear();
const WHATSAPP = "5492610000000";
const wsp = (msg = "Hola, me gustaría hacer una consulta sobre Memorial.") =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
const MAPS_URL = "https://maps.google.com/?q=Memorial,+San+Rafael,+Mendoza";

export default function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { isAuthenticated } = useAuth();

  const bgPaper = theme.palette.background.paper;
  const subtle = theme.palette.roles?.subtleBg ?? (isDark ? "#1E1A1A" : "#F2F3F5");
  const outline = theme.palette.roles?.outline ?? (isDark ? "#3A3333" : "#E7E7E7");
  const accent  = theme.palette.roles?.accent  ?? theme.palette.warning.main;

  const linkSx = {
    color: "text.secondary",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    "&:hover": { color: "text.primary" },
    cursor: "pointer",
  };

  const btnBase = {
    fontFamily: `"Cormorant Garamond", serif`,
    fontWeight: 700,
    textTransform: "uppercase",
    borderRadius: 1,
    fontSize: { xs: "1.05rem", md: "1.1rem" },
    minHeight: 40,
    px: 2.25,
    py: 0.75,
    width: "auto",
    alignSelf: "flex-start",
  };

  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleGoHome() {
    if (pathname === "/") {
      if (window.location.hash) window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }
  }

  // === Scroll a secciones como la navbar ===
  const goSection = (id) => {
    const doScroll = () => {
      if (id === "inicio") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const header = document.querySelector("header .MuiToolbar-root");
      const offset = header?.offsetHeight ?? 72;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
      if (window.location.hash !== `#${id}`) {
        window.history.replaceState(null, "", `#${id}`);
      }
    };

    if (pathname !== "/") {
      navigate(`/#${id}`);
      // el scroll final lo debe hacer el effect de HomePage
    } else {
      doScroll();
    }
  };

  const goAuth = () => (isAuthenticated ? navigate("/dashboard") : navigate("/login"));

  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        pt: { xs: 4, md: 6 },
        pb: 2,
        background: isDark
          ? `
            radial-gradient(900px 380px at 10% 0%, ${alpha(accent, 0.06)}, transparent 60%),
            linear-gradient(180deg, ${bgPaper} 0%, ${alpha("#000", 0.22)} 100%)
          `
          : `
            radial-gradient(900px 380px at 10% 0%, ${alpha(accent, 0.08)}, transparent 60%),
            linear-gradient(180deg, #FFFFFF 0%, ${subtle} 100%)
          `,
        borderTop: `1px solid ${outline}`,
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 }, mx: "auto" }}>
        <Grid
          container
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 6 }}
          alignItems="flex-start"
          justifyContent="center"
          sx={{ columnGap: { md: 6 } }}
        >
          {/* Marca */}
          <Grid item xs={12} md="auto" sx={{ maxWidth: { md: 460 } }}>
            <Stack spacing={1.5} sx={{ textAlign: "left", alignItems: "flex-start" }}>
              <Box
                component={RouterLink}
                to="/"
                onClick={(e) => { e.preventDefault(); handleGoHome(); }}
                aria-label="Ir al inicio"
                sx={{
                  width: { xs: 220, sm: 260 },
                  display: "inline-block",
                  cursor: "pointer",
                  textDecoration: "none",
                  "& svg, & img": { width: "100% !important", height: "auto !important", display: "block" },
                }}
              >
                <AppLogo />
              </Box>

              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 520 }}>
                El más bello homenaje para los que amamos.
              </Typography>

              <Stack spacing={1}>
                <Button
                  startIcon={<CallIcon />}
                  href={wsp()}
                  target="_blank"
                  rel="noopener"
                  variant="soft"
                  color="contrast"
                  sx={btnBase}
                >
                  Hablar a sucursal
                </Button>

                <Button
                  onClick={goAuth}
                  variant="contained"
                  color="contrast"
                  startIcon={isAuthenticated ? <DashboardCustomizeRoundedIcon /> : <LoginIcon />}
                  sx={btnBase}
                >
                  {isAuthenticated ? "Ir a mi panel" : "Ingresar"}
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.25} sx={{ mt: 0.5, justifyContent: "flex-start" }}>
                <IconButton component="a" href="https://www.instagram.com/REEMPLAZAR_Memorial" target="_blank" rel="noopener" aria-label="Instagram" size="small">
                  <InstagramIcon fontSize="small" />
                </IconButton>
                <IconButton component="a" href="https://www.facebook.com/REEMPLAZAR_Memorial" target="_blank" rel="noopener" aria-label="Facebook" size="small">
                  <FacebookIcon fontSize="small" />
                </IconButton>
                <IconButton component="a" href={wsp("Hola, necesito asistencia con mi cuenta.")} target="_blank" rel="noopener" aria-label="WhatsApp" size="small">
                  <WhatsAppIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Divider sx={{ my: 3, display: { xs: "block", md: "none" }, borderColor: outline }} />
          </Grid>

          {/* Navegación */}
          <Grid item xs={12} md sx={{ minWidth: 0 }}>
            <Stack spacing={1.1} sx={{ textAlign: "left", alignItems: "flex-start" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                NAVEGACIÓN
              </Typography>

              {/* Estos scrollean */}
              <MUILink component="button" onClick={() => goSection("servicios")} underline="hover" variant="body2" sx={linkSx}>
                Servicios
              </MUILink>
              <MUILink component="button" onClick={() => goSection("nosotros")} underline="hover" variant="body2" sx={linkSx}>
                Acerca de nosotros
              </MUILink>
              <MUILink component="button" onClick={() => goSection("contacto")} underline="hover" variant="body2" sx={linkSx}>
                Contacto
              </MUILink>

              {/* Este sigue siendo ruta separada */}
              <MUILink component={RouterLink} to="/privacidad" underline="hover" variant="body2" sx={linkSx}>
                Políticas
              </MUILink>
            </Stack>

            <Divider sx={{ my: 3, display: { xs: "block", md: "none" }, borderColor: outline }} />
          </Grid>

          {/* Contacto */}
          <Grid item xs={12} md sx={{ minWidth: 0 }}>
            <Stack spacing={1.1} sx={{ textAlign: "left", alignItems: "flex-start" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                CONTACTO
              </Typography>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ maxWidth: 520 }}>
                <PlaceOutlinedIcon color="warning" fontSize="small" sx={{ mt: 0.2 }} />
                <MUILink href={MAPS_URL} target="_blank" rel="noopener" underline="hover" variant="body2" sx={linkSx}>
                  San Rafael, Mendoza · Memorial
                </MUILink>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ maxWidth: 520 }}>
                <EmailOutlinedIcon color="warning" fontSize="small" sx={{ mt: 0.2 }} />
                <MUILink href="mailto:info@memorialcremaciones.com.ar" underline="hover" variant="body2" sx={linkSx}>
                  info@memorialcremaciones.com.ar
                </MUILink>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ maxWidth: 520 }}>
                <WhatsAppIcon color="warning" fontSize="small" sx={{ mt: 0.2 }} />
                <MUILink href={wsp("Hola, quiero más información sobre los servicios.")} target="_blank" rel="noopener" underline="hover" variant="body2" sx={linkSx}>
                  +54 9 261 000 0000
                </MUILink>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ maxWidth: 520 }}>
                <ScheduleOutlinedIcon color="warning" fontSize="small" sx={{ mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
                  {`Lun a Vie: 08:00 a 12:30 / 16:30 a 19:30 hs
Sábados: 08:30–12:30 h`}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ maxWidth: 520 }}>
                <BedtimeOutlinedIcon color="warning" fontSize="small" sx={{ mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Guardia 24 horas.
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: outline }} />

        <Stack spacing={1.25} alignItems="center" justifyContent="center" sx={{ textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            © {YEAR} Memorial — Todos los derechos reservados.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Construido con respeto, confidencialidad y transparencia.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
