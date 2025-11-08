import React from "react";
import {
  Box,
  CircularProgress,
  Divider,
  Alert,
  Button,
  Paper,
  Typography,
  Stack,
  Grid,
  Chip,
  TextField,
  MenuItem,
  Tooltip,
  IconButton,
  Collapse,
  Skeleton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import { useClients } from "../../context/ClientsContext";
import Header from "./sections/Header";
import SummaryPanel from "./sections/SummaryPanel";
import ChartsSection from "./sections/ChartsSection";

/* ============================ helpers UI/State ============================ */

const METHOD_OPTS = [
  { value: "", label: "Todos los métodos" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "qr", label: "QR" },
  { value: "otro", label: "Otro" },
];

const CHANNEL_OPTS = [
  { value: "", label: "Todos los canales" },
  { value: "field", label: "Campo" },
  { value: "backoffice", label: "Backoffice" },
  { value: "portal", label: "Portal" },
  { value: "api", label: "API" },
];

function useQueryState(initial = {}) {
  const [q, setQ] = React.useState(() => {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    return {
      period: params.get("period") || initial.period || "",
      idCobrador: params.get("idCobrador") || initial.idCobrador || "",
      method: params.get("method") || initial.method || "",
      channel: params.get("channel") || initial.channel || "",
      // único selector de base
      dueMode: params.get("dueMode") || initial.dueMode || "ideal", // ideal | cuota | real
    };
  });

  const update = React.useCallback((patch) => {
    setQ((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        Object.entries(next).forEach(([k, v]) => {
          if (v == null || v === "") url.searchParams.delete(k);
          else url.searchParams.set(k, v);
        });
        window.history.replaceState({}, "", url.toString());
      }
      return next;
    });
  }, []);

  return [q, update];
}

/** Mapea backend viejo -> forma mínima que consume SummaryPanel (retrocompatible) */
function normalizeSummary(stats) {
  const legacy = {
    groups: 0,
    sumCuota: 0,
    sumIdeal: 0,
    sumVigente: 0,
    sumDiff: 0,
    posCount: 0,
    negCount: 0,
    posSum: 0,
    negSum: 0,
    avgCuota: 0,
    avgIntegrantes: 0,
    posPct: 0,
    // ⬇️ agrego estructura por si no viene
    grupos: { paid: 0, partial: 0, unpaid: 0 },
  };
  if (!stats) return legacy;

  // Aceptar summary nuevo si es razonable (igual luego lo saneamos)
  const s = stats?.data?.summary || stats?.summary || {};
  const cov = stats?.coverage || []; // lista por grupo: { groupId, due, paid, gap, ... }

  // Totales base
  const grupos = Number(s.totalGrupos ?? 0);
  const totalDebido = Number(s.totalDebido ?? 0);
  const totalPagadoPeriodo = Number(s.totalPagadoPeriodo ?? 0);

  // Δ y agregados
  const diff = Number((totalPagadoPeriodo - totalDebido).toFixed(2));
  const pos = cov.filter((x) => Number(x?.gap ?? 0) >= 0);
  const neg = cov.filter((x) => Number(x?.gap ?? 0) < 0);
  const posSum = pos.reduce((a, b) => a + Number(b?.gap || 0), 0);
  const negSum = neg.reduce((a, b) => a + Math.abs(Number(b?.gap || 0)), 0);

  // Derivar contadores confiables desde coverage si hay data
  let paid = 0,
    partial = 0,
    unpaid = 0;
  if (Array.isArray(cov) && cov.length) {
    for (const g of cov) {
      const due = Math.max(0, Number(g?.due ?? 0));
      const paidAmt = Math.max(0, Number(g?.paid ?? 0));
      if (paidAmt >= due && due > 0) paid++;
      else if (paidAmt > 0 && paidAmt < due) partial++;
      else if (due > 0 && paidAmt === 0) unpaid++;
    }
  }

  // Tomar lo que venga del backend si es sano; si no, usar derivados
  const bePaid = Number(s?.grupos?.paid ?? 0);
  const bePartial = Number(s?.grupos?.partial ?? 0);
  const beUnpaid = Number(s?.grupos?.unpaid ?? 0);
  const beLooksWeird =
    bePaid > grupos ||
    bePartial > grupos ||
    beUnpaid > grupos ||
    bePaid + bePartial + beUnpaid > grupos;

  const gruposCounts = beLooksWeird
    ? { paid, partial, unpaid }
    : {
        paid: bePaid || paid,
        partial: bePartial || partial,
        unpaid: beUnpaid || unpaid,
      };

  return {
    ...legacy,
    ...s, // mantené lo que ya exista (posible revenue, adoption, etc.)
    groups: grupos,
    sumCuota: Number(s.sumCuota ?? totalDebido),
    sumVigente: Number(s.sumVigente ?? totalPagadoPeriodo),
    sumDiff: Number(s.sumDiff ?? diff),
    posCount: Number(s.posCount ?? pos.length),
    negCount: Number(s.negCount ?? neg.length),
    posSum: Number((s.posSum ?? posSum).toFixed?.(2) ?? posSum),
    negSum: Number((s.negSum ?? negSum).toFixed?.(2) ?? negSum),
    avgCuota: Number(
      s.avgCuota ?? (grupos ? Number((totalDebido / grupos).toFixed(2)) : 0)
    ),
    posPct: Number(
      s.posPct ??
        (totalDebido > 0
          ? ((totalPagadoPeriodo / totalDebido) * 100).toFixed(2)
          : 0)
    ),
    grupos: gruposCounts,
  };
}

/* =============================== Filtros UI =============================== */

function FiltersBar({ q, onChange, loading, onApply }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.6)}`,
        bgcolor: (t) => alpha(t.palette.background.paper, 0.6),
        backdropFilter: "blur(4px)",
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Período (YYYY-MM)"
            value={q.period}
            onChange={(e) => onChange({ period: e.target.value.trim() })}
            placeholder="2025-11"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <TuneRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              ),
            }}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            label="ID Cobrador"
            value={q.idCobrador}
            onChange={(e) =>
              onChange({ idCobrador: e.target.value.replace(/\D/g, "") })
            }
            size="small"
            fullWidth
            placeholder="ej: 4"
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            select
            label="Método"
            value={q.method}
            onChange={(e) => onChange({ method: e.target.value })}
            size="small"
            fullWidth
          >
            {METHOD_OPTS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            select
            label="Canal"
            value={q.channel}
            onChange={(e) => onChange({ channel: e.target.value })}
            size="small"
            fullWidth
          >
            {CHANNEL_OPTS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Base (dueMode) */}
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            select
            label="Base"
            value={q.dueMode}
            onChange={(e) => onChange({ dueMode: e.target.value })}
            size="small"
            fullWidth
          >
            <MenuItem value="ideal">Ideal</MenuItem>
            <MenuItem value="cuota">Cuota</MenuItem>
            <MenuItem value="real">Real</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm md>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Tooltip title="Aplicar filtros">
              <span>
                <Button
                  onClick={onApply}
                  variant="contained"
                  size="small"
                  startIcon={<RefreshIcon />}
                  disabled={loading || !q.period}
                >
                  Actualizar
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}

/* =============================== Main Component =============================== */

export default function ClientesStats() {
  const { stats, loadingStats, fetchStats, err } = useClients();
  const [localErr, setLocalErr] = React.useState("");
  const [q, setQ] = useQueryState({
    period: "",
    idCobrador: "",
    method: "",
    channel: "",
    dueMode: "ideal",
  });

  const [debugOpen, setDebugOpen] = React.useState(
    typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debugStats") === "1"
  );

  const reload = React.useCallback(async () => {
    setLocalErr("");
    try {
      await fetchStats({
        period: q.period || undefined,
        idCobrador: q.idCobrador || undefined,
        method: q.method || undefined,
        channel: q.channel || undefined,
        // único parámetro nuevo
        dueMode: q.dueMode || undefined,
      });
    } catch (e) {
      setLocalErr(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudieron cargar las estadísticas"
      );
    }
  }, [fetchStats, q]);

  React.useEffect(() => {
    if (!stats && !loadingStats) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = React.useMemo(() => normalizeSummary(stats), [stats]);

  const exportJson = React.useCallback(() => {
    const blob = new Blob([JSON.stringify(stats || {}, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const periodSafe = q.period || "stats";
    a.href = url;
    a.download = `clientes-stats-${periodSafe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [stats, q.period]);

  const hasError = Boolean(localErr || err);

  // generatedAt si viene del backend nuevo
  const generatedAt =
    stats?.meta?.generatedAt || stats?.data?.meta?.generatedAt || undefined;

  return (
    <Box>
      <Header
        loading={loadingStats}
        onReload={reload}
        period={q.period}
        updatedAt={generatedAt}
        // controles del Header (sin dueMember)
        dueMode={q.dueMode}
        onChangeDueMode={(v) => setQ({ dueMode: v })}
        summary={summary}
      />

      {/* Filtros */}
      <FiltersBar
        q={q}
        onChange={setQ}
        loading={loadingStats}
        onApply={reload}
      />

      {/* Errores */}
      {hasError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String(localErr || err)}
        </Alert>
      ) : null}

      {/* Summary con skeleton en primera carga */}
      <Box sx={{ mb: 2 }}>
        {loadingStats && !stats ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.6)}`,
            }}
          >
            <Grid container spacing={2}>
              {[...Array(4)].map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={92} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        ) : (
          <SummaryPanel summary={summary} />
        )}
      </Box>

      {/* Chips de contexto + acciones */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Chip
          label={`Período: ${q.period || "—"}`}
          size="small"
          variant="outlined"
        />
        {q.idCobrador ? (
          <Chip
            label={`Cobrador #${q.idCobrador}`}
            size="small"
            variant="outlined"
          />
        ) : null}
        {q.method ? <Chip label={`Método: ${q.method}`} size="small" /> : null}
        {q.channel ? <Chip label={`Canal: ${q.channel}`} size="small" /> : null}
        <Chip label={`Base: ${q.dueMode}`} size="small" variant="outlined" />

        <Box flex={1} />
        <Tooltip title="Exportar JSON de estadísticas">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadRoundedIcon />}
              onClick={exportJson}
              disabled={!stats}
            >
              Exportar
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Ver payload (debug)">
          <IconButton onClick={() => setDebugOpen((v) => !v)}>
            <BugReportOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Charts (solo dueMode para consistencia) */}
      {loadingStats && !stats ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="20vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <ChartsSection stats={stats} dueMode={q.dueMode} />
      )}

      <Divider sx={{ my: 3 }} />

      {/* Debug colapsable (o ?debugStats=1 en query) */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 2,
          border: "1px dashed #bbb",
          bgcolor: "#fafafa",
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, py: 1 }}
          spacing={1}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            Debug /clientes/stats (raw)
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={debugOpen ? "Visible" : "Oculto"}
          />
          <Box flex={1} />
          <IconButton onClick={() => setDebugOpen((v) => !v)}>
            <ExpandMoreRoundedIcon
              sx={{
                transform: `rotate(${debugOpen ? 180 : 0}deg)`,
                transition: "transform 200ms ease",
              }}
            />
          </IconButton>
        </Stack>

        <Collapse in={debugOpen} timeout="auto" unmountOnExit>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: "#0b1020",
              color: "#d6e2ff",
              borderTop: "1px dashed #bbb",
              fontSize: 12,
              overflow: "auto",
              maxHeight: 360,
            }}
          >
            {JSON.stringify(stats, null, 2)}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
