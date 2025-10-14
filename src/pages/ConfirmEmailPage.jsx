import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Link as MUILink,
  alpha,
} from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  plainBg: "#0E1114",
  graphite: "#2E2E2E",
  silverLight: "#D1D5DB",
  whiteSmoke: "#F5F5F5",
};

export default function ConfirmEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { confirmEmail } = useAuth();

  const [state, setState] = useState({ loading: true, ok: false, msg: "" });

  const ran = useRef(false); // 👈 evita el doble efecto en StrictMode

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState({ loading: false, ok: false, msg: "Token faltante." });
      return;
    }

    (async () => {
      const result = await confirmEmail(token);
      setState({ loading: false, ok: result.ok, msg: result.message });

      // opcional: quitamos el token de la URL para evitar reintentos en refresh
      if (result.ok) {
        const sp = new URLSearchParams(searchParams);
        sp.delete("token");
        setSearchParams(sp, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 👈 intencionalmente vacío: queremos ejecutarlo una sola vez

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: COLORS.plainBg,
        color: COLORS.whiteSmoke,
        display: "grid",
        placeItems: "center",
        px: { xs: 2.5, md: 4 },
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 3,
          bgcolor: alpha(COLORS.graphite, 0.6),
          border: `1px solid ${alpha(COLORS.silverLight, 0.14)}`,
          boxShadow: `0 24px 48px rgba(0,0,0,.55)`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            {state.loading ? (
              <>
                <CircularProgress size={40} />
                <Typography>Verificando tu email...</Typography>
              </>
            ) : state.ok ? (
              <>
                <MarkEmailReadRoundedIcon
                  sx={{ fontSize: 48, color: COLORS.silverLight }}
                />
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  ¡Listo! Email confirmado
                </Typography>
                <Typography sx={{ color: COLORS.silverLight }}>
                  Ya podés iniciar sesión con tu cuenta.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 2,
                    }}
                  >
                    Ir a iniciar sesión
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 2,
                    }}
                  >
                    Volver al inicio
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <ErrorOutlineRoundedIcon
                  sx={{ fontSize: 48, color: "#ef4444" }}
                />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  No pudimos confirmar tu email
                </Typography>
                {state.msg && (
                  <Alert
                    severity="error"
                    sx={{ width: "100%", maxWidth: 520, textAlign: "left" }}
                  >
                    {state.msg}
                  </Alert>
                )}
                <Typography sx={{ color: COLORS.silverLight }}>
                  Revisá que el enlace no haya expirado o ya haya sido usado.
                </Typography>
                <MUILink
                  component={RouterLink}
                  to="/register"
                  underline="hover"
                  sx={{ color: COLORS.silverLight }}
                >
                  Volver al registro
                </MUILink>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
