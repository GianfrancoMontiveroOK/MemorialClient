import { alpha } from "@mui/material/styles";

export function buildComponents(theme) {
  const shadowBase = "0 1px 0 rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.12)";
  const shadowHover = "0 2px 0 rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.20)";

  const primary = theme.palette.primary.main;
  const success = theme.palette.success.main;
  const error = theme.palette.error.main;
  const warning = theme.palette.warning.main;

  const onSuccess = theme.palette.common.white;
  const onError = theme.palette.common.white;
  const onWarn = theme.palette.common.black;

  const textBase =
    theme.palette.mode === "dark"
      ? theme.palette.common.white
      : theme.palette.text.primary;

  return {
    MuiTypography: {
      variants: [
        { props: { variant: "display" }, style: theme.typography.display },
      ],
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: 0.2,
          transition:
            "transform .12s ease, box-shadow .12s ease, background-color .12s ease, color .12s ease, border-color .12s ease",
          boxShadow: "none",
          "--btn-bg": "transparent",
          "--btn-fg": theme.palette.text.primary,
          "&:focus-visible": {
            outline: `3px solid ${alpha(
              theme.palette.roles?.accent || theme.palette.primary.main,
              0.2
            )}`,
            outlineOffset: 2,
          },
        },

        sizeMedium: {
          paddingInline: 18,
          paddingBlock: 10,
          fontSize: "0.975rem",
          lineHeight: 1.2,
        },
        sizeLarge: {
          paddingInline: 24,
          paddingBlock: 13,
          fontSize: "1.05rem",
          lineHeight: 1.22,
        },

        text: {
          backgroundColor: "transparent",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        outlined: { boxShadow: "none" },

        // ===== Contained base (ya lo tenías)
        contained: {
          backgroundColor: "var(--btn-bg)",
          color: "var(--btn-fg)",
          boxShadow: shadowBase,
          "&:hover": {
            backgroundColor: "var(--btn-fg)",
            color: "var(--btn-bg)",
            boxShadow: shadowHover,
            transform: "translateY(-1px)",
          },
        },

        // ===== Map de colores existentes
        containedPrimary: {
          "--btn-bg": theme.palette.primary.main,
          "--btn-fg": theme.palette.primary.contrastText,
        },
        containedInherit: {
          "--btn-bg": alpha(theme.palette.text.primary, 0.08),
          "--btn-fg": theme.palette.text.primary,
        },
        containedContrast: {
          "--btn-bg": theme.palette.contrast.main,
          "--btn-fg": theme.palette.contrast.contrastText,
          backgroundColor: "var(--btn-bg)",
          color: "var(--btn-fg)",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "var(--btn-fg)",
            color: "var(--btn-bg)",
            boxShadow: "none",
          },
        },

        outlinedContrast: {
          borderColor: theme.palette.contrast.main,
          color: theme.palette.contrast.main,
          "&:hover": {
            borderColor: alpha(theme.palette.contrast.main, 0.7),
            backgroundColor: alpha(theme.palette.contrast.main, 0.08),
          },
        },

        // ===== NUEVOS mapeos contained por color (para usar color="success|error|warning")
        containedSuccess: {
          "--btn-bg": success,
          "--btn-fg": onSuccess,
        },
        containedError: {
          "--btn-bg": error,
          "--btn-fg": onError,
        },
        containedWarning: {
          "--btn-bg": warning, // tu brandYellow
          "--btn-fg": onWarn, // negro
        },
      },

      variants: [
        // NAV (igual)
        {
          props: { variant: "nav" },
          style: ({ theme }) => {
            const txt = theme.palette.text.primary;
            const bgBase =
              theme.palette.mode === "dark"
                ? theme.palette.background.default
                : theme.palette.background.paper;

            return {
              backgroundColor: "transparent !important",
              color: txt,
              border: "none",
              boxShadow: "none",
              position: "relative",
              paddingInline: 14,
              paddingBlock: 10,
              fontFamily: `"Cormorant Garamond", serif`,
              fontWeight: 700,
              fontSize: "1.1rem",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              transition:
                "transform .15s ease, text-shadow .15s ease, background-color .15s ease, color .15s ease",
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                bottom: 6,
                width: "100%",
                height: 1,
                backgroundColor: alpha(txt, 0.25),
                transition: "background-color .2s ease",
              },
              "&:hover": {
                backgroundColor: `${txt} !important`,
                color: bgBase,
                textShadow: "0 2px 4px rgba(0,0,0,0.35)",
                transform: "scale(1.05)",
                "&::after": { backgroundColor: bgBase },
              },
            };
          },
        },

        // SOFT (igual)
        {
          props: { variant: "soft", color: "contrast" },
          style: ({ theme }) => {
            const c = theme.palette.contrast.main;
            const txt = theme.palette.text.primary;
            const cText = theme.palette.contrast.contrastText;
            return {
              backgroundColor: alpha(primary, 0.08),
              color: txt,
              border: `1px solid ${alpha(txt, 0.25)}`,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: c,
                color: cText,
                borderColor: c,
                boxShadow: "none",
              },
            };
          },
        },

        // ELEVATED (igual)
        {
          props: { variant: "elevated", color: "primary" },
          style: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,
            boxShadow: "0 1px 0 rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.12)",
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.92),
              boxShadow:
                "0 2px 0 rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.20)",
              transform: "translateY(-1px)",
            },
          }),
        },

        // ===== NUEVAS variantes semánticas (aliases)
        // Confirmar (verde)
        {
          props: { variant: "confirm" },
          style: {
            "--btn-bg": success,
            "--btn-fg": onSuccess,
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-fg)",
            boxShadow: shadowBase,
            "&:hover": {
              backgroundColor: "var(--btn-fg)",
              color: "var(--btn-bg)",
              boxShadow: shadowHover,
              transform: "translateY(-1px)",
            },
          },
        },
        // Cancelar (rojo)
        {
          props: { variant: "cancel" },
          style: {
            "--btn-bg": error,
            "--btn-fg": onError,
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-fg)",
            boxShadow: shadowBase,
            "&:hover": {
              backgroundColor: "var(--btn-fg)",
              color: "var(--btn-bg)",
              boxShadow: shadowHover,
              transform: "translateY(-1px)",
            },
          },
        },
        // Amarillo marca (texto negro)
        {
          props: { variant: "brandYellow" },
          style: {
            "--btn-bg": warning, // palette.warning = memorialColors.brandYellow
            "--btn-fg": onWarn, // negro
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-fg)",
            boxShadow: shadowBase,
            "&:hover": {
              backgroundColor: "var(--btn-fg)", // negro
              color: "var(--btn-bg)", // amarillo
              boxShadow: shadowHover,
              transform: "translateY(-1px)",
            },
          },
        },
      ],

      defaultProps: {
        disableElevation: true,
        size: "large",
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: 8 } },
      },
      defaultProps: { size: "medium" },
    },

    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          "@media (min-width:900px)": { paddingLeft: 24, paddingRight: 24 },
          "@media (min-width:1200px)": { paddingLeft: 32, paddingRight: 32 },
        },
      },
    },
  };
}
