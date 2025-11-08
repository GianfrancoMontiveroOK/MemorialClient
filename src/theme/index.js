import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { buildPalette } from "./palette";
import { buildTypography } from "./typography";
import { buildComponents } from "./components";

export function getTheme(mode = "light") {
  const breakpoints = { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1880 } };

  let theme = createTheme({
    palette: buildPalette(mode),
    typography: buildTypography(mode),
    shape: { borderRadius: 6 },
    breakpoints, // 👈 mantenemos los mismos
  });

  theme = createTheme(theme, { components: buildComponents(theme) });
  theme = responsiveFontSizes(theme, { factor: 2.3 });

  return theme;
}