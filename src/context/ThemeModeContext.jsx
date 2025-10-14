import React, { createContext, useContext, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { buildPalette } from "../theme/palette";
import { buildComponents } from "../theme/components";

const ThemeModeContext = createContext();

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState("light");

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(() => {
    const palette = buildPalette(mode);
    return createTheme({
      palette,
      components: buildComponents({ palette }),
      typography: {
        fontFamily: '"Cormorant Garamond", serif',
      },
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    console.warn("useThemeMode() usado fuera de <ThemeModeProvider />");
    return {}; // 👈 devolvé objeto vacío
  }
  return ctx;
}