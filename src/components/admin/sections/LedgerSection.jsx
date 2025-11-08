import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

/**
 * LedgerSection (bloqueada)
 *
 * Esta vista bloquea el acceso a la carga manual del libro mayor.
 * Mensaje: La funcionalidad de "Retiros" podría habilitarse a futuro
 * (rol exclusivo: superAdministrador).
 *
 * Props opcionales:
 * - userRole?: string       // ej: "admin" | "superAdmin" | "cobrador"
 * - onBack?: () => void     // callback para volver a la pantalla anterior
 * - onRequestFeature?: () => void // callback para abrir modal/soporte
 */
export default function LedgerSection({ userRole, onBack, onRequestFeature }) {
  const role = userRole || "—";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: "auto" }}>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="column"
          alignItems="center"
          textAlign="center"
          spacing={2.5}
          sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 } }}
        >
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "action.hover",
            }}
          >
            <LockOutlinedIcon fontSize="large" color="action" />
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={800}>
              Sección en desarrollo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              La carga manual de asientos del libro mayor <b>no es necesaria</b>{" "}
              en el sistema actual. Esta pantalla quedará reservada para la
              implementación futura de <b>“Retiros”</b>, una función exclusiva
              para usuarios con rol <b>superAdministrador</b>.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
          >
            <Chip
              icon={<ShieldRoundedIcon />}
              label={`Rol actual: ${role}`}
              variant="outlined"
              color={role === "superAdmin" ? "success" : "default"}
            />
            <Chip
              icon={<ConstructionRoundedIcon />}
              label="Estado: pendiente de implementación"
              variant="outlined"
              color="warning"
            />
          </Stack>

          <Divider flexItem sx={{ my: 1.5 }} />

          <Stack spacing={1.25} maxWidth={720}>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Tooltip title="Volver al panel anterior">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackRoundedIcon />}
                  onClick={() => {
                    if (typeof onBack === "function") return onBack();
                    if (window?.history?.length > 1) window.history.back();
                  }}
                >
                  Volver
                </Button>
              </Tooltip>

              <Tooltip title="Solicitar esta funcionalidad">
                <Button
                  variant="contained"
                  onClick={() => {
                    if (typeof onRequestFeature === "function")
                      return onRequestFeature();
                    // Fallback: mailto (ajusta el correo si querés)
                    window.location.href =
                      "mailto:soporte@tuapp.com?subject=Solicitud%20de%20funcionalidad%20Retiros&body=Hola%2C%20quisiera%20solicitar%20la%20habilitaci%C3%B3n%20de%20%22Retiros%22%20(rol%20superAdmin).";
                  }}
                >
                  Solicitar “Retiros”
                </Button>
              </Tooltip>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="center"
              alignItems={{ xs: "flex-start", md: "center" }}
              sx={{ mt: 1 }}
            >
              <InfoPill text="Retiros registrará movimientos con contrapartida automática." />
              <InfoPill text="Acceso restringido a superAdministrador." />
              <InfoPill text="Trazabilidad total: asiento, comprobante y auditoría." />
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

function InfoPill({ text }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <InfoOutlinedIcon fontSize="small" color="action" />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}
