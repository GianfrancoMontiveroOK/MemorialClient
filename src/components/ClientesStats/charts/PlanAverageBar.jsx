import React from "react";
import {
  Box,
  Stack,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip as MuiTooltip,
  Slider,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ChartCard from "../atoms/ChartCard";
import { moneyFmt } from "../atoms/formatters";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";

// Paleta consistente con PlanDistributionPie (cíclica)
const PLAN_COLORS = [
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#22C55E",
  "#E11D48",
  "#0EA5E9",
  "#A855F7",
  "#84CC16",
  "#F97316",
  "#0EA5A5",
  "#9333EA",
  "#16A34A",
];

const toRows = (raw) =>
  (Array.isArray(raw) ? raw : []).map((p) => ({
    plan: String(p.plan ?? "—"),
    cuotaAvg: Number(p.cuotaAvg || 0),
  }));

const toCSV = (rows, globalAvg) => {
  const headers = ["plan", "cuotaAvg", "globalAvg"];
  const esc = (s) => `"${String(s ?? "").replaceAll('"', '""')}"`;
  const body = rows
    .map((r) => [r.plan, r.cuotaAvg, globalAvg].map(esc).join(","))
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

export default function PlanAverageBar({
  data = [],
  scopeLabel = "Todos los activos",
}) {
  const base = React.useMemo(() => toRows(data), [data]);

  // Controles
  const [sort, setSort] = React.useState("value:desc"); // "value:desc" | "value:asc" | "name:asc" | "name:desc"
  const [topN, setTopN] = React.useState(12);
  const [horizontal, setHorizontal] = React.useState(false); // layout vertical por defecto
  const [showLabels, setShowLabels] = React.useState(false);

  // Orden
  const sorted = React.useMemo(() => {
    const [key, dir] = sort.split(":");
    const arr = [...base];
    if (key === "value") {
      arr.sort((a, b) =>
        dir === "asc" ? a.cuotaAvg - b.cuotaAvg : b.cuotaAvg - a.cuotaAvg
      );
    } else {
      arr.sort((a, b) =>
        dir === "asc"
          ? a.plan.localeCompare(b.plan)
          : b.plan.localeCompare(a.plan)
      );
    }
    return arr;
  }, [base, sort]);

  const rows = React.useMemo(
    () => sorted.slice(0, Math.max(1, topN)),
    [sorted, topN]
  );

  const globalAvg = React.useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((a, r) => a + (r.cuotaAvg || 0), 0);
    return sum / rows.length;
  }, [rows]);

  const empty = rows.length === 0;

  const exportCSV = () =>
    download("promedio_cuota_por_plan.csv", toCSV(rows, globalAvg));

  // Config ejes según orientación
  const isHorizontal = horizontal || rows.length > 16; // fuerza horizontal si hay muchas categorías
  const xAxisProps = isHorizontal
    ? { type: "number", tickFormatter: (v) => moneyFmt.format(v) }
    : { type: "category", dataKey: "plan", tick: { fontSize: 12 } };
  const yAxisProps = isHorizontal
    ? { type: "category", dataKey: "plan", width: 90, tick: { fontSize: 12 } }
    : { type: "number", tickFormatter: (v) => moneyFmt.format(v) };

  return (
    <ChartCard
      title="Promedio de cuota por plan"
      subtitle="Compara el ticket promedio por tipo de plan (Δ no considerada)."
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
          value={sort}
          exclusive
          onChange={(_e, v) => v && setSort(v)}
        >
          <ToggleButton value="value:desc">Promedio ↓</ToggleButton>
          <ToggleButton value="value:asc">Promedio ↑</ToggleButton>
          <ToggleButton value="name:asc">Nombre A→Z</ToggleButton>
          <ToggleButton value="name:desc">Nombre Z→A</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={horizontal}
              onChange={(e) => setHorizontal(e.target.checked)}
            />
          }
          label="Horizontal"
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
          }
          label="Mostrar valores"
        />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ minWidth: 200 }}
        >
          <Typography variant="caption" sx={{ minWidth: 64 }}>
            Top {topN}
          </Typography>
          <Slider
            size="small"
            value={topN}
            min={5}
            max={24}
            onChange={(_e, v) => setTopN(Number(v))}
            valueLabelDisplay="auto"
            sx={{ maxWidth: 160 }}
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
      <Box sx={{ height: isHorizontal ? 420 : 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
            {isHorizontal ? (
              <>
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
              </>
            ) : (
              <>
                <XAxis
                  {...xAxisProps}
                  interval={0}
                  height={50}
                  tickMargin={8}
                />
                <YAxis {...yAxisProps} />
              </>
            )}
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 6 }}
              payload={[
                {
                  value: "Promedio por plan",
                  type: "square",
                  color: PLAN_COLORS[0],
                },
              ]}
            />
            <ReferenceLine
              {...(isHorizontal ? { x: globalAvg } : { y: globalAvg })}
              stroke="#9CA3AF"
              strokeDasharray="4 4"
              label={{
                position: isHorizontal ? "top" : "right",
                value: `Promedio global: ${moneyFmt.format(globalAvg)}`,
                fill: "#6B7280",
                fontSize: 11,
              }}
            />
            <RTooltip
              wrapperStyle={{ outline: "none" }}
              formatter={(v) => [moneyFmt.format(v), "Promedio cuota"]}
            />
            <Bar
              dataKey="cuotaAvg"
              name="Promedio cuota"
              barSize={isHorizontal ? 18 : 22}
              radius={[4, 4, 4, 4]}
            >
              {rows.map((r, i) => (
                <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
              ))}
              {showLabels && (
                <LabelList
                  dataKey="cuotaAvg"
                  position={isHorizontal ? "right" : "top"}
                  formatter={(v) => moneyFmt.format(v)}
                  style={{ fontSize: 11, fill: "#374151" }}
                />
              )}
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
        Tip: activá “Horizontal” si tenés muchos planes para mejorar la
        legibilidad de las etiquetas.
      </Typography>
    </ChartCard>
  );
}
