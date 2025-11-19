import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { alpha, useTheme } from "@mui/material/styles";

export default function LoginPageMemorial() {
  const navigate = useNavigate();
  const theme = useTheme();
  const mode = theme.palette.mode || "light";

  const [showInfo, setShowInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { signin, errors: loginErrors, isAuthenticated, loading } = useAuth();

  const onSubmit = handleSubmit(async (data) => {
    await signin(data);
    // el navigate principal lo manejamos en el useEffect
  });

  useEffect(() => {
    if (isAuthenticated) {
      // ⬅️ ahora redirige al dashboard
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const bg = theme.palette.background.default;
  const paper = theme.palette.background.paper;
  const txt = theme.palette.text.primary;
  const txtSec = theme.palette.text.secondary;
  const outline = theme.palette.roles?.outline || alpha(txt, 0.15);
  const accent = theme.palette.roles?.accent || theme.palette.primary.main;

  // 👇 NUEVO: “inversor” de color local para los paneles
  const panelFg =
    mode === "light" ? theme.palette.common.black : theme.palette.common.white;
  const panelFgMuted = alpha(panelFg, 0.7);
  const panelBorder = alpha(panelFg, 0.22);
  const panelPaperBg = paper;

  const logoSrc =
    theme.palette?.memorial?.logos?.[mode] || "/src/images/logo-dark.svg"; // fallback suave

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        display: "grid",
        placeItems: "center",
        bgcolor: bg,
        color: txt,
        overflow: "hidden",
      }}
    >
      {/* Fondo sutil con acento del brandYellow */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(1200px 600px at 85% -10%, ${alpha(
              txt,
              0.06
            )}, transparent 55%),
            radial-gradient(900px 500px at -10% 110%, ${alpha(
              txt,
              0.05
            )}, transparent 55%),
            linear-gradient(180deg, ${alpha(txt, 0.03)}, ${alpha(
            "#000",
            mode === "dark" ? 0.06 : 0.02
          )})
          `,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(
            accent,
            0.6
          )}, transparent)`,
        }}
      />

      <Stack
        spacing={3}
        sx={{
          width: "100%",
          maxWidth: 1080,
          px: { xs: 2.5, md: 4 },
          pt: { xs: 2, md: 0 },
        }}
      >
        {/* Logo + Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Stack spacing={1.5} alignItems={{ xs: "center", md: "flex-start" }}>
            <Typography
              variant="h1"
              sx={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              INGRESÁ A TU CUENTA
            </Typography>
            <Typography sx={{ color: txtSec }}>
              Panel de gestión de cobranzas y recibos de{" "}
              <strong>Memorial</strong>.
            </Typography>
          </Stack>
        </motion.div>

        {/* Banner informativo */}
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert
              icon={<InfoOutlinedIcon />}
              onClose={() => setShowInfo(false)}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(outline, 0.6)}`,
                background: `linear-gradient(180deg, ${alpha(
                  paper,
                  0.6
                )}, ${alpha(paper, 0.4)})`,
                color: txt,
                "& .MuiAlert-icon": { color: txtSec },
              }}
            >
              Accedé para registrar cobros, emitir recibos PDF y cerrar caja con
              trazabilidad.
            </Alert>
          </motion.div>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="stretch"
        >
          {/* Formulario */}
          <motion.div
            style={{ flex: 1 }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${outline}`,
                backgroundColor: paper,
                boxShadow: `0 24px 48px ${alpha(
                  "#000",
                  mode === "dark" ? 0.5 : 0.15
                )}`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    variant="outlined"
                    {...register("email", { required: true })}
                    error={Boolean(errors.email)}
                    helperText={errors.email ? "El email es obligatorio" : " "}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlineIcon sx={{ color: txtSec }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    {...register("password", { required: true })}
                    error={Boolean(errors.password)}
                    helperText={
                      errors.password ? "La contraseña es obligatoria" : " "
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: txtSec }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                            aria-label="mostrar u ocultar contraseña"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Errores backend */}
                  {loginErrors?.length > 0 && (
                    <Stack spacing={1}>
                      {loginErrors.map((err, i) => (
                        <Alert
                          key={i}
                          severity="error"
                          sx={{
                            borderRadius: 2,
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.08
                            ),
                            border: `1px solid ${alpha(
                              theme.palette.error.main,
                              0.25
                            )}`,
                          }}
                        >
                          {err}
                        </Alert>
                      ))}
                    </Stack>
                  )}

                  {/* Botón principal */}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ py: 1.4, fontWeight: 800, letterSpacing: 0.2 }}
                  >
                    {loading ? (
                      <CircularProgress size={22} />
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>

                  {/* Botón Registrarse */}
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => navigate("/register")} // ⬅️ ajustá la ruta si tu registro está en otra
                    sx={{
                      fontWeight: 600,
                      textTransform: "none",
                      alignSelf: "center",
                    }}
                  >
                    ¿Todavía no tenés cuenta? Registrarme
                  </Button>

                  <Typography sx={{ textAlign: "center", color: txtSec }}>
                    ¿No tenés usuario? Pedí el alta a tu administrador.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lateral: beneficios + CTA ventas */}
          <motion.div
            style={{ flex: 1 }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${outline}`,
                backgroundColor: paper,
                boxShadow: `0 24px 48px ${alpha(
                  "#000",
                  mode === "dark" ? 0.5 : 0.15
                )}`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  ¿Por qué debo registrarme?
                </Typography>
                <Typography sx={{ color: txtSec, mb: 2 }}>
                  Autogestión, cobros y una operación ordenada de principio a
                  fin.
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: "wrap", mb: 3 }}
                >
                  <Chip label="Talonario digital" {...chipStyle(theme)} />
                  <Chip
                    label="Recibos PDF correlativos"
                    {...chipStyle(theme)}
                  />
                  <Chip label="Caja diaria con arqueo" {...chipStyle(theme)} />
                  <Chip label="Operación sin conexión" {...chipStyle(theme)} />
                  <Chip
                    label="Indicadores y rendiciones"
                    {...chipStyle(theme)}
                  />
                </Stack>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${outline}`,
                    backgroundColor: alpha(paper, 0.6),
                    display: "grid",
                    gap: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountBalanceIcon sx={{ color: txtSec }} />
                    <Typography sx={{ color: txt, fontWeight: 700 }}>
                      Atención cálida siempre
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: txtSec }}>
                    ¿Queres saber más de nuestros servicios?
                  </Typography>

                  {/* CTA ventas */}
                  <Button
                    variant="brandYellow"
                    startIcon={<WhatsAppIcon />}
                    href="https://wa.me/5492604000000?text=Hola%20Memorial,%20quisiero%20más%20información"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 0.5, alignSelf: "start" }}
                  >
                    Hablar a sucursal
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Stack>
      </Stack>
    </Box>
  );
}

/* helpers */
const chipStyle = (theme) => ({
  variant: "outlined",
  sx: {
    color: theme.palette.text.primary,
    borderColor:
      theme.palette.roles?.outline || alpha(theme.palette.text.primary, 0.25),
    backgroundColor: alpha(theme.palette.background.paper, 0.4),
    backdropFilter: "blur(4px)",
    "&:hover": {
      borderColor: alpha(theme.palette.text.primary, 0.5),
      backgroundColor: alpha(theme.palette.background.paper, 0.6),
    },
  },
});
