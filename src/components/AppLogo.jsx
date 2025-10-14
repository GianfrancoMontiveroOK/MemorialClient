import * as React from "react";
import { Box, useTheme } from "@mui/material";
import logoLight from "../images/logo-light.svg";
import logoDark from "../images/logo-dark.svg";

export default function AppLogo({ height = 30, variant, ...props }) {
  const { palette } = useTheme();
  const mode = variant || palette.mode;
  const src = mode === "dark" ? logoDark : logoLight;

  return (
<Box
  component="img"
  alt="Memorial"
  src={src}
  loading="lazy"
  decoding="async"
  sx={{
    display: "block",
    height,
    width: "auto",
    filter: "drop-shadow(0px 3px 4px rgba(0,0,0,0.25))",
    transition: "transform 0.25s ease, filter 0.25s ease",

    "&:hover": {
      transform: "scale(1.05)", // 👈 crece levemente
      filter: "drop-shadow(0px 6px 8px rgba(0,0,0,0.35))", // 👈 sombra más fuerte
    },
  }}
  {...props}
/>
  );
}