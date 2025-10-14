import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
  Link as MUILink,
  alpha,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { useForm } from "react-hook-form";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** 🎨 Tokens (oscuro + plateado) */
const COLORS = {
  bg: "#0F0F10",
  bg2: "#1A1B1E",
  graphite: "#2E2E2E",
  slate: "#3F3F46",
  cement: "#6B7280",
  silver: "#B3BAC5",
  silverLight: "#D1D5DB",
  whiteSmoke: "#F5F5F5",
  plainBg: "#0E1114",
  success: "#22c55e",
  error: "#ef4444",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [justRegisteredEmail, setJustRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const confirmHeadingRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const { signup, errors: registerErrors } = useAuth();

  const emailValue = watch("email", "");
  useEffect(() => {
    if (!confirmationSent || resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [confirmationSent, resendCooldown]);

  useEffect(() => {
    if (confirmationSent && confirmHeadingRef.current) {
      confirmHeadingRef.current.focus();
    }
  }, [confirmationSent]);

  const onSubmit = handleSubmit(async (values) => {
    const ok = await signup(values);
    if (ok !== false) {
      setJustRegisteredEmail(values.email);
      setConfirmationSent(true);
      setResendCooldown(30);
      // Limpia la cookie de sesión (opcional, solo visual)
      document.cookie =
        "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  });

  const providerLink = useMemo(() => {
    const email = (justRegisteredEmail || emailValue || "").toLowerCase();
    if (email.endsWith("@gmail.com")) return "https://mail.google.com";
    if (
      email.endsWith("@outlook.com") ||
      email.endsWith("@hotmail.com") ||
      email.endsWith("@live.com")
    )
      return "https://outlook.live.com/mail";
    if (email.endsWith("@yahoo.com")) return "https://mail.yahoo.com";
    return "about:blank";
  }, [justRegisteredEmail, emailValue]);

  // --- VISTA CONFIRMACIÓN ---
  if (confirmationSent) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: COLORS.plainBg,
          color: COLORS.whiteSmoke,
          display: "grid",
          placeItems: "center",
          px: { xs: 2.5, md: 4 },
          transition: "background-color 240ms ease",
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 3,
            bgcolor: alpha(COLORS.graphite, 0.6),
            border: `1px solid ${alpha(COLORS.silverLight, 0.14)}`,
            boxShadow: `0 24px 48px ${alpha("#000", 0.55)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={2.5} alignItems="center" textAlign="center">
              <MarkEmailReadRoundedIcon
                sx={{ fontSize: 48, color: COLORS.silverLight }}
              />
              <Typography
                variant="h4"
                ref={confirmHeadingRef}
                tabIndex={-1}
                sx={{ fontWeight: 900, outline: "none", letterSpacing: -0.3 }}
              >
                Confirmá tu correo electrónico
              </Typography>

              <Typography sx={{ color: COLORS.silverLight, maxWidth: 560 }}>
                Te enviamos un email a{" "}
                <strong>{justRegisteredEmail || emailValue}</strong>. Abrí tu
                bandeja de entrada y hacé clic en el enlace para activar tu
                cuenta.
              </Typography>

              <Stack
                role="status"
                aria-live="polite"
                spacing={1.2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(COLORS.slate, 0.35),
                  border: `1px solid ${alpha(COLORS.silverLight, 0.14)}`,
                  width: "100%",
                  maxWidth: 560,
                  textAlign: "left",
                }}
              >
                <Row
                  icon="•"
                  text="Revisá SPAM o Promociones si no lo encontrás."
                />
                <Row
                  icon="•"
                  text="El enlace vence en unos minutos por seguridad."
                />
                <Row
                  icon="•"
                  text="¿No sos vos? Cerrá sesión y registrate con el correo correcto."
                />
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 1 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  href={providerLink}
                  target={providerLink === "about:blank" ? undefined : "_blank"}
                  rel="noopener"
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${alpha(
                      COLORS.silverLight,
                      0.95
                    )}, ${alpha(COLORS.silver, 1)})`,
                    color: COLORS.bg,
                    "&:hover": {
                      background: `linear-gradient(180deg, ${alpha(
                        COLORS.silverLight,
                        1
                      )}, ${alpha(COLORS.silver, 1)})`,
                    },
                  }}
                >
                  Abrir mi correo
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <MUILink
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{ color: COLORS.silverLight }}
                >
                  Iniciar sesión
                </MUILink>
                <Typography sx={{ color: alpha(COLORS.silverLight, 0.5) }}>
                  ·
                </Typography>
                <MUILink
                  component={RouterLink}
                  to="/"
                  underline="hover"
                  sx={{ color: COLORS.silverLight }}
                >
                  Volver al inicio
                </MUILink>
              </Stack>

              <Typography
                sx={{
                  color: alpha(COLORS.silverLight, 0.8),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{ fontSize: 18, color: COLORS.success }}
                />
                Seguridad primero: verificamos tu email para proteger tu cuenta.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // --- VISTA FORMULARIO ---
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        display: "grid",
        placeItems: "center",
        bgcolor: COLORS.bg,
        color: COLORS.whiteSmoke,
        overflow: "hidden",
        px: { xs: 2.5, md: 4 },
      }}
    >
      {/* Fondo futurista */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1200px 600px at 85% -10%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(900px 500px at -10% 110%, rgba(255,255,255,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.06))",
        }}
      />
      {/* Borde superior con brillo */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(
            COLORS.silver,
            0.6
          )}, transparent)`,
        }}
      />

      <Stack sx={{ width: "100%", maxWidth: 1080 }} spacing={3}>
        <Stack spacing={0.5}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: 28, sm: 36, md: 44 },
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            Crear nueva cuenta
          </Typography>
          <Typography sx={{ color: COLORS.silverLight }}>
            Unite a la escena de San Rafael: comprá entradas y gestioná tus
            eventos.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid ${alpha(COLORS.silverLight, 0.14)}`,
              background: `linear-gradient(180deg, ${alpha(
                COLORS.slate,
                0.18
              )}, ${alpha(COLORS.graphite, 0.28)})`,
              boxShadow: `0 24px 48px ${alpha("#000", 0.55)}`,
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack
                component="form"
                spacing={2.5}
                onSubmit={onSubmit}
                noValidate
              >
                <TextField
                  label="Nombre"
                  fullWidth
                  variant="filled"
                  {...register("name", {
                    required: "El nombre es obligatorio",
                  })}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message || " "}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: COLORS.silverLight }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: alpha(COLORS.graphite, 0.35),
                      color: COLORS.whiteSmoke,
                    },
                  }}
                  InputLabelProps={{ sx: { color: COLORS.silverLight } }}
                />

                <TextField
                  label="Correo electrónico"
                  type="email"
                  fullWidth
                  variant="filled"
                  {...register("email", {
                    required: "El correo electrónico es obligatorio",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                      message: "Ingresá un correo válido",
                    },
                  })}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message || " "}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon sx={{ color: COLORS.silverLight }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: alpha(COLORS.graphite, 0.35),
                      color: COLORS.whiteSmoke,
                    },
                  }}
                  InputLabelProps={{ sx: { color: COLORS.silverLight } }}
                />

                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  variant="filled"
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  })}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message || " "}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: COLORS.silverLight }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          aria-label={
                            showPassword
                              ? "ocultar contraseña"
                              : "mostrar contraseña"
                          }
                          sx={{ color: COLORS.silverLight }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: alpha(COLORS.graphite, 0.35),
                      color: COLORS.whiteSmoke,
                    },
                  }}
                  InputLabelProps={{ sx: { color: COLORS.silverLight } }}
                />

                {registerErrors?.length > 0 && (
                  <Stack spacing={1} aria-live="assertive">
                    {registerErrors.map((err, i) => (
                      <Alert
                        key={i}
                        severity="error"
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(COLORS.error, 0.08),
                          border: `1px solid ${alpha(COLORS.error, 0.25)}`,
                        }}
                      >
                        {err}
                      </Alert>
                    ))}
                  </Stack>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.4,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    background: `linear-gradient(180deg, ${alpha(
                      COLORS.silverLight,
                      0.85
                    )}, ${alpha(COLORS.silver, 0.95)})`,
                    color: COLORS.bg,
                    boxShadow: `0 12px 30px ${alpha(COLORS.silver, 0.25)}`,
                    "&:hover": {
                      background: `linear-gradient(180deg, ${alpha(
                        COLORS.silverLight,
                        0.95
                      )}, ${alpha(COLORS.silver, 1)})`,
                    },
                  }}
                >
                  {isSubmitting ? "Creando cuenta..." : "Registrar cuenta"}
                </Button>

                <Typography
                  sx={{ textAlign: "center", color: COLORS.silverLight }}
                >
                  ¿Ya tenés una cuenta?
                  <MUILink
                    component={RouterLink}
                    to="/login"
                    underline="none"
                    sx={{ ml: 1, fontWeight: 700, color: COLORS.whiteSmoke }}
                  >
                    Iniciar sesión
                  </MUILink>
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid ${alpha(COLORS.silverLight, 0.12)}`,
              background: `linear-gradient(180deg, ${alpha(
                COLORS.slate,
                0.2
              )}, ${alpha(COLORS.graphite, 0.3)})`,
              boxShadow: `0 24px 48px ${alpha("#000", 0.5)}`,
              display: { xs: "none", md: "block" },
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                Bienvenido a Valleypass
              </Typography>
              <Typography sx={{ color: COLORS.silverLight, mb: 2 }}>
                Registrate gratis y empezá a explorar eventos, comprar entradas
                y guardar tus favoritos.
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(COLORS.silverLight, 0.12)}`,
                  background: `linear-gradient(180deg, ${alpha(
                    COLORS.graphite,
                    0.25
                  )}, ${alpha(COLORS.slate, 0.2)})`,
                }}
              >
                <Typography sx={{ color: COLORS.silverLight }}>
                  ¿Sos organizador?
                  <MUILink
                    component={RouterLink}
                    to="/socio/anuncios"
                    underline="none"
                    sx={{ ml: 0.8, fontWeight: 700, color: COLORS.whiteSmoke }}
                  >
                    publicá tu evento
                  </MUILink>{" "}
                  y gestioná ventas con QR en minutos.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

function Row({ icon, text }) {
  return (
    <Typography
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: COLORS.silverLight,
      }}
    >
      <span aria-hidden>{icon}</span>
      {text}
    </Typography>
  );
}
