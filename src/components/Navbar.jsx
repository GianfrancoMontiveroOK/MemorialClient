import React, { useState, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";

import MenuIcon from "@mui/icons-material/Menu";
import CallIcon from "@mui/icons-material/Call";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";

import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import AppLogo from "./AppLogo";

const NAV_LINKS = [
  { label: "Inicio", id: "inicio" },
  { label: "Servicios", id: "servicios" },
  { label: "Nosotros", id: "nosotros" },
  { label: "Contacto", id: "contacto" },
];

export default function NavbarMemorial({
  branchUrl = "https://wa.me/5492604000000?text=Hola%20Memorial,%20quisiera%20contactar%20la%20sucursal",
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg")); // "COMPU"
  const tm = useThemeMode() || {};
  const safeToggleMode = tm.toggleMode || (() => {});
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === "/";
  const showSimplified = isDesktop && !isHome;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { isAuthenticated, user, logout } = useAuth();
  const openMenu = Boolean(anchorEl);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const goSection = useCallback(
    (id) => {
      const doScroll = () => {
        if (id === "inicio") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const el = document.getElementById(id);
        if (!el) return;
        const header = document.querySelector("header .MuiToolbar-root");
        const offset = header?.offsetHeight ?? 72;
        const top =
          el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
      };

      if (pathname !== "/") {
        navigate(`/#${id}`);
        // el scroll after-navigate lo hace el useEffect de HomePage
      } else {
        // actualizo el hash para que quede compartible
        if (window.location.hash !== `#${id}`) {
          window.history.replaceState(null, "", `#${id}`);
        }
        doScroll();
      }
      setDrawerOpen(false);
    },
    [navigate, pathname]
  );

  const handleGoHome = () => {
    if (pathname === "/") {
      if (window.location.hash) window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={(t) => ({
        px: { xs: 2, md: 6 },
        backgroundColor:
          t.palette.mode === "dark"
            ? t.palette.primary.main
            : t.palette.background.paper,
        borderBottom: `1px solid ${alpha(t.palette.roles.outline, 0.6)}`,
      })}
    >
      {/* ===================== TOOLBAR ===================== */}
      {!showSimplified ? (
        // ---------- Versión COMPLETA (Home o Mobile) ----------
        <Toolbar sx={{ minHeight: { xs: 64, md: 76 }, px: { xs: 2, md: 4 } }}>
          {/* Mobile: hamburger */}
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", lg: "none" }, mr: 1 }}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo (click -> home) */}
          <Box
            component={RouterLink}
            to="/"
            onClick={(e) => {
              e.preventDefault();
              handleGoHome();
            }}
            aria-label="Ir al inicio"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <AppLogo height={38} />
          </Box>

          {/* Desktop: links */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ ml: 3, display: { xs: "none", lg: "flex" } }}
          >
            {NAV_LINKS.map((link) => (
              <Button
                key={link.id}
                variant="nav"
                onClick={() => goSection(link.id)}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop: acciones */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Button
              variant="soft"
              color="contrast"
              startIcon={<CallIcon />}
              sx={{
                fontFamily: `"Cormorant Garamond", serif`,
                fontWeight: 700,
                fontSize: "1.1rem",
                textTransform: "uppercase",
              }}
              href={branchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hablar a sucursal
            </Button>

            {!isAuthenticated ? (
              <Button
                variant="contained"
                color="contrast"
                startIcon={<LoginIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  fontFamily: `"Cormorant Garamond", serif`,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  textTransform: "uppercase",
                }}
              >
                Ingresar
              </Button>
            ) : (
              <>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  aria-label="Cuenta de usuario"
                  sx={(t) => ({
                    backgroundColor: t.palette.contrast.main,
                    color: t.palette.contrast.contrastText,
                    borderRadius: 1,
                    width: 47,
                    height: 47,
                    transition:
                      "transform .15s ease, background-color .15s ease, color .15s ease",
                    "&:hover": {
                      backgroundColor:
                        t.palette.mode === "dark"
                          ? alpha(t.palette.contrast.main, 0.85)
                          : alpha(t.palette.primary.main, 0.1),
                      color:
                        t.palette.mode === "dark"
                          ? t.palette.primary.main
                          : t.palette.text.primary,
                      transform: "scale(1.05)",
                    },
                    "&:active": { transform: "scale(0.97)" },
                  })}
                >
                  <AccountCircle />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleCloseMenu}
                >
                  <MenuItem disabled>{user?.name || user?.email}</MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleCloseMenu();
                      navigate("/dashboard");
                    }}
                  >
                    Mi Panel
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseMenu();
                      logout();
                    }}
                  >
                    <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                    Cerrar sesión
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Toolbar>
      ) : (
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 76 },
            px: { xs: 2, md: 4 },
            display: "grid",
            gridTemplateColumns: "48px 1fr 48px", // izq | centro (logo) | der (avatar)
            alignItems: "center",
          }}
        >
          <Box />

          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <AppLogo height={38} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            {isAuthenticated && (
              <>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  aria-label="Cuenta de usuario"
                  sx={(t) => ({
                    backgroundColor: t.palette.contrast.main,
                    color: t.palette.contrast.contrastText,
                    borderRadius: 1,
                    width: 47,
                    height: 47,
                    transition:
                      "transform .15s ease, background-color .15s ease, color .15s ease",
                    "&:hover": {
                      backgroundColor:
                        t.palette.mode === "dark"
                          ? alpha(t.palette.contrast.main, 0.85)
                          : alpha(t.palette.primary.main, 0.1),
                      color:
                        t.palette.mode === "dark"
                          ? t.palette.primary.main
                          : t.palette.text.primary,
                      transform: "scale(1.05)",
                    },
                    "&:active": { transform: "scale(0.97)" },
                  })}
                >
                  <AccountCircle />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleCloseMenu}
                >
                  <MenuItem disabled>{user?.name || user?.email}</MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleCloseMenu();
                      navigate("/dashboard");
                    }}
                  >
                    Mi Panel
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseMenu();
                      logout();
                    }}
                  >
                    <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                    Cerrar sesión
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      )}

      {/* ============== Drawer mobile (sin cambios) ============== */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 300,
            bgcolor: theme.palette.background.paper,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header con marca y toggle */}
          <Box
            sx={{
              p: 3,
              borderBottom: `1px solid ${alpha(
                theme.palette.roles.outline,
                0.8
              )}`,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Box
                component="div"
                sx={{
                  fontFamily: `"Cormorant Garamond", serif`,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontSize: "1.6rem",
                  lineHeight: 1.1,
                }}
              >
                Memorial
              </Box>
              <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
                <Button
                  onClick={() => {
                    safeToggleMode();
                    setDrawerOpen(false);
                  }}
                  variant="soft"
                  color="contrast"
                  startIcon={
                    theme.palette.mode === "dark" ? (
                      <Brightness7Icon />
                    ) : (
                      <Brightness4Icon />
                    )
                  }
                  sx={{
                    fontFamily: `"Cormorant Garamond", serif`,
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textTransform: "uppercase",
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  {theme.palette.mode === "dark" ? "Modo Claro" : "Modo Oscuro"}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Links */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <List>
              {NAV_LINKS.map((link) => (
                <ListItemButton
                  key={link.id}
                  onClick={() => goSection(link.id)}
                  sx={{
                    py: 1.25,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main,
                      "& .MuiListItemText-primary": {
                        color: theme.palette.common.white,
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{
                      fontFamily: `"Cormorant Garamond", serif`,
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* Acciones */}
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${alpha(theme.palette.roles.outline, 0.8)}`,
              display: "grid",
              gap: 1,
            }}
          >
            <Button
              fullWidth
              variant="soft"
              color="primary"
              href={branchUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<CallIcon />}
              sx={{
                fontFamily: `"Cormorant Garamond", serif`,
                fontWeight: 700,
                fontSize: "1.05rem",
                textTransform: "uppercase",
              }}
            >
              Hablar a sucursal
            </Button>

            {!isAuthenticated ? (
              <Button
                fullWidth
                variant="elevated"
                color="primary"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/login");
                }}
                startIcon={<LoginIcon />}
                sx={{
                  fontFamily: `"Cormorant Garamond", serif`,
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  textTransform: "uppercase",
                }}
              >
                Ingresar
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="elevated"
                  color="primary"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate("/dashboard");
                  }}
                  sx={{
                    fontFamily: `"Cormorant Garamond", serif`,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    textTransform: "uppercase",
                  }}
                >
                  Mi Panel
                </Button>
                <Button
                  fullWidth
                  color="error"
                  variant="contained"
                  startIcon={<LogoutIcon />}
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  sx={{
                    fontFamily: `"Cormorant Garamond", serif`,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    textTransform: "uppercase",
                  }}
                >
                  Cerrar sesión
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
