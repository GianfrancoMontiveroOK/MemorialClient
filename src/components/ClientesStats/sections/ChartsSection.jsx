import React from "react";
import { Grid } from "@mui/material";

import DiffHistogramChart from "../charts/DiffHistogramChart";
import CobradorDeltaChart from "../charts/CobradorDeltaChart";
import PlanDistributionPie from "../charts/PlanDistributionPie";
import PlanAverageBar from "../charts/PlanAverageBar";

/**
 * Adapta coverage -> histograma de gaps (paid - due)
 * Si ya viene stats.diffHistogram lo respeta.
 * Salida genérica: [{ label: string, count: number, from?: number, to?: number }]
 */
function buildGapHistogram(stats) {
  if (Array.isArray(stats?.diffHistogram)) return stats.diffHistogram;

  const coverage = Array.isArray(stats?.coverage) ? stats.coverage : [];
  if (coverage.length === 0) return [];

  // Bins simétricos (ARS) – podés tunearlos o moverlos al backend
  const bins = [
    { key: "≤-5000", from: -Infinity, to: -5000 },
    { key: "-5000 a -1000", from: -5000, to: -1000 },
    { key: "-1000 a -500", from: -1000, to: -500 },
    { key: "-500 a -100", from: -500, to: -100 },
    { key: "-100 a -1", from: -100, to: -0.01 },
    { key: "≈0", from: -0.009, to: 0.009 },
    { key: "1 a 100", from: 0.01, to: 100 },
    { key: "100 a 500", from: 100, to: 500 },
    { key: "500 a 1000", from: 500, to: 1000 },
    { key: "1000 a 5000", from: 1000, to: 5000 },
    { key: "≥5000", from: 5000, to: Infinity },
  ];

  const counts = bins.map(() => 0);
  for (const g of coverage) {
    const gap = Number(g?.gap ?? 0);
    const idx = bins.findIndex((b) => gap >= b.from && gap <= b.to);
    if (idx >= 0) counts[idx] += 1;
  }

  return bins.map((b, i) => ({
    label: b.key,
    from: b.from,
    to: b.to,
    count: counts[i],
  }));
}

/**
 * Asegura que byCobrador tenga campos básicos para CobradorDeltaChart
 * (coverageRate, paid, due). Si no están, los compone.
 */
function normalizeByCobrador(stats) {
  const arr = Array.isArray(stats?.byCobrador) ? stats.byCobrador : [];
  return arr.map((r) => {
    const due = Number(r?.due ?? 0);
    const paid = Number(r?.paid ?? 0);
    const coverageRate =
      r?.coverageRate != null
        ? Number(r.coverageRate)
        : due > 0
        ? Number((paid / due).toFixed(4))
        : 0;
    return {
      ...r,
      due,
      paid,
      coverageRate,
    };
  });
}

/**
 * `byPlan` no existe en el controlador nuevo.
 * Para no romper, generamos placeholders a partir del mix de métodos como pseudo-plan.
 * Si ya viene byPlan del backend, lo respeta.
 * Estructura genérica esperada por tus Plan* charts:
 *   [{ plan: string, count?: number, total?: number, avg?: number }]
 */
function buildByPlan(stats) {
  if (Array.isArray(stats?.byPlan)) return stats.byPlan;

  const mix = stats?.summary?.mix || {};
  const methods = mix.methods || {}; // { metodo: amount }
  const entries = Object.entries(methods);
  if (entries.length === 0) return [];

  // Lo interpretamos como “planes” temporales por método de pago
  const total = entries.reduce((a, [, v]) => a + Number(v || 0), 0);
  return entries.map(([method, amount]) => ({
    plan: method.toUpperCase(),
    total: Number(amount || 0),
    // avg sintético: proporción * (ticket global promedio si existe)
    avg:
      total > 0
        ? Number(
            (
              ((amount || 0) / total) *
              (stats?.summary?.ticketsGlobal?.avg || 0)
            ).toFixed(2)
          )
        : 0,
    count: undefined, // si tus charts requieren count, lo podemos estimar en V2
  }));
}

export default function ChartsSection({ stats }) {
  const byCobrador = React.useMemo(() => normalizeByCobrador(stats), [stats]);
  const byPlan = React.useMemo(() => buildByPlan(stats), [stats]);
  const diffHistogram = React.useMemo(() => buildGapHistogram(stats), [stats]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DiffHistogramChart
          data={diffHistogram}
          scopeLabel="Cobertura del período (gap pagado - debido)"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CobradorDeltaChart data={byCobrador} />
      </Grid>

      <Grid item xs={12} md={6}>
        <PlanDistributionPie data={byPlan} />
      </Grid>

      <Grid item xs={12} md={6}>
        <PlanAverageBar data={byPlan} />
      </Grid>
    </Grid>
  );
}
