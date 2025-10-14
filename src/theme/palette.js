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

  const base = {
    mode,
    primary:   { main: c.brandGray },
    secondary: { main: c.brandLila },
    success:   { main: c.success },
    error:     { main: c.error },
    warning:   { main: c.brandYellow },
    info:      { main: c.brandLila },
    text: {
      primary:   isDark ? c.white : c.black,
      secondary: isDark ? "#C0C5CC" : "#5A6166",
    },
    background: {
      default: isDark ? "#231C1C" : "#F7F7F7",
      paper:   isDark ? "#1C1818" : "#F7F7F7",
    },

    // 🔁 Aliases legacy para no romper código heredado
    terceary: { main: c.brandLila },
    mp:       { main: "#00A3E0" },
    white:    { main: "#FFFFFF" },
    backg:    { main: "#F4FEC1" },

    // Roles semánticos
    roles: {
      subtleBg: isDark ? "#1E1A1A" : "#F2F3F5",
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