// src/components/admin/sections/settingsSection/BulkOperationsCard.jsx
import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";

import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";

import {
  repriceAll,
  getRepriceProgress,
  increasePercent as increasePercentApi,
} from "../../../../api/adminPricing";

import { fmtEta, toNumber } from "./constants";

export default function BulkOperationsCard({ onSnack }) {
  const notify = React.useCallback(
    (type, msg) => {
      if (typeof onSnack === "function") onSnack(type, msg);
    },
    [onSnack]
  );

  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [pctRunning, setPctRunning] = React.useState(false);
  const [bulkMsg, setBulkMsg] = React.useState("");

  const [pctForm, setPctForm] = React.useState({
    percent: 10,
    applyToIdeal: true,
    applyToHistorical: false,
  });

  const [progress, setProgress] = React.useState(null);
  const [progressErr, setProgressErr] = React.useState("");

  const fetchProgress = React.useCallback(async () => {
    try {
      setProgressErr("");
      const { data } = await getRepriceProgress();
      setProgress(data);
      return data;
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo obtener el progreso";
      setProgressErr(m);
      return null;
    }
  }, []);

  // polling cuando hay tareas corriendo
  React.useEffect(() => {
    let alive = true;
    let id = null;

    const shouldPoll =
      bulkRunning || pctRunning || (!!progress && progress?.running);

    async function tick() {
      if (!alive) return;
      await fetchProgress();
    }

    if (shouldPoll) {
      tick();
      id = setInterval(tick, 700);
    }

    return () => {
      alive = false;
      if (id) clearInterval(id);
    };
  }, [bulkRunning, pctRunning, progress?.running, fetchProgress]);

  const handleRepriceAll = async () => {
    try {
      setBulkRunning(true);
      setBulkMsg("Iniciando reproceso de precios para todos los grupos…");
      await fetchProgress();

      const { data } = await repriceAll();
      const summary = [
        `Total grupos: ${data?.total ?? "—"}`,
        `Procesados: ${data?.procesados ?? "—"}`,
        `Actualizados: ${data?.modifiedTotal ?? "—"}`,
        `Errores: ${data?.errores ?? 0}`,
      ].join(" · ");

      setBulkMsg(`Finalizado. ${summary}`);
      notify(data?.ok === false ? "warning" : "success", `Reprice: ${summary}`);
      await fetchProgress();
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo iniciar el reproceso global";
      setBulkMsg(m);
      notify("error", m);
    } finally {
      setBulkRunning(false);
    }
  };

  const handleIncreasePercent = async () => {
    try {
      const p = Number(pctForm.percent);
      if (!Number.isFinite(p) || p === 0) throw new Error("percent inválido");
      if (!pctForm.applyToIdeal && !pctForm.applyToHistorical) {
        throw new Error("Seleccioná al menos un tipo de precio");
      }

      setPctRunning(true);
      setBulkMsg(`Aplicando aumento del ${p}%…`);
      await fetchProgress();

      const { data } = await increasePercentApi({
        percent: p,
        applyToIdeal: !!pctForm.applyToIdeal,
        applyToHistorical: !!pctForm.applyToHistorical,
      });

      const summary = [
        `Grupos: ${data?.totalGrupos ?? data?.total ?? "—"}`,
        `Procesados: ${data?.procesados ?? "—"}`,
        `Ideal mod: ${data?.modifiedIdeal ?? "—"}`,
        `Hist mod: ${data?.modifiedHistorical ?? "—"}`,
        `Errores: ${data?.errores ?? 0}`,
      ].join(" · ");

      setBulkMsg(`Finalizado. ${summary}`);
      notify(data?.ok === false ? "warning" : "success", `Aumento: ${summary}`);
      await fetchProgress();
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo aplicar el aumento porcentual";
      notify("error", m);
    } finally {
      setPctRunning(false);
    }
  };

  const progressPct = Math.max(
    0,
    Math.min(100, Number(progress?.percent ?? 0))
  );
  const showProgress =
    (progress && Number(progress?.total) > 0) || bulkRunning || pctRunning;

  return (
    <Grid container spacing={2}>
      {/* Progreso */}
      <Grid item xs={12} md={5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1, justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <BoltIcon fontSize="small" />
              <Typography variant="subtitle2">Progreso (backend)</Typography>
            </Stack>

            <Tooltip title="Refrescar progreso">
              <span>
                <IconButton
                  size="small"
                  onClick={fetchProgress}
                  disabled={bulkRunning || pctRunning}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {progressErr ? (
            <Alert severity="warning" variant="outlined" sx={{ mb: 1 }}>
              {progressErr}
            </Alert>
          ) : null}

          {showProgress ? (
            <>
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{ height: 10, borderRadius: 999 }}
                />
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Modo: ${progress?.mode ?? "—"}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Procesados: ${progress?.procesados ?? 0}/${
                    progress?.total ?? 0
                  }`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Modificados: ${progress?.modifiedTotal ?? 0}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Errores: ${progress?.errores ?? 0}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`ETA: ${fmtEta(progress?.etaSec)}`}
                />
                {progress?.finished ? (
                  <Chip size="small" color="success" label="Finalizado" />
                ) : progress?.running ? (
                  <Chip size="small" color="info" label="Corriendo" />
                ) : (
                  <Chip size="small" variant="outlined" label="Idle" />
                )}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sin procesos recientes.
            </Typography>
          )}
        </Paper>
      </Grid>

      {/* Operaciones */}
      <Grid item xs={12} md={7}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BoltIcon fontSize="small" />
            <Typography variant="subtitle2">Operaciones masivas</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Tooltip title="Recalcular 'cuotaIdeal' para TODOS los grupos. Tarea pesada; requiere permisos.">
              <span>
                <Button
                  variant="contained"
                  startIcon={
                    bulkRunning ? (
                      <CircularProgress size={16} />
                    ) : (
                      <BoltIcon />
                    )
                  }
                  onClick={handleRepriceAll}
                  disabled={bulkRunning || pctRunning}
                >
                  {bulkRunning ? "Reprocesando…" : "Repreciar todos"}
                </Button>
              </span>
            </Tooltip>

            <Divider />

            <Typography variant="subtitle2">Aumento porcentual</Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="%"
                  type="number"
                  fullWidth
                  inputProps={{ step: "0.1" }}
                  value={pctForm.percent}
                  onChange={(e) =>
                    setPctForm((p) => ({
                      ...p,
                      percent: toNumber(e.target.value, p.percent),
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!pctForm.applyToIdeal}
                        onChange={(e) =>
                          setPctForm((p) => ({
                            ...p,
                            applyToIdeal: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Aplicar a cuotaIdeal"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!pctForm.applyToHistorical}
                        onChange={(e) =>
                          setPctForm((p) => ({
                            ...p,
                            applyToHistorical: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Aplicar a cuota (histórica)"
                  />
                </FormGroup>
              </Grid>

              <Grid item xs={12}>
                <Tooltip title="Aplica el aumento porcentual sobre los grupos. Se puede seguir el progreso a la izquierda.">
                  <span>
                    <Button
                      variant="contained"
                      startIcon={
                        pctRunning ? (
                          <CircularProgress size={16} />
                        ) : (
                          <BoltIcon />
                        )
                      }
                      onClick={handleIncreasePercent}
                      disabled={pctRunning || bulkRunning}
                    >
                      {pctRunning ? "Aplicando…" : "Aplicar aumento"}
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>

            <Typography
              variant="caption"
              sx={{ display: "block" }}
              color="text.secondary"
            >
              {bulkMsg}
            </Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
