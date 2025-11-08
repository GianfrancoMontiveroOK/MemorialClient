import React from "react";
import {
  Box,
  Stack,
  Button,
  Chip,
  FormControlLabel,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip as MuiTooltip,
  Slider,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import ChartCard from "../atoms/ChartCard";
import { moneyFmt, pctFmt } from "../atoms/formatters";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Cell,
} from "recharts";

const RED = "#d32f2f";
const GREEN = "#2e7d32";
const INDIGO = "#4F46E5";

function toRows(raw) {
  return (Array.isArray(raw) ? raw : []).map((c) => ({
    idCobrador: String(c.idCobrador ?? "—"),
    name: String(c.name ?? `Cobrador ${c.idCobrador ?? "—"}`),
    due: Number(c.due || 0),
    paid: Number(c.paid || 0),
    coverageRate: Number(c.coverageRate || 0), // 0..1
    diffSum: Number(c.diffSum || 0), // = due - paid (faltante)
  }));
}

function toCSV(rows) {
  const headers = [
    "idCobrador",
    "name",
    "due",
    "paid",
    "diffSum",
    "coverageRate",
  ];
  const esc = (s) => `"${String(s ?? "").replaceAll('"', '""')}"`;
  const body = rows.map((r) =>
    [
      r.idCobrador,
      r.name,
      r.due,
      r.paid,
      r.diffSum,
      // exportamos cobertura como 0..100
      (r.coverageRate || 0) * 100,
    ]
      .map(esc)
      .join(",")
  );
  return `${headers.join(",")}\n${body.join("\n")}`;
}

function download(name, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * CobradorDeltaChart (v2)
 * - Soporta métricas: 'gap' (faltante = due-paid), 'due', 'paid', 'coverage'
 * - Orden por valor/alfabético
 * - Filtro "solo faltante positivo"
 */
export default function CobradorDeltaChart({
  data = [],
  scopeLabel = "Todos los activos",
}) {
  const base = React.useMemo(() => toRows(data), [data]);

  // Controles UI
  const [metric, setMetric] = React.useState("gap"); // 'gap' | 'due' | 'paid' | 'coverage'
  const [showOnlyPositiveGap, setShowOnlyPositiveGap] = React.useState(true);
  const [sortKey, setSortKey] = React.useState("value"); // 'value' | 'name' | 'id'
  const [sortDir, setSortDir] = React.useState("desc"); // 'asc' | 'desc'
  const [topN, setTopN] = React.useState(12);

  // Normalizador de valor según métrica
  const valueOf = React.useCallback(
    (r) =>
      metric === "gap"
        ? r.diffSum
        : metric === "due"
        ? r.due
        : metric === "paid"
        ? r.paid
        : (r.coverageRate || 0) * 100, // coverage en %
    [metric]
  );

  // Filtrado + orden
  const filtered = React.useMemo(() => {
    let arr = base;

    if (metric === "gap" && showOnlyPositiveGap) {
      // faltante > 0
      arr = arr.filter((r) => r.diffSum > 0);
    }

    const cmpVal = (a, b) =>
      sortDir === "asc" ? valueOf(a) - valueOf(b) : valueOf(b) - valueOf(a);

    if (sortKey === "value") {
      arr = [...arr].sort(cmpVal);
    } else if (sortKey === "name") {
      arr = [...arr].sort((a, b) =>
        sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else {
      arr = [...arr].sort((a, b) =>
        sortDir === "asc"
          ? a.idCobrador.localeCompare(b.idCobrador)
          : b.idCobrador.localeCompare(a.idCobrador)
      );
    }

    return arr.slice(0, Math.max(1, topN));
  }, [base, metric, showOnlyPositiveGap, sortKey, sortDir, topN, valueOf]);

  const empty = filtered.length === 0;

  const exportCSV = () =>
    download("cobradores_performance.csv", toCSV(filtered));

  // Config eje X según métrica
  const xTickFormatter =
    metric === "coverage"
      ? (v) => pctFmt((v || 0) / 100) // ya viene en %
      : (v) => moneyFmt.format(v);

  // Tooltip rico con breakdown
  const tooltipFormatter = (val, _key, p) => {
    const r = p?.payload ?? {};
    const lines = [
      ["Debe", moneyFmt.format(r.due || 0)],
      ["Cobrado", moneyFmt.format(r.paid || 0)],
      ["Faltante", moneyFmt.format(r.diffSum || 0)],
      ["Cobertura", pctFmt(r.coverageRate || 0)],
    ];
    const label =
      metric === "coverage"
        ? ["Cobertura", pctFmt((val || 0) / 100)]
        : metric === "gap"
        ? ["Faltante", moneyFmt.format(val || 0)]
        : metric === "due"
        ? ["Debe", moneyFmt.format(val || 0)]
        : ["Cobrado", moneyFmt.format(val || 0)];

    // Recharts espera [value, name]
    return [label[1], label[0], lines];
  };

  // Color por métrica:
  // - gap: rojo si > 0 (faltante), verde si <= 0 (superávit)
  // - due/paid: índigo
  // - coverage: verde si >=100, rojo si <100
  const colorFor = (r) => {
    if (metric === "gap") return r.diffSum > 0 ? RED : GREEN;
    if (metric === "coverage") return (r.coverageRate || 0) >= 1 ? GREEN : RED;
    return INDIGO;
    // due/paid en un color neutro consistente
  };

  // Etiqueta del eje X / título según métrica
  const metricLabel =
    metric === "gap"
      ? "Faltante (Debe − Cobrado)"
      : metric === "due"
      ? "Debe del período"
      : metric === "paid"
      ? "Cobrado aplicado al período"
      : "Cobertura del período";

  return (
    <ChartCard
      title={`Cobradores — ${metricLabel}`}
      subtitle={
        metric === "gap"
          ? "Ordená por faltante para priorizar gestión. Rojo indica mayor importe pendiente."
          : metric === "coverage"
          ? "Cobertura: Cobrado / Debe. Verde ≥ 100%."
          : "Vista por valor absoluto."
      }
      right={<Chip size="small" label={scopeLabel} />}
    >
      {/* Controles */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <ToggleButtonGroup
          size="small"
          value={metric}
          exclusive
          onChange={(_e, v) => v && setMetric(v)}
        >
          <ToggleButton value="gap">Faltante</ToggleButton>
          <ToggleButton value="due">Debe</ToggleButton>
          <ToggleButton value="paid">Cobrado</ToggleButton>
          <ToggleButton value="coverage">Cobertura %</ToggleButton>
        </ToggleButtonGroup>

        {metric === "gap" && (
          <FormControlLabel
            sx={{ ml: { sm: 1 } }}
            control={
              <Switch
                size="small"
                checked={showOnlyPositiveGap}
                onChange={(e) => setShowOnlyPositiveGap(e.target.checked)}
              />
            }
            label="Solo faltante > 0"
          />
        )}

        <ToggleButtonGroup
          size="small"
          value={`${sortKey}:${sortDir}`}
          exclusive
          onChange={(_e, v) => {
            if (!v) return;
            const [k, d] = v.split(":");
            setSortKey(k);
            setSortDir(d);
          }}
          sx={{ ml: { sm: 1 } }}
        >
          <ToggleButton value="value:desc">
            <SortRoundedIcon fontSize="small" style={{ marginRight: 6 }} />
            {metric === "coverage" ? "% ↓" : "Valor ↓"}
          </ToggleButton>
          <ToggleButton value="value:asc">
            <SortRoundedIcon fontSize="small" style={{ marginRight: 6 }} />
            {metric === "coverage" ? "% ↑" : "Valor ↑"}
          </ToggleButton>
          <ToggleButton value="name:asc">Nombre A→Z</ToggleButton>
          <ToggleButton value="name:desc">Nombre Z→A</ToggleButton>
          <ToggleButton value="id:asc">ID A→Z</ToggleButton>
          <ToggleButton value="id:desc">ID Z→A</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ minWidth: 220 }}
        >
          <Typography variant="caption" sx={{ minWidth: 64 }}>
            Top {topN}
          </Typography>
          <Slider
            size="small"
            value={topN}
            min={5}
            max={30}
            onChange={(_e, v) => setTopN(Number(v))}
            valueLabelDisplay="auto"
            sx={{ maxWidth: 180 }}
          />
        </Stack>

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
      <Box sx={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filtered.map((r) => ({
              ...r,
              // valor que grafica depende de la métrica
              value:
                metric === "gap"
                  ? r.diffSum
                  : metric === "due"
                  ? r.due
                  : metric === "paid"
                  ? r.paid
                  : (r.coverageRate || 0) * 100, // %
            }))}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <XAxis
              type="number"
              tickFormatter={xTickFormatter}
              domain={["auto", "auto"]}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={140}
              tick={{ fontSize: 12 }}
            />
            <RTooltip
              wrapperStyle={{ outline: "none" }}
              // Mostramos la etiqueta principal + breakdown
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const r = payload[0]?.payload || {};
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
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      sx={{ mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2">
                      Debe: <strong>{moneyFmt.format(r.due || 0)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Cobrado: <strong>{moneyFmt.format(r.paid || 0)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Faltante:{" "}
                      <strong>{moneyFmt.format(r.diffSum || 0)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Cobertura: <strong>{pctFmt(r.coverageRate || 0)}</strong>
                    </Typography>
                  </Box>
                );
              }}
            />
            <Bar
              dataKey="value"
              name={metricLabel}
              barSize={18}
              radius={[4, 4, 4, 4]}
            >
              {filtered.map((r, i) => (
                <Cell key={i} fill={colorFor(r)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Nota */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        Tip: cambiá la métrica para ver **Faltante**, **Debe**, **Cobrado** o
        **Cobertura %**. En “Faltante”, activá “Solo faltante &gt; 0” para
        priorizar gestión.
      </Typography>
    </ChartCard>
  );
}
