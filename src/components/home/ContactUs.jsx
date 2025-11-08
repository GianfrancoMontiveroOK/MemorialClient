// src/components/ContactUs.jsx
import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  Link,
  Divider,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendIcon from "@mui/icons-material/Send";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import YardIcon from "@mui/icons-material/Yard";
import { alpha } from "@mui/material/styles";
import AppLogo from "../AppLogo";

/* === Config rápida === */
const WHATSAPP = "5492610000000";
const PHONE_LINK = "tel:+5492610000000";
const wsp = (msg) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
const mapLink = (q) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/* —— Input SX sensible a modo claro/oscuro —— */
const inputSx = (t) => ({
  mt: 0,
  "& .MuiOutlinedInput-root": {
    backgroundColor:
      t.palette.mode === "dark"
        ? alpha(t.palette.common.white, 0.06)
        : "#FFFFFF",
    color: t.palette.mode === "dark" ? t.palette.common.white : "#111",
    borderRadius: 0,
    transition: "background-color .15s ease, border-color .15s ease",
    "& fieldset": {
      borderColor:
        t.palette.mode === "dark"
          ? alpha(t.palette.common.white, 0.25)
          : "rgba(0,0,0,0.20)",
    },
    "&:hover fieldset": {
      borderColor:
        t.palette.mode === "dark"
          ? alpha(t.palette.common.white, 0.45)
          : "rgba(0,0,0,0.38)",
    },
    "&.Mui-focused fieldset": {
      borderColor: t.palette.warning.main,
      borderWidth: 2,
    },
    // evita fondo amarillo de autofill y cambios raros en dark
    "& input:-webkit-autofill": {
      WebkitBoxShadow: `0 0 0 1000px ${
        t.palette.mode === "dark"
          ? alpha(t.palette.common.white, 0.06)
          : "#FFFFFF"
      } inset`,
      WebkitTextFillColor:
        t.palette.mode === "dark" ? t.palette.common.white : "#111",
      transition: "background-color 9999s ease-out 0s",
    },
  },
  "& .MuiInputLabel-root": {
    color:
      t.palette.mode === "dark"
        ? alpha(t.palette.common.white, 0.7)
        : "rgba(0,0,0,0.62)",
  },
});

/* === Item clickeable de ubicación === */
function LocationRow({ icon, nombre, direccion }) {
  return (
    <Link
      href={mapLink(`${nombre} ${direccion}`)}
      target="_blank"
      rel="noopener"
      underline="none"
      color="inherit"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        p: 1,
        borderRadius: 1.5,
        transition: "background-color .15s ease, transform .15s ease",
        "&:hover": {
          backgroundColor: (t) =>
            t.palette.mode === "dark"
              ? alpha(t.palette.common.white, 0.06)
              : alpha("#000", 0.04),
          textDecoration: "none",
        },
        "&:active": { transform: "translateY(1px)" },
        cursor: "pointer",
      }}
    >
      <Box sx={{ color: "#FFC928", lineHeight: 0, mt: "2px" }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            color: (t) =>
              t.palette.mode === "dark" ? t.palette.common.white : "#111",
          }}
        >
          {nombre}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: (t) =>
              t.palette.mode === "dark"
                ? alpha("#fff", 0.78)
                : "rgba(0,0,0,0.78)",
            mt: 0.25,
          }}
        >
          {direccion}
        </Typography>
      </Box>
    </Link>
  );
}

export default function ContactUs() {
  const [values, setValues] = React.useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
    consentimiento: true,
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const validate = () => {
    const e = {};
    if (!values.nombre.trim()) e.nombre = "Ingresá tu nombre";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) e.email = "Email inválido";
    if (values.telefono.replace(/\D/g, "").length < 6)
      e.telefono = "Teléfono inválido";
    if (!values.consentimiento)
      e.consentimiento = "Debés aceptar para continuar";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (k) => (ev) =>
    setValues((s) => ({
      ...s,
      [k]: ev.target.type === "checkbox" ? ev.target.checked : ev.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700)); // TODO: POST real
      setSent(true);
      window.location.hash = "#/gracias";
    } finally {
      setSubmitting(false);
    }
  };

  const wspMsg = `Hola Memorial 👋 Soy ${values.nombre || "(tu nombre)"}.
Quisiera hacer una consulta / coordinar un servicio.
Email: ${values.email || "-"}
Tel: ${values.telefono || "-"}
Mensaje: ${values.mensaje || "-"}`;

  // Datos de sedes
  const oficina = {
    nombre: "Oficinas (Casa Central)",
    direccion: "Av. Ejemplo 123, San Rafael, Mendoza",
  };
  const salas = [
    { nombre: "Sala Velatoria 1", direccion: "Calle A 123, San Rafael" },
    { nombre: "Sala Velatoria 2", direccion: "Calle B 456, San Rafael" },
    { nombre: "Sala Velatoria 3", direccion: "Calle C 789, San Rafael" },
  ];
  const telefonoPublico = "+54 9 261 000 0000";
  const horarioPublico = "Atención 24 horas · Todos los días";

  return (
    <Box
      id="contacto"
      component="section"
      sx={(t) => ({
        position: "relative",
        py: { xs: 6, md: 10 },
        // centrado visual con margen auto y ancho moderado del contenido
        display: "flex",
        justifyContent: "center",
        background:
          t.palette.mode === "dark"
            ? `
              radial-gradient(80rem 40rem at 10% -8%, ${alpha(
                t.palette.warning.main,
                0.1
              )}, transparent 70%),
              radial-gradient(60rem 30rem at 110% 12%, ${alpha(
                t.palette.warning.main,
                0.08
              )}, transparent 75%),
              ${t.palette.primary.main}
            `
            : `
              radial-gradient(70rem 35rem at 10% -8%, ${alpha(
                t.palette.warning.main,
                0.08
              )}, transparent 70%),
              radial-gradient(50rem 25rem at 110% 12%, ${alpha(
                t.palette.warning.main,
                0.06
              )}, transparent 75%),
              ${t.palette.background.default}
            `,
      })}
    >
      {/* container más angosto y centrado */}
      <Container maxWidth="lg" sx={{ mx: "auto" }}>
        <Grid
          container
          spacing={3}
          alignItems="stretch"
          justifyContent="center" // ⬅️ centra la grilla completa
        >
          {/* Columna izquierda: Form */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.12)",
                background: (t) =>
                  t.palette.mode === "dark"
                    ? alpha(t.palette.common.white, 0.03)
                    : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.96))",
                width: "100%",
                maxWidth: 720, // ⬅️ limita ancho y lo centra
                mx: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "#FFC928",
                  fontWeight: 800,
                  letterSpacing: 2,
                  textAlign: "center",
                }}
              >
                Contacto
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  textAlign: "center",
                  color: (t) =>
                    t.palette.mode === "dark" ? t.palette.common.white : "#111",
                }}
              >
                Estamos para acompañarte
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  textAlign: "center",
                  color: (t) =>
                    t.palette.mode === "dark"
                      ? alpha("#fff", 0.72)
                      : "rgba(0,0,0,0.62)",
                }}
              >
                Dejanos tus datos y te contactamos a la brevedad.
              </Typography>

              {sent && (
                <Alert severity="success" sx={{ mt: 2, mx: "auto" }}>
                  ¡Gracias! Redirigiendo a la página de confirmación…
                </Alert>
              )}

              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{ mt: 2 }}
              >
                {/* 2×2 fijo */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    "& .MuiFormControl-root.MuiTextField-root": {
                      mt: "0 !important",
                    },
                  }}
                >
                  <TextField
                    label="Nombre"
                    required
                    value={values.nombre}
                    onChange={onChange("nombre")}
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                    sx={inputSx}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    required
                    value={values.email}
                    onChange={onChange("email")}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={inputSx}
                  />
                  <TextField
                    label="Teléfono"
                    required
                    value={values.telefono}
                    onChange={onChange("telefono")}
                    error={!!errors.telefono}
                    helperText={errors.telefono}
                    sx={inputSx}
                  />
                  <TextField
                    label="Mensaje"
                    value={values.mensaje}
                    onChange={onChange("mensaje")}
                    sx={inputSx}
                  />
                </Box>

                <FormControlLabel
                  sx={{
                    mt: 1,
                    color: (t) =>
                      t.palette.mode === "dark"
                        ? alpha("#fff", 0.72)
                        : "rgba(0,0,0,0.62)",
                    display: "block",
                    textAlign: "center",
                  }}
                  control={
                    <Checkbox
                      checked={values.consentimiento}
                      onChange={onChange("consentimiento")}
                    />
                  }
                  label="Acepto ser contactado/a para coordinar mi consulta."
                />

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mt: 2, justifyContent: "center" }}
                >
                  <Button
                    type="submit"
                    variant="brandYellow"
                    size="large"
                    endIcon={<SendIcon />}
                    disabled={submitting}
                  >
                    ENVIAR DATOS
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<WhatsAppIcon />}
                    href={wsp(wspMsg)}
                    target="_blank"
                    rel="noopener"
                  >
                    WHATSAPP OFICINAS
                  </Button>
                </Stack>
                <Divider
                  sx={{
                    my: 3,
                    opacity: (t) => (t.palette.mode === "dark" ? 0.12 : 0.2),
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={(t) => ({
                      width: 300, 
                      opacity: t.palette.mode === "dark" ? 0.9 : 0.85,
                      filter:
                        t.palette.mode === "dark"
                          ? "drop-shadow(0 2px 6px rgba(0,0,0,.45))"
                          : "grayscale(0.1)",
                    })}
                  >
                    <AppLogo height={50}/>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Columna derecha: Info */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.12)",
                background: (t) =>
                  t.palette.mode === "dark"
                    ? alpha(t.palette.common.white, 0.03)
                    : "#FFFFFF",
                width: "100%",
                maxWidth: 520, // ⬅️ igual, angosto y centrado
                mx: "auto",
              }}
            >
              {/* UBICACIONES */}
              <Typography
                variant="overline"
                sx={{
                  color: (t) =>
                    t.palette.mode === "dark" ? t.palette.common.white : "#111",
                  fontWeight: 800,
                  letterSpacing: 1,
                  textAlign: "center",
                  mb: 0.5,
                }}
              >
                Ubicaciones
              </Typography>

              <LocationRow
                icon={<PlaceOutlinedIcon />}
                nombre={oficina.nombre}
                direccion={oficina.direccion}
              />

              <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                {salas.map((s) => (
                  <LocationRow
                    key={s.nombre}
                    icon={<YardIcon />}
                    nombre={s.nombre}
                    direccion={s.direccion}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Teléfono */}
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="center"
              >
                <PhoneInTalkOutlinedIcon sx={{ color: "#FFC928" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: (t) =>
                      t.palette.mode === "dark"
                        ? t.palette.common.white
                        : "#111",
                  }}
                >
                  {telefonoPublico}
                </Typography>
              </Stack>

              {/* Horario */}
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 1 }}
              >
                <ScheduleOutlinedIcon sx={{ color: "#FFC928" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: (t) =>
                      t.palette.mode === "dark"
                        ? t.palette.common.white
                        : "#111",
                  }}
                >
                  {horarioPublico}
                </Typography>
              </Stack>

              {/* Botones */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mt: 2, justifyContent: "center" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<WhatsAppIcon />}
                  href={wsp("Hola, quisiera realizar una consulta a Memorial.")}
                  target="_blank"
                  rel="noopener"
                >
                  WHATSAPP
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PhoneInTalkOutlinedIcon />}
                  href={PHONE_LINK}
                >
                  LLAMAR
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
