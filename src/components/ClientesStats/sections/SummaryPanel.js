import React from "react";
import { Paper, Typography, Grid } from "@mui/material";
import StatCard from "../atoms/StatCard";
import { moneyFmt, pctFmt } from "../atoms/formatters";

export default function SummaryPanel({ summary }) {
  // ---- Compat: backend viejo y nuevo ----
  const totalDebido = Number(summary?.totalDebido ?? summary?.sumCuota ?? 0);
  const totalPagado = Number(
    summary?.totalPagadoPeriodo ?? summary?.sumVigente ?? 0
  );

  // Δ orientado al negocio de cobranzas: Pagado - Debe
  const delta = Number((totalPagado - totalDebido).toFixed(2));

  const groups = Number(summary?.totalGrupos ?? summary?.groups ?? 0);
  const rawPaid = Number(summary?.grupos?.paid ?? 0);
  const rawPartial = Number(summary?.grupos?.partial ?? 0);
  const rawUnpaid = Number(summary?.grupos?.unpaid ?? 0);
  const miembros = Number(summary?.totalMiembros ?? 0);

  // Cobertura del período
  const coverageRate =
    summary?.coverageRate != null
      ? Number(summary.coverageRate)
      : totalDebido > 0
      ? Number((totalPagado / totalDebido).toFixed(4))
      : 0;

  // Estados (si vienen del nuevo controlador)

  // clamp para no mostrar más que el total de grupos
  const gruposPaid = Math.min(rawPaid, groups);
  const gruposPartial = Math.min(rawPartial, Math.max(0, groups - gruposPaid));
  const gruposUnpaid = Math.min(
    rawUnpaid,
    Math.max(0, groups - gruposPaid - gruposPartial)
  );
  // Promedios (1 cuota por grupo)
  const avgCuota =
    groups > 0
      ? Number((totalDebido / groups).toFixed(2))
      : Number(summary?.avgCuota ?? 0);

  const avgIntegrantes =
    summary?.avgIntegrantes != null
      ? Number(summary.avgIntegrantes)
      : groups > 0 && miembros > 0
      ? Number((miembros / groups).toFixed(1))
      : 0;

  // Gaps agregados (si vienen)
  const posSum = Number(summary?.posSum ?? 0);
  const negSum = Number(summary?.negSum ?? 0);
  const posPct =
    summary?.posPct != null
      ? Number(summary.posPct)
      : Number((coverageRate * 100).toFixed(2));

  // Tickets globales (si vienen)
  const tAvg = Number(summary?.ticketsGlobal?.avg ?? 0);
  const tMedian = Number(summary?.ticketsGlobal?.median ?? 0);
  const tCount = Number(summary?.ticketsGlobal?.count ?? 0);
  const tSum = Number(summary?.ticketsGlobal?.sum ?? 0);

  // ====== BLOQUE BASES: Ideal / Cuota / Real (vigente) ======
  const idealSum = Number(summary?.dueByMode?.idealSum ?? 0);
  const cuotaSum = Number(summary?.dueByMode?.cuotaSum ?? 0);
  const usingIdealCount = Number(summary?.dueByMode?.usingIdealCount ?? 0);
  const usingCuotaCount = Number(summary?.dueByMode?.usingCuotaCount ?? 0);
  const hasDueByMode =
    idealSum > 0 || cuotaSum > 0 || usingIdealCount > 0 || usingCuotaCount > 0;

  // Real (vigente) desde revenue (si viene)
  const vigenteSum = Number(summary?.revenue?.vigenteSum ?? 0);

  // idealVsCuota (más preciso, si viene)
  const idealVsCuota = summary?.idealVsCuota || null;
  const deltaIdealCuota =
    idealVsCuota?.deltaAmount != null
      ? Number(idealVsCuota.deltaAmount)
      : Number(idealSum - cuotaSum);
  const deltaIdealCuotaPct =
    idealVsCuota?.deltaPct != null
      ? Number(idealVsCuota.deltaPct)
      : cuotaSum > 0
      ? Number((((idealSum - cuotaSum) / cuotaSum) * 100).toFixed(2))
      : 0;

  // Revenue / coberturas comparativas (opcional)
  const revenue = summary?.revenue || {};
  const collected = Number(revenue.collected ?? 0);
  const targetIdeal = Number(revenue.targetIdeal ?? 0);
  const baselineCuota = Number(revenue.baselineCuota ?? 0);
  const vsIdeal = revenue.vsIdeal || { gap: 0, coveragePct: 0 };
  const vsVigente = revenue.vsVigente || { gap: 0, coveragePct: 0 };
  const uplift = revenue.upliftIdealVsCuota || { amount: 0, pct: 0 };
  const hasRevenue =
    targetIdeal > 0 || baselineCuota > 0 || vigenteSum > 0 || collected > 0;

  // Impacto de política (si viene)
  const policyImpact = summary?.policyImpact || null;

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
        Agregados del <strong>período seleccionado</strong> (1 cuota por grupo).
        Cobertura = Pagado / Debe. Δ = <em>Pagado − Debe</em>.
      </Typography>

      <Grid container spacing={2}>
        {/* Tamaño de cartera */}
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Grupos activos" value={groups} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Integrantes promedio"
            value={avgIntegrantes.toFixed(1)}
          />
        </Grid>

        {/* Debe vs Pagado (según dueMode seleccionado) */}
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Debe (período)"
            value={moneyFmt.format(totalDebido)}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Pagado (período)"
            value={moneyFmt.format(totalPagado)}
          />
        </Grid>

        {/* Cobertura y Delta */}
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Cobertura"
            value={pctFmt(coverageRate * 100)}
            hint="Pagado / Debe"
            color={
              coverageRate >= 1
                ? "success.main"
                : coverageRate >= 0.8
                ? "warning.main"
                : "error.main"
            }
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Δ Pagado − Debe"
            value={moneyFmt.format(delta)}
            hint="Excedente (+) / Faltante (−)"
            color={
              delta < 0 ? "error.main" : delta > 0 ? "success.main" : undefined
            }
          />
        </Grid>

        {/* Promedio de cuota (1 por grupo) */}
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard title="Promedio cuota" value={moneyFmt.format(avgCuota)} />
        </Grid>

        {/* Estado de grupos (si hay datos) */}
        {gruposPaid + gruposPartial + gruposUnpaid > 0 ? (
          <>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Grupos pagados"
                value={gruposPaid}
                color="success.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Grupos parciales"
                value={gruposPartial}
                color="warning.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Grupos impagos"
                value={gruposUnpaid}
                color="error.main"
              />
            </Grid>
          </>
        ) : null}

        {/* Distribución de gaps agregada (si viene) */}
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="% cobertura aprox."
            value={pctFmt(posPct)}
            hint="Aprox. al % de cobertura"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Suma gaps positivos"
            value={moneyFmt.format(posSum)}
            color={posSum > 0 ? "success.main" : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2.4}>
          <StatCard
            title="Suma gaps negativos"
            value={moneyFmt.format(negSum)}
            color={negSum > 0 ? "error.main" : undefined}
          />
        </Grid>

        {/* Tickets (si vienen) */}
        {tCount > 0 ? (
          <>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard title="Tickets (avg)" value={moneyFmt.format(tAvg)} />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Tickets (mediana)"
                value={moneyFmt.format(tMedian)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard title="Cobros (count)" value={tCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard title="Cobros (suma)" value={moneyFmt.format(tSum)} />
            </Grid>
          </>
        ) : null}

        {/* ===== Bases: Ideal / Cuota / Real (vigente) ===== */}
        {hasDueByMode ? (
          <>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Base Ideal (Σ)"
                value={moneyFmt.format(idealVsCuota?.idealSum ?? idealSum)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Base Cuota (Σ)"
                value={moneyFmt.format(idealVsCuota?.cuotaSum ?? cuotaSum)}
              />
            </Grid>
            {vigenteSum > 0 ? (
              <Grid item xs={6} sm={4} md={3} lg={2.4}>
                <StatCard
                  title="Base Real (Σ)"
                  value={moneyFmt.format(vigenteSum)}
                />
              </Grid>
            ) : null}
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Δ Ideal − Cuota"
                value={moneyFmt.format(deltaIdealCuota)}
                hint={pctFmt(deltaIdealCuotaPct)}
                color={deltaIdealCuota > 0 ? "warning.main" : undefined}
              />
            </Grid>
            {(usingIdealCount > 0 || usingCuotaCount > 0) && (
              <>
                <Grid item xs={6} sm={4} md={3} lg={2.4}>
                  <StatCard title="Usan Ideal" value={usingIdealCount} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2.4}>
                  <StatCard title="Usan Cuota" value={usingCuotaCount} />
                </Grid>
              </>
            )}
          </>
        ) : null}

        {/* ===== KPIs de revenue / cobertura comparativa ===== */}
        {hasRevenue ? (
          <>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Objetivo (Ideal)"
                value={moneyFmt.format(targetIdeal)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Baseline (Cuota)"
                value={moneyFmt.format(baselineCuota)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Uplift Ideal vs Cuota"
                value={moneyFmt.format(uplift.amount ?? 0)}
                hint={pctFmt(uplift.pct ?? 0)}
                color={(uplift.amount ?? 0) > 0 ? "warning.main" : undefined}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Cobertura vs Ideal"
                value={pctFmt(vsIdeal.coveragePct ?? 0)}
                hint={`Gap: ${moneyFmt.format(vsIdeal.gap ?? 0)}`}
                color={
                  (vsIdeal.coveragePct ?? 0) >= 100 ? "success.main" : undefined
                }
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3} lg={2.4}>
              <StatCard
                title="Cobertura vs Real"
                value={pctFmt(vsVigente.coveragePct ?? 0)}
                hint={`Gap: ${moneyFmt.format(vsVigente.gap ?? 0)}`}
                color={
                  (vsVigente.coveragePct ?? 0) >= 100
                    ? "success.main"
                    : undefined
                }
              />
            </Grid>
          </>
        ) : null}

        {/* Impacto de política (opcional) */}
        {policyImpact ? (
          <Grid item xs={6} sm={4} md={3} lg={2.4}>
            <StatCard
              title="Pérdida vs Ideal (Σ)"
              value={moneyFmt.format(policyImpact.lostVsTargetAmount ?? 0)}
              hint={`${policyImpact.lostPctVsTarget ?? 0}% del Ideal • ${
                policyImpact.lostPctVsCollected ?? 0
              }% del Cobrado`}
              color={
                (policyImpact.lostVsTargetAmount ?? 0) > 0
                  ? "warning.main"
                  : undefined
              }
            />
          </Grid>
        ) : null}
      </Grid>
    </Paper>
  );
}
