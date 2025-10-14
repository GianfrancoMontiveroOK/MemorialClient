import React from "react";
import { Paper, Typography, Grid } from "@mui/material";
import StatCard from "../atoms/StatCard";
import { moneyFmt, pctFmt } from "../atoms/formatters";

export default function SummaryPanel({ summary }) {
  const totalGroups = summary?.groups || 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Agregados sobre <strong>todos los clientes activos</strong> (1 por
        grupo). Δ (Ideal − Cobro). Rojo =&nbsp;
        <em>ideal debería ser mayor</em>.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Grupos activos" value={totalGroups} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Suma Cuota" value={moneyFmt.format(summary.sumCuota || 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Suma Ideal" value={moneyFmt.format(summary.sumIdeal || 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Suma Δ Ideal vs Cobro"
            value={moneyFmt.format(summary.sumDiff || 0)}
            hint="Rojo: faltaría ajustar hacia arriba"
            color={Number(summary.sumDiff) > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Promedio Cuota" value={moneyFmt.format(summary.avgCuota || 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="% con gap positivo"
            value={pctFmt(summary.posPct || 0)}
            hint={`${summary.posCount || 0} grupos`}
            color={Number(summary.posPct) > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Suma gaps positivos"
            value={moneyFmt.format(summary.posSum || 0)}
            color={Number(summary.posSum) > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Suma gaps negativos"
            value={moneyFmt.format(summary.negSum || 0)}
            color={Number(summary.negSum) < 0 ? "success.main" : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Integrantes promedio"
            value={(Number(summary.avgIntegrantes) || 0).toFixed(1)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
