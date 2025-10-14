import React from "react";
import {
  Box,
  Stack,
  Chip,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Tooltip as MuiTooltip,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ChartCard from "../atoms/ChartCard";
import { labelForBucket } from "../atoms/formatters";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Legend,
  Brush,
  Cell, // 👈 IMPORTANTE: en mayúsculas
  ReferenceLine,
} from "recharts";

/* ====== helpers ====== */
const NEGATIVE = "#2E7D32"; // verde
const NEUTRAL = "#4F46E5"; // índigo
const POSITIVE = "#D32F2F"; // rojo
const GRID = "rgba(0,0,0,0.06)";

const colorForLabel = (label) => {
  const s = String(label || "");
  if (s.includes("-") && !s.includes("0 a")) return NEGATIVE; // rangos negativos
  if (s.startsWith("0 a")) return NEUTRAL; // bin en torno a cero
  return POSITIVE; // resto a la derecha
};

const preprocess = (raw) =>
  (Array.isArray(raw) ? raw : []).map((b) => ({
    id: b._id,
    label: labelForBucket(b._id),
    count: Number(b.count || 0),
  }));

const toCSV = (rows) => {
  const headers = ["label", "count", "value", "mode", "cumulative"];
  const esc = (s) => `"${String(s ?? "").replaceAll('"', '""')}"`;
  const body = rows
    .map((r) => headers.map((k) => esc(r[k])).join(","))
    .join("\n");
  return `${headers.join(",")}\n${body}`;
};

const download = (name, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ====== tooltip ====== */
function CustomTooltip({ active, payload, label, mode, cumulative }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const value = Number(p?.value ?? p?.payload?.value ?? 0);
  const count = Number(p?.payload?.count ?? 0);
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: "#0b1020",
        color: "#e8ecff",
        border: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        Rango
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2">
        Valor:{" "}
        <strong>
          {mode === "percent"
            ? `${value.toFixed(2)} %`
            : value.toLocaleString("es-AR")}
        </strong>
      </Typography>
      <Typography variant="body2">
        Conteo: <strong>{count.toLocaleString("es-AR")}</strong>
      </Typography>
      {cumulative && (
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          * Acumulado
        </Typography>
      )}
    </Box>
  );
}

/* ====== componente ====== */
export default function DiffHistogramChart({
  data = [],
  scopeLabel = "Todos los activos",
}) {
  const buckets = React.useMemo(() => preprocess(data), [data]);
  const total = React.useMemo(
    () => buckets.reduce((a, d) => a + d.count, 0),
    [buckets]
  );

  // UI: conteo/% y acumulado
  const [mode, setMode] = React.useState("count"); // "count" | "percent"
  const [cumulative, setCumulative] = React.useState(false);

  // Zoom con brush (índices)
  const [range, setRange] = React.useState([
    0,
    Math.max(0, buckets.length - 1),
  ]);

  // serie derivada
  const series = React.useMemo(() => {
    const base = buckets.map((d) => ({
      ...d,
      value:
        mode === "percent" ? (total ? (d.count / total) * 100 : 0) : d.count,
    }));
    if (!cumulative) return base;
    let acc = 0;
    return base.map((d) => ({ ...d, value: (acc += d.value) }));
  }, [buckets, total, mode, cumulative]);

  // recorte visual por brush
  const sliced = React.useMemo(() => {
    const [i1, i2] = range;
    const lo = Math.max(0, Math.min(i1, i2));
    const hi = Math.max(i1, i2);
    return series.slice(lo, hi + 1);
  }, [series, range]);

  const empty = !buckets.length || total === 0;

  const exportCSV = () => {
    const rows = series.map((r) => ({
      label: r.label,
      count: r.count,
      value: r.value,
      mode,
      cumulative,
    }));
    download(
      `histograma_${mode}${cumulative ? "_acumulado" : ""}.csv`,
      toCSV(rows)
    );
  };

  return (
    <ChartCard
      title="Distribución de Δ (Ideal − Cobro)"
      subtitle="Cuántos grupos caen en cada rango de diferencia. Barras a la derecha sugieren subfacturación."
      right={<Chip size="small" label={scopeLabel} />}
    >
      {/* Controles */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={mode === "percent"}
              onChange={(e) => setMode(e.target.checked ? "percent" : "count")}
            />
          }
          label="Mostrar en %"
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={cumulative}
              onChange={(e) => setCumulative(e.target.checked)}
            />
          }
          label="Acumulado"
        />
        <Box sx={{ flex: 1 }} />
        <MuiTooltip title={empty ? "No hay datos" : "Exportar CSV"}>
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={exportCSV}
              disabled={empty}
            >
              CSV
            </Button>
          </span>
        </MuiTooltip>
      </Stack>

      {/* Chart */}
      {/* 👇 Aseguramos altura explícita para ResponsiveContainer */}
      <Box sx={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sliced}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              tick={{ fontSize: 12 }}
              height={50}
              tickMargin={8}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 6 }}
              payload={[
                { value: "Rango negativo", type: "square", color: NEGATIVE },
                { value: "Neutro", type: "square", color: NEUTRAL },
                { value: "Rango positivo", type: "square", color: POSITIVE },
              ]}
            />
            <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
            <RTooltip
              wrapperStyle={{ outline: "none" }}
              content={<CustomTooltip mode={mode} cumulative={cumulative} />}
            />

            {/* ✅ SOLO UN <Bar> y celdas en MAYÚSCULA */}
            <Bar
              dataKey="value"
              name={mode === "percent" ? "Porcentaje" : "Conteo"}
            >
              {sliced.map((s, i) => (
                <Cell key={i} fill={colorForLabel(s.label)} />
              ))}
            </Bar>

            {/* Brush para elegir rangos de bins */}
            <Brush
              dataKey="label"
              height={20}
              travellerWidth={8}
              onChange={(e) => {
                if (!e) return;
                const {
                  startIndex = 0,
                  endIndex = Math.max(0, buckets.length - 1),
                } = e;
                setRange([startIndex, endIndex]);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Nota */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        Tip: activá “%” para comparar distribuciones aunque cambie el tamaño del
        padrón.
      </Typography>
    </ChartCard>
  );
}
