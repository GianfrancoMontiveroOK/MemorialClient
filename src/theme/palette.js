import { deepmerge } from "@mui/utils"; // opcional si querés extender luego

export const memorialColors = {
  brandGray:   "#3F4447",
  brandLila:   "#A9B3CE",
  brandYellow: "#E2C044",
  white:       "#F7F7F7",
  black:       "#231C1C",
  success:     "#3BB273",
  error:       "#B20D30",
};

export function buildPalette(mode = "light") {
  const isDark = mode === "dark";
  const c = memorialColors;

  const DARK_APP_BG = "#131010";      // fondo “profundo”
  const DARK_PAPER  = c.black;        // #231C1C (marrón Memorial)

  const base = {
    mode,
    primary:   { main: c.brandGray },
    secondary: { main: c.brandLila },
    success:   { main: c.success },
    error:     { main: c.error },
    warning:   { main: c.brandYellow },
    info:      { main: c.brandLila },
    text: {
      primary:   isDark ? c.white : "#000",
      secondary: isDark ? "#C0C5CC" : "#1C1818",
    },
    background: {
      default: isDark ? DARK_APP_BG : "#F7F7F7",
      paper:   isDark ? DARK_PAPER  : "#F7F7F7",
    },

    divider: isDark ? "#3A3333" : "#E7E7E7",
    action: {
      hover:            isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      selected:         isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      disabledBackground:isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    },

    // 🔁 Aliases legacy para no romper código heredado
    terceary: { main: c.brandLila },
    mp:       { main: "#00A3E0" },
    white:    { main: "#FFFFFF" },
    backg:    { main: "#F4FEC1" },

    // Roles semánticos
    roles: {
      // 👇 superficies “suaves” para inputs/boxes (un toque más clara que paper)
      subtleBg: isDark ? "#2A2323" : "#F2F3F5",
      outline:  isDark ? "#3A3333" : "#E7E7E7",
      accent:   c.brandYellow,
    },

    memorial: {
      logos: {
        light: "/src/images/logo-light.svg",
        dark:  "/src/images/logo-dark.svg",
      },
    },
    contrast: {
      // Light: fondo gris principal, texto blanco
      // Dark:  fondo blanco, texto gris principal
      main:         isDark ? c.white     : c.brandGray,
      contrastText: isDark ? c.brandGray : c.white,
    },
    
  };

  return base;
}