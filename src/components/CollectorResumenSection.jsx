 // src/components/CollectorResumenSection.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Skeleton,
  Alert,
  Stack,
  LinearProgress,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaidIcon from "@mui/icons-material/Paid";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { getCollectorSummary } from "../api/collector";

// Helper local para pesos
const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—"; 

const fmtInt = (n) =>
  typeof n === "number" && Number.isFinite(n) ? Math.round(n) : "—";

export default function CollectorResumenSection() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const resp = await getCollectorSummary();
        const root = resp?.data ?? resp ?? {};
        const data = root.data || root;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) {
          setErr(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudo cargar el resumen del cobrador."
          );
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Derivados cómodos
  const assigned = stats?.month?.assignedClients ?? null;
  const clientsWithPayment = stats?.month?.clientsWithPayment ?? null;
  const clientsWithoutPayment =
    assigned != null && clientsWithPayment != null
      ? Math.max(assigned - clientsWithPayment, 0)
      : null;

  // ✅ ahora usamos días de calendario, no días hábiles
  const daysTotal = stats?.month?.daysInPeriod ?? null;
  const daysElapsed = stats?.month?.daysElapsed ?? null;
  const daysRemaining = stats?.month?.daysRemaining ?? null;

  const collectorBalance = stats?.balance?.collectorBalance ?? 0;

  const expectedCommission =
    stats?.commissions?.amounts?.expectedCommission ?? null;
  const currentCommission =
    stats?.commissions?.amounts?.totalCommission ?? null;
  const graceDays = stats?.commissions?.config?.graceDays ?? null;

  const remainingClients =
    assigned != null && clientsWithPayment != null
      ? Math.max(assigned - clientsWithPayment, 0)
      : null;

  const requiredPerDay =
    remainingClients != null && daysRemaining != null && daysRemaining > 0
      ? remainingClients / daysRemaining
      : null;

  const periodLabel = stats?.month?.label || "Período actual";

  // ✅ Progreso: prioridad clientes; fallback días
  const clientProgressPercent =
    assigned && clientsWithPayment != null && assigned > 0
      ? Math.min(100, (clientsWithPayment / assigned) * 100)
      : null;

  const daysProgressPercent =
    daysTotal && daysElapsed
      ? Math.min(100, (daysElapsed / daysTotal) * 100)
      : 0;

  const progressPercent =
    clientProgressPercent != null ? clientProgressPercent : daysProgressPercent;

  // Cards KPI principales con iconos y colores (versión compacta)
  const kpiCards = [
    {
      key: "assigned",
      title: "Clientes asignados",
      value: assigned,
      format: fmtInt,
      icon: <PeopleAltIcon fontSize="small" />,
      color: "primary",
    },
    {
      key: "collected",
      title: "Cobrados este período",
      value: clientsWithPayment,
      format: fmtInt,
      icon: <CheckCircleIcon fontSize="small" />,
      color: "success",
    },
    {
      key: "pending",
      title: "Sin cobrar este período",
      value: clientsWithoutPayment,
      format: fmtInt,
      icon: <PendingActionsIcon fontSize="small" />,
      color: "warning",
    },
    {
      key: "balance",
      title: "Saldo en mano",
      value: collectorBalance,
      format: (v) => fmtMoney(Number(v || 0)),
      icon: <AccountBalanceWalletIcon fontSize="small" />,
      color: "info",
    },
  ];

  const getColorPalette = (colorKey) => {
    const palette = theme.palette[colorKey] || theme.palette.primary;
    return {
      main: palette.main,
      light: palette.light || alpha(palette.main, 0.12),
      dark: palette.dark || palette.main,
    };
  };

  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      {/* HEADER */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }}
        >
          Resumen del cobrador
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {loading ? <Skeleton width={140} /> : periodLabel}
        </Typography>
      </Box>

      {err && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {/* KPIs PRINCIPALES – GRID COMPACTO (MOBILE FIRST) */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {kpiCards.map((card) => {
          const palette = getColorPalette(card.color);
          const rawValue = stats ? card.value : null;
          const displayValue =
            stats && rawValue != null ? card.format(rawValue) : "—";

          return (
            <Grid key={card.key} item xs={6} sm={3}>
              <Paper
                elevation={1}
                sx={{
                  borderRadius: 2,
                  p: 1.25,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  minHeight: 72,
                  bgcolor:
                    theme.palette.mode === "light"
                      ? alpha(palette.main, 0.04)
                      : alpha(palette.main, 0.14),
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500, lineHeight: 1.2 }}
                  >
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor:
                        theme.palette.mode === "light"
                          ? alpha(palette.main, 0.16)
                          : alpha(palette.main, 0.28),
                      color: palette.dark,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>

                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    fontSize: "1.05rem",
                    mt: 0.25,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {loading ? (
                    <Skeleton
                      variant="text"
                      width={60}
                      sx={{ fontSize: "1.05rem" }}
                    />
                  ) : (
                    displayValue
                  )}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* PROGRESO DEL PERÍODO + OBJETIVO */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          mb: 3,
          bgcolor:
            theme.palette.mode === "light"
              ? alpha(theme.palette.info.main, 0.04)
              : alpha(theme.palette.info.main, 0.18),
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                bgcolor:
                  theme.palette.mode === "light"
                    ? alpha(theme.palette.info.main, 0.18)
                    : alpha(theme.palette.info.main, 0.3),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.info.dark,
                flexShrink: 0,
              }}
            >
              <ScheduleIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Progreso del período
            </Typography>
          </Stack>

          {loading ? (
            <>
              <Skeleton width={220} />
              <Skeleton variant="rectangular" height={8} />
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                {assigned != null && clientsWithPayment != null ? (
                  <>
                    Tenés{" "}
                    <strong>
                      {fmtInt(clientsWithPayment)} de {fmtInt(assigned)} cliente
                      (s)
                    </strong>{" "}
                    cobrados en este período.
                  </>
                ) : daysTotal != null && daysElapsed != null ? (
                  <>
                    Llevás{" "}
                    <strong>
                      {fmtInt(daysElapsed)} día(s) de {fmtInt(daysTotal)}
                    </strong>{" "}
                    del período.
                  </>
                ) : (
                  "Aún no se pudo calcular el resumen del período."
                )}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 8,
                  borderRadius: 999,
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Avance del período ({fmtInt(progressPercent)}%)
              </Typography>
            </>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight={700}>
            Objetivo diario de cobro
          </Typography>

          {loading ? (
            <Skeleton width={260} />
          ) : remainingClients != null && requiredPerDay != null ? (
            <Typography variant="body2" color="text.secondary">
              Te faltan <strong>{fmtInt(remainingClients)} cliente(s)</strong>{" "}
              por cobrar. Para llegar a todos en término, deberías cobrar
              aproximadamente{" "}
              <strong>{requiredPerDay.toFixed(1)} cliente(s) por día</strong> en
              los días que quedan.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No se pudo calcular aún cuántos clientes por día necesitás.
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* GANANCIAS */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              height: "100%",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  bgcolor:
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.success.main, 0.18)
                      : alpha(theme.palette.success.main, 0.3),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.success.dark,
                }}
              >
                <TrendingUpIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Ganancia esperada
              </Typography>
            </Stack>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }}
            >
              {loading ? (
                <Skeleton width={120} />
              ) : expectedCommission != null ? (
                fmtMoney(expectedCommission)
              ) : (
                "—"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Monto estimado si cobrás toda tu cartera dentro de los plazos
              ideales.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              height: "100%",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  bgcolor:
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.warning.main, 0.18)
                      : alpha(theme.palette.warning.main, 0.3),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.warning.dark,
                }}
              >
                <PaidIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Ganancia actual
              </Typography>
            </Stack>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" } }}
            >
              {loading ? (
                <Skeleton width={120} />
              ) : currentCommission != null ? (
                fmtMoney(currentCommission)
              ) : (
                "—"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Lo que llevás generado hasta hoy con los cobros efectivos del
              período.
            </Typography>

            {!loading && graceDays != null && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tu comisión empieza a ajustarse después de{" "}
                <strong>{graceDays} día(s)</strong> de tener el dinero en mano.
                Cobrar antes de ese plazo te deja más cerca de la{" "}
                <strong>ganancia esperada</strong>.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
        Próximamente: KPIs de ruta, efectividad de cobro, ranking entre
        cobradores, etc.
      </Typography>
    </Box>
  );
}
