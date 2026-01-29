// src/components/admin/sections/settingsSection/ClientsDbImportCard.jsx
import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Alert,
  LinearProgress,
  Chip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import BlockingOverlay from "./BlockingOverlay"; // ✅ nuevo archivo

function fileLabel(f) {
  if (!f) return "—";
  const mb = (f.size / (1024 * 1024)).toFixed(2);
  return `${f.name} (${mb} MB)`;
}

function isExcelFile(file) {
  const name = String(file?.name || "").toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}

export default function ClientsDbImportCard({ importClientsDbXlsx }) {
  const [clientes, setClientes] = React.useState(null);
  const [grupos, setGrupos] = React.useState(null);
  const [nacion, setNacion] = React.useState(null);

  const [replace, setReplace] = React.useState(false);
  const [stopOnError, setStopOnError] = React.useState(true);

  const [uploadPct, setUploadPct] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [phase, setPhase] = React.useState("idle"); // idle | upload | server

  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  const canRun = !!(clientes && grupos && nacion) && !busy;

  const validate = (f) => {
    if (!f) return "";
    if (!isExcelFile(f)) return "Solo .xls/.xlsx";
    return "";
  };

  const clientsErr = validate(clientes);
  const gruposErr = validate(grupos);
  const nacionErr = validate(nacion);
  const hasValidationError = !!(clientsErr || gruposErr || nacionErr);

  const reset = () => {
    setClientes(null);
    setGrupos(null);
    setNacion(null);
    setReplace(false);
    setStopOnError(true);
    setUploadPct(0);
    setBusy(false);
    setPhase("idle");
    setResult(null);
    setError("");
  };

  const runImport = async () => {
    setBusy(true);
    setPhase("upload");
    setError("");
    setResult(null);
    setUploadPct(0);

    try {
      const resp = await importClientsDbXlsx({
        clientes,
        grupos,
        nacion,
        replace,
        stopOnError,
        onProgress: (p) => {
          const pct = Number(p || 0);
          setUploadPct(pct);

          // cuando llega a 100, ya subió: cambia a fase server (indeterminado)
          if (pct >= 100) setPhase("server");
        },
      });

      // ✅ axios response => usamos data
      const data = resp?.data ?? resp;

      if (data?.ok === false) {
        setError(data?.message || "Error importando");
      }
      setResult(data);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Error importando XLSX";
      setError(msg);
    } finally {
      setBusy(false);
      setPhase("idle");
      setUploadPct(0);
    }
  };

  const overlayTitle =
    phase === "upload" ? "Subiendo archivos…" : "Importando base de clientes…";
  const overlaySubtitle =
    phase === "upload"
      ? "No cierres esta página hasta que termine la subida."
      : "Esto puede tardar varios minutos. No salgas de aquí.";

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
      {/* ✅ Overlay bloqueante (fuera del layout, sin duplicar imports) */}
      <BlockingOverlay
        open={busy}
        title={overlayTitle}
        subtitle={overlaySubtitle}
        progress={phase === "upload" ? uploadPct : null}
      />

      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <UploadFileIcon />
          <Typography variant="h6" fontWeight={800}>
            Importar base de clientes (3 XLSX)
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            variant="outlined"
            label={replace ? "Modo: replace" : "Modo: merge"}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Subí los 3 archivos: <b>clientes</b>, <b>grupos</b> y <b>nación</b>.
          El import crea/actualiza por <code>{`{idCliente, integrante}`}</code>.
        </Typography>

        <Divider />

        {/* Selectores */}
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={busy}
            >
              Clientes (.xls/.xlsx)
              <input
                hidden
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setClientes(e.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2">{fileLabel(clientes)}</Typography>
            {clientsErr ? (
              <Chip size="small" color="error" label={clientsErr} />
            ) : null}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={busy}
            >
              Grupos (.xls/.xlsx)
              <input
                hidden
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setGrupos(e.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2">{fileLabel(grupos)}</Typography>
            {gruposErr ? (
              <Chip size="small" color="error" label={gruposErr} />
            ) : null}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={busy}
            >
              Nación (.xls/.xlsx)
              <input
                hidden
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setNacion(e.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2">{fileLabel(nacion)}</Typography>
            {nacionErr ? (
              <Chip size="small" color="error" label={nacionErr} />
            ) : null}
          </Stack>
        </Stack>

        {/* Opciones */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
                disabled={busy}
              />
            }
            label="Replace (soft-baja previos + desactivar faltantes)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={stopOnError}
                onChange={(e) => setStopOnError(e.target.checked)}
                disabled={busy}
              />
            }
            label="Stop on error"
          />
        </Stack>

        {/* Barra inline (opcional) */}
        {busy ? (
          <Box>
            <LinearProgress
              variant={phase === "upload" ? "determinate" : "indeterminate"}
              value={phase === "upload" ? uploadPct : undefined}
            />
            <Typography variant="caption" color="text.secondary">
              {phase === "upload"
                ? `Subiendo… ${uploadPct}%`
                : "Procesando… no cierres esta página"}
            </Typography>
          </Box>
        ) : null}

        {/* Acciones */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            onClick={reset}
            variant="outlined"
            startIcon={<RestartAltIcon />}
            disabled={busy}
          >
            Limpiar
          </Button>

          <Button
            onClick={runImport}
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={!canRun || hasValidationError}
          >
            Importar
          </Button>
        </Stack>

        {/* Resultado */}
        {error ? (
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        ) : null}

        {result ? (
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={800}>
                Resultado
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {result.summary || result.message || "OK"}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`Docs: ${result.totalDocs ?? "—"}`} />
                <Chip
                  size="small"
                  label={`Procesados: ${result.processed ?? "—"}`}
                />
                <Chip
                  size="small"
                  label={`Upserted: ${result.mongo?.upsertedCount ?? "—"}`}
                />
                <Chip
                  size="small"
                  label={`Modified: ${result.mongo?.modifiedCount ?? "—"}`}
                />
                <Chip
                  size="small"
                  label={`Soft-bajas: ${result.softDeactivatedMissing ?? "—"}`}
                />
                <Chip
                  size="small"
                  color={result.counts?.warnings ? "warning" : "default"}
                  label={`Warnings: ${result.counts?.warnings ?? 0}`}
                />
                <Chip
                  size="small"
                  color={result.counts?.errors ? "error" : "default"}
                  label={`Errors: ${result.counts?.errors ?? 0}`}
                />
              </Stack>

              {Array.isArray(result.warnings) && result.warnings.length ? (
                <Alert severity="warning" variant="outlined">
                  Warnings (primeros 3):{" "}
                  {result.warnings.slice(0, 3).map((w, i) => (
                    <span key={i}>
                      {w.reason || JSON.stringify(w)}
                      {i < 2 ? " · " : ""}
                    </span>
                  ))}
                </Alert>
              ) : null}

              {Array.isArray(result.errors) && result.errors.length ? (
                <Alert severity="error" variant="outlined">
                  Errors (primeros 3):{" "}
                  {result.errors.slice(0, 3).map((e, i) => (
                    <span key={i}>
                      {e.reason || JSON.stringify(e)}
                      {i < 2 ? " · " : ""}
                    </span>
                  ))}
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        {hasValidationError ? (
          <Alert severity="warning" variant="outlined">
            Corregí los archivos: {clientsErr || gruposErr || nacionErr}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
