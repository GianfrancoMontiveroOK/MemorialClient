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
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ChartCard from "../atoms/ChartCard";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Tooltip as RTooltip,
  Cell,
} from "recharts";

// Paleta estable y agradable (cíclica)
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
    name: String(p.plan ?? "—"),
    value: Number(p.count || 0),
  }));

const toCSV = (rows) => {
  const headers = ["plan", "count", "percent"];
  const total = rows.reduce((a, r) => a + (r.value || 0), 0);
  const esc = (s) => `"${String(s ?? "").replaceAll('"', '""')}"`;
  const body = rows
    .map((r) =>
      [r.name, r.value, total ? ((r.value / total) * 100).toFixed(2) : 0]
        .map(esc)
        .join(",")
    )
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

export default function PlanDistributionPie({
  data = [],
  scopeLabel = "Todos los activos",
}) {
  const base = React.useMemo(() => toRows(data), [data]);
  const total = React.useMemo(
    () => base.reduce((a, r) => a + r.value, 0),
    [base]
  );

  // Controles
  const [shape, setShape] = React.useState("pie"); // "pie" | "donut"
  const [sort, setSort] = React.useState("value:desc"); // "value:desc" | "value:asc" | "name:asc" | "name:desc"
  const [topN, setTopN] = React.useState(12); // renderizar top N
  const [activeIndex, setActiveIndex] = React.useState(null);

  const sorted = React.useMemo(() => {
    const [key, dir] = sort.split(":");
    const arr = [...base];
    if (key === "value") {
      arr.sort((a, b) =>
        dir === "asc" ? a.value - b.value : b.value - a.value
      );
    } else {
      arr.sort((a, b) =>
        dir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    }
    return arr;
  }, [base, sort]);

  const rows = React.useMemo(
    () => sorted.slice(0, Math.max(1, topN)),
    [sorted, topN]
  );

  const empty = rows.length === 0 || total === 0;

  const exportCSV = () => download("planes_distribucion.csv", toCSV(rows));

  // Etiqueta sobre cada slice: solo porcentaje para mantener limpio
  const labelPercent = ({ percent }) => `${Math.round((percent || 0) * 100)}%`;

  return (
    <ChartCard
      title="Distribución por plan (conteo)"
      subtitle="Proporción de grupos por tipo de plan. Útil para mix de producto."
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
          value={shape}
          exclusive
          onChange={(_e, v) => v && setShape(v)}
        >
          <ToggleButton value="pie">Torta</ToggleButton>
          <ToggleButton value="donut">Dona</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          value={sort}
          exclusive
          onChange={(_e, v) => v && setSort(v)}
          sx={{ ml: { sm: 1 } }}
        >
          <ToggleButton value="value:desc">Conteo ↓</ToggleButton>
          <ToggleButton value="value:asc">Conteo ↑</ToggleButton>
          <ToggleButton value="name:asc">Nombre A→Z</ToggleButton>
          <ToggleButton value="name:desc">Nombre Z→A</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

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
            max={20}
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
      <Box sx={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius={shape === "donut" ? 50 : 0} // dona vs torta
              outerRadius={110}
              paddingAngle={rows.length > 1 ? 1 : 0} // separa levemente
              labelLine={false}
              label={labelPercent}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {rows.map((p, i) => {
                const isActive = i === activeIndex;
                return (
                  <Cell
                    key={i}
                    fill={PLAN_COLORS[i % PLAN_COLORS.length]}
                    stroke="#fff"
                    strokeWidth={isActive ? 2 : 1}
                  />
                );
              })}
            </Pie>

            {/* Leyenda abajo, con truncado visual para evitar desborde */}
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingTop: 8,
                maxHeight: 92, // evita que coma todo el alto
                overflowY: "auto", // scroll si hay muchos planes
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              formatter={(value, entry) => {
                const name = String(value ?? "—");
                const row = rows.find((r) => r.name === name);
                const pct = total
                  ? Math.round(((row?.value || 0) * 100) / total)
                  : 0;
                const text = `${name} • ${pct}%`;
                return (
                  <span title={text}>
                    {text.length > 24 ? `${text.slice(0, 24)}…` : text}
                  </span>
                );
              }}
            />

            <RTooltip
              formatter={(v, _k, p) => {
                const count = Number(v || 0);
                const pct = total ? (count / total) * 100 : 0;
                return [
                  `${count.toLocaleString("es-AR")} (${pct.toFixed(2)}%)`,
                  p?.payload?.name ?? "Plan",
                ];
              }}
              wrapperStyle={{ outline: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Nota */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        Tip: usá “Top N” para enfocar en los planes más representativos y cambiá
        a “Dona” para ver mejor el centro.
      </Typography>
    </ChartCard>
  );
}
