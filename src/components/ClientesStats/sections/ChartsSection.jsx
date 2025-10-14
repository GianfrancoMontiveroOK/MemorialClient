import React from "react";
import { Grid } from "@mui/material";

import DiffHistogramChart from "../charts/DiffHistogramChart";
import CobradorDeltaChart from "../charts/CobradorDeltaChart";
import PlanDistributionPie from "../charts/PlanDistributionPie";
import PlanAverageBar from "../charts/PlanAverageBar";

export default function ChartsSection({ stats }) {
  const byCobrador = React.useMemo(
    () => (Array.isArray(stats?.byCobrador) ? stats.byCobrador : []),
    [stats]
  );
  const byPlan = React.useMemo(
    () => (Array.isArray(stats?.byPlan) ? stats.byPlan : []),
    [stats]
  );
  const diffHistogram = React.useMemo(
    () => (Array.isArray(stats?.diffHistogram) ? stats.diffHistogram : []),
    [stats]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DiffHistogramChart
          data={diffHistogram}
          scopeLabel="Todos los activos"
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
