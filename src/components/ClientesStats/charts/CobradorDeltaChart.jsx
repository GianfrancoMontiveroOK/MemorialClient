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
import { moneyFmt } from "../atoms/formatters";
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

// Helpers
const toRows = (raw) =>
  (Array.isArray(raw) ? raw : []).map((c) => ({
    idCobrador: String(c.idCobrador ?? "—"),
    diffSum: Number(c.diffSum || 0),
  }));

const toCSV = (rows) => {
  const headers = ["idCobrador", "diffSum"];
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

export default function CobradorDeltaChart({
  data = [],
  scopeLabel = "Todos los activos",
}) {
  const base = React.useMemo(() => toRows(data), [data]);

  // Controles UI
  const [showOnlyPositive, setShowOnlyPositive] = React.useState(true);
  const [sortKey, setSortKey] = React.useState("delta"); // "delta" | "id"
  const [sortDir, setSortDir] = React.useState("desc"); // "asc" | "desc"
  const [topN, setTopN] = React.useState(10);

  // Filtrado + orden
  const filtered = React.useMemo(() => {
    let arr = base;
    if (showOnlyPositive) arr = arr.filter((r) => r.diffSum > 0);
    if (sortKey === "delta") {
      arr = [...arr].sort((a, b) =>
        sortDir === "asc" ? a.diffSum - b.diffSum : b.diffSum - a.diffSum
      );
    } else {
      arr = [...arr].sort((a, b) =>
        sortDir === "asc"
          ? a.idCobrador.localeCompare(b.idCobrador)
          : b.idCobrador.localeCompare(a.idCobrador)
      );
    }
    return arr.slice(0, Math.max(1, topN));
  }, [base, showOnlyPositive, sortKey, sortDir, topN]);

  const empty = filtered.length === 0;

  const exportCSV = () => download("cobradores_delta.csv", toCSV(filtered));

  return (
    <ChartCard
      title="Top cobradores por Δ positiva (ajuste pendiente)"
      subtitle="Suma de Δ (Ideal − Cobro) por cobrador. Valores positivos sugieren revisar aumentos."
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
              checked={showOnlyPositive}
              onChange={(e) => setShowOnlyPositive(e.target.checked)}
            />
          }
          label="Solo positivos"
        />

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
          <ToggleButton value="delta:desc">
            <SortRoundedIcon fontSize="small" style={{ marginRight: 6 }} />Δ ↓
          </ToggleButton>
          <ToggleButton value="delta:asc">
            <SortRoundedIcon fontSize="small" style={{ marginRight: 6 }} />Δ ↑
          </ToggleButton>
          <ToggleButton value="id:asc">Cobrador A→Z</ToggleButton>
          <ToggleButton value="id:desc">Cobrador Z→A</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ minWidth: 180 }}
        >
          <Typography variant="caption" sx={{ minWidth: 48 }}>
            Top {topN}
          </Typography>
          <Slider
            size="small"
            value={topN}
            min={3}
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
      {/* Altura explícita para que ResponsiveContainer tenga espacio */}
      <Box sx={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filtered}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => moneyFmt.format(v)}
              domain={["auto", "auto"]}
            />
            <YAxis
              dataKey="idCobrador"
              type="category"
              width={90}
              tick={{ fontSize: 12 }}
            />
            <RTooltip
              formatter={(v) => [moneyFmt.format(v), "Δ suma"]}
              labelFormatter={(l) => `Cobrador ${l}`}
              wrapperStyle={{ outline: "none" }}
            />
            <Bar
              dataKey="diffSum"
              name="Δ suma"
              barSize={18}
              radius={[4, 4, 4, 4]}
            >
              {filtered.map((r, i) => (
                <Cell key={i} fill={r.diffSum > 0 ? RED : GREEN} />
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
        Tip: ordená por Δ ↓ para priorizar los cobradores con mayor ajuste
        pendiente.
      </Typography>
    </ChartCard>
  );
}
