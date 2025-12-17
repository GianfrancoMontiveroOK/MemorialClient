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

    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          // 🔥 mata el overlay/gradient de Paper en dark
          backgroundImage: "none",

          // (opcional) borde sutil para separar superficies
          border:
            theme.palette.mode === "dark"
              ? `1px solid ${alpha(theme.palette.common.white, 0.1)}`
              : "1px solid transparent",
        }),
      },
    },

    MuiSwitch: {
      styleOverrides: {
        // color base del track cuando está apagado (unchecked)
        track: ({ theme }) => ({
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.45)
              : alpha(theme.palette.primary.main, 0.35),
          opacity: 1, // asegura que no quede translúcido
        }),

        // solo intervenimos el estado checked para colores, sin cambiar geometría
        switchBase: ({ theme }) => ({
          "&.Mui-checked": {
            color: theme.palette.common.white, // thumb blanco como en el default
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: theme.palette.success.main, // track verde al activar
            opacity: 1,
          },
        }),
      },

      // default al verde al activar (aprovecha el comportamiento nativo)
      defaultProps: {
        color: "success",
      },
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
            color: theme.palette.common.white,
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

    // --- LABEL flotante más legible (chip) ---
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: "0.95rem",
          letterSpacing: 0.2,
          color: alpha(theme.palette.text.primary, 0.8),
          // transición suave
          transition: theme.transitions.create(["transform", "color"], {
            duration: 160,
          }),
        }),
        shrink: ({ theme }) => ({
          // “chip” sobre el borde
          paddingInline: 8,
          paddingBlock: 2,
          borderRadius: 6,
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : theme.palette.background.paper,
          // elevar contraste cuando está shrink
          color: theme.palette.text.primary,
          fontWeight: 600,
          textTransform: "uppercase",
          // bajamos un poco menos el label para que no toque el borde
          transform: "translate(12px, -9px) scale(0.90)",
        }),
      },
    },

    // --- BORDE y paddings del Outlined ---
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.roles.subtleBg // 👈 en vez de alpha(white, 0.02)
              : theme.palette.background.paper,

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(theme.palette.text.primary, 0.35),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        }),
        notchedOutline: ({ theme }) => ({
          borderColor:
            theme.palette.mode === "dark"
              ? theme.palette.divider // 👈 mejor que alpha(text,0.25) en marrón
              : alpha(theme.palette.text.primary, 0.25),
        }),
      },
    },

    // --- TextField (wrapper) ---
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          // separar label del helper
          marginTop: 2,
        }),
      },
      defaultProps: {
        size: "medium",
        fullWidth: true,
        variant: "outlined",
      },
    },

    // --- HelperText con mejor legibilidad ---
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginTop: 6,
          fontSize: "0.85rem",
          color: alpha(theme.palette.text.primary, 0.75),
        }),
      },
    },

    // --- FormLabel (por si algún control usa FormLabel directo) ---
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          letterSpacing: 0.2,
          textTransform: "uppercase",
        }),
      },
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
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          // base grande + tipografía consistente
          return {
            borderRadius: 10,
            height: 40, // "grande" por defecto (MUI no trae size="large"; agrandamos medium)
            paddingInline: 8,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            boxShadow: "none",
            "& .MuiChip-label": {
              paddingInline: 10,
              paddingBlock: 6,
              fontSize: "0.875rem",
            },
            "& .MuiChip-icon": { fontSize: 20, marginLeft: 6 },
            "& .MuiChip-deleteIcon": { fontSize: 18, opacity: 0.7 },
            "&:hover .MuiChip-deleteIcon": { opacity: 1 },
          };
        },

        // Afinamos el "small" por si alguna vez lo usás
        sizeSmall: {
          height: 32,
          "& .MuiChip-label": {
            paddingInline: 8,
            paddingBlock: 4,
            fontSize: "0.8rem",
          },
        },

        // Estilo para FILLED según color
        filled: ({ ownerState, theme }) => {
          const { color = "default" } = ownerState;

          const isDark = theme.palette.mode === "dark";
          const txt = theme.palette.text.primary;

          // 🎯 DEFAULT (sin color): pill neutro y hover sutil
          if (
            color === "default" ||
            ![
              "primary",
              "secondary",
              "success",
              "error",
              "warning",
              "info",
              "contrast",
            ].includes(color)
          ) {
            const bg = isDark
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.primary.main, 0.08);

            const bgHover = isDark
              ? alpha(theme.palette.common.white, 0.12)
              : alpha(theme.palette.primary.main, 0.14);

            return {
              backgroundColor: bg,
              color: txt,
              boxShadow: "none",
              "&:hover, &.MuiChip-clickable:hover": {
                backgroundColor: bgHover,
                boxShadow: "none",
              },
            };
          }

          // 🎯 COLOREADOS (primary/success/error/warning/etc.)
          const pal =
            color === "contrast"
              ? theme.palette.contrast
              : theme.palette[color];

          // Texto por defecto del color
          let fg = pal?.contrastText || txt;

          // Mejor contraste para success (verde)
          if (color === "success") {
            fg = isDark
              ? theme.palette.common.white
              : theme.palette.common.white;
          }

          const bg = pal?.main || alpha(txt, 0.08);

          return {
            backgroundColor: bg,
            color: fg,
            "&:hover, &.MuiChip-clickable:hover": {
              backgroundColor: isDark ? alpha(bg, 0.88) : alpha(bg, 0.92),
              boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.10)",
            },
          };
        },

        // Estilo para OUTLINED según color
        outlined: ({ ownerState, theme }) => {
          const { color = "default" } = ownerState;
          const txtBase =
            theme.palette.mode === "dark"
              ? theme.palette.common.white
              : theme.palette.text.primary;

          const main =
            theme.palette?.[color]?.main ??
            (color === "contrast" ? theme.palette.contrast?.main : txtBase);

          return {
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: alpha(main, 0.7),
            color: main,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: alpha(main, 0.08),
              borderColor: main,
            },
          };
        },
      },

      defaultProps: {
        size: "medium", // lo agrandamos vía styleOverrides
        variant: "filled", // por defecto como los contained
      },

      // Variants "semánticos" opcionales por si te gusta matchear los alias de Button
      // (uso: <Chip variant="confirm" label="Aprobado" />)
      variants: [
        {
          props: { variant: "confirm" },
          style: {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.common.white,
          },
        },
        {
          props: { variant: "cancel" },
          style: {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.common.white,
          },
        },
        {
          props: { variant: "brandYellow" },
          style: {
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.common.black,
          },
        },
      ],
    },
  };
}
