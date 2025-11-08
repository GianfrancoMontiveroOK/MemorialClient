import React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Tooltip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

// formateador simple
const money = (v) =>
  (Number(v) || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

/**
 * Header de estadísticas (v6)
 *
 * Props:
 * - loading, onReload, period, updatedAt, onOpenFilters, rightActions
 * - dueMode ("ideal" | "cuota" | "vigente"), onChangeDueMode
 * - summary?: {
 *     dueByMode?: { idealSum?: number, cuotaSum?: number, usingIdealCount?: number, usingCuotaCount?: number }
 *     revenue?: {
 *       baselineCuota?: number, targetIdeal?: number, vigenteSum?: number, collected?: number,
 *       upliftIdealVsCuota?: { amount: number, pct: number },
 *       vsIdeal?: { gap: number, coveragePct: number },
 *       vsVigente?: { gap: number, coveragePct: number }
 *     },
 *     idealVsCuota?: { idealSum?: number, cuotaSum?: number, deltaAmount?: number, deltaPct?: number },
 *     policyImpact?: { lostVsTargetAmount?: number, lostPctVsTarget?: number, lostPctVsCollected?: number }
 *   }
 */
export default function Header({
  loading,
  onReload,
  period,
  updatedAt,
  onOpenFilters,
  rightActions,
  dueMode = "vigente", // ⬅️ por defecto usamos la cuota real vigente
  onChangeDueMode,
  summary,
}) {
  const lastRun = React.useMemo(() => {
    if (!updatedAt) return null;
    const d = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
    if (Number.isNaN(d?.getTime?.())) return null;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${mi}`;
  }, [updatedAt]);

  // ===== Bloque dueByMode (Δ IDEAL−CUOTA clásico) =====
  const idealSum = Number(summary?.dueByMode?.idealSum || 0);
  const cuotaSum = Number(summary?.dueByMode?.cuotaSum || 0);
  const usingIdealCount = Number(summary?.dueByMode?.usingIdealCount || 0);
  const usingCuotaCount = Number(summary?.dueByMode?.usingCuotaCount || 0);
  const hasDueByMode =
    idealSum > 0 || cuotaSum > 0 || usingIdealCount > 0 || usingCuotaCount > 0;
  const deltaIdealCuota = idealSum - cuotaSum;

  // ===== Revenue (comparaciones) =====
  const revenue = summary?.revenue || {};
  const collected = Number(revenue.collected || 0);
  const vigenteSum = Number(revenue.vigenteSum || 0);
  const targetIdeal = Number(revenue.targetIdeal || 0);
  const baselineCuota = Number(revenue.baselineCuota || 0);
  const uplift = revenue.upliftIdealVsCuota || { amount: 0, pct: 0 };
  const vsIdeal = revenue.vsIdeal || { gap: 0, coveragePct: 0 };
  const vsVigente = revenue.vsVigente || { gap: 0, coveragePct: 0 };
  const hasRevenue =
    targetIdeal > 0 || vigenteSum > 0 || collected > 0 || baselineCuota > 0;

  // ===== Opcionales adicionales =====
  const idealVsCuota = summary?.idealVsCuota || {};
  const policyImpact = summary?.policyImpact || {};

  const handleDueMode = (_e, v) => {
    if (!v || !onChangeDueMode) return;
    onChangeDueMode(v);
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        mb: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Izquierda: título + contexto */}
      <Stack spacing={1} sx={{ minWidth: 280 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          rowGap={1}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ textTransform: "uppercase", letterSpacing: 0.4, mr: 0.5 }}
          >
            Estadísticas
          </Typography>

          {period ? (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`Período: ${period}`}
            />
          ) : null}

          {lastRun ? (
            <Chip
              size="small"
              variant="outlined"
              label={`Último cálculo: ${lastRun}`}
            />
          ) : null}

          {/* Δ IDEAL−CUOTA (clásico) */}
          {hasDueByMode ? (
            <Tooltip
              title={
                <Box>
                  <div>
                    <strong>Base ideal</strong>: {money(idealSum)}
                  </div>
                  <div>
                    <strong>Base cuota</strong>: {money(cuotaSum)}
                  </div>
                  <div>Δ = Ideal − Cuota (potencial de actualización)</div>
                </Box>
              }
              arrow
            >
              <Chip
                size="small"
                color={deltaIdealCuota > 0 ? "warning" : "default"}
                variant="filled"
                label={`Δ IDEAL−CUOTA: ${money(deltaIdealCuota)}`}
              />
            </Tooltip>
          ) : null}

          {/* Δ y % desde idealVsCuota (preciso, si viene) */}
          {idealVsCuota?.deltaAmount != null ? (
            <Tooltip
              title={
                <Box>
                  <div>
                    <strong>Ideal</strong>: {money(idealVsCuota.idealSum || 0)}
                  </div>
                  <div>
                    <strong>Cuota</strong>: {money(idealVsCuota.cuotaSum || 0)}
                  </div>
                  <div>
                    <strong>Δ</strong>: {money(idealVsCuota.deltaAmount || 0)} (
                    {idealVsCuota.deltaPct || 0}%)
                  </div>
                </Box>
              }
              arrow
            >
              <Chip
                size="small"
                color={
                  (idealVsCuota.deltaAmount || 0) > 0 ? "warning" : "default"
                }
                variant="outlined"
                label={`Δ Neto: ${money(idealVsCuota.deltaAmount || 0)} (${
                  idealVsCuota.deltaPct || 0
                }%)`}
              />
            </Tooltip>
          ) : null}

          {/* Conteos de política activa (titular usa ideal vs cuota) */}
          {hasDueByMode && usingIdealCount > 0 ? (
            <Chip
              size="small"
              variant="outlined"
              label={`Usan ideal: ${usingIdealCount}`}
            />
          ) : null}
          {hasDueByMode && usingCuotaCount > 0 ? (
            <Chip
              size="small"
              variant="outlined"
              label={`Usan cuota: ${usingCuotaCount}`}
            />
          ) : null}

          {/* KPIs de revenue */}
          {hasRevenue ? (
            <>
              <Tooltip
                title={
                  <Box>
                    <div>
                      <strong>Objetivo (Ideal)</strong>: {money(targetIdeal)}
                    </div>
                    <div>
                      <strong>Baseline (Cuota)</strong>: {money(baselineCuota)}
                    </div>
                    <div>
                      <strong>Uplift</strong>: {money(uplift.amount)} (
                      {uplift.pct}%)
                    </div>
                  </Box>
                }
                arrow
              >
                <Chip
                  size="small"
                  color={uplift.amount > 0 ? "warning" : "default"}
                  label={`Uplift Ideal vs Cuota: ${money(uplift.amount)} (${
                    uplift.pct
                  }%)`}
                />
              </Tooltip>

              <Tooltip
                title={
                  <Box>
                    <div>
                      <strong>Ideal</strong>: {money(targetIdeal)}
                    </div>
                    <div>
                      <strong>Cobrado</strong>: {money(collected)}
                    </div>
                    <div>
                      <strong>Gap</strong>: {money(vsIdeal.gap)}
                    </div>
                  </Box>
                }
                arrow
              >
                <Chip
                  size="small"
                  color={
                    (vsIdeal.coveragePct || 0) >= 100 ? "success" : "default"
                  }
                  variant="outlined"
                  label={`Cobertura vs Ideal: ${
                    vsIdeal.coveragePct || 0
                  }% • Gap ${money(vsIdeal.gap)}`}
                />
              </Tooltip>

              <Tooltip
                title={
                  <Box>
                    <div>
                      <strong>Real (vigente)</strong>: {money(vigenteSum)}
                    </div>
                    <div>
                      <strong>Cobrado</strong>: {money(collected)}
                    </div>
                    <div>
                      <strong>Gap</strong>: {money(vsVigente.gap)}
                    </div>
                  </Box>
                }
                arrow
              >
                <Chip
                  size="small"
                  color={
                    (vsVigente.coveragePct || 0) >= 100 ? "success" : "default"
                  }
                  variant="outlined"
                  label={`Cobertura vs Real: ${
                    vsVigente.coveragePct || 0
                  }% • Gap ${money(vsVigente.gap)}`}
                />
              </Tooltip>

              {policyImpact?.lostVsTargetAmount != null ? (
                <Tooltip
                  title={
                    <Box>
                      <div>
                        <strong>Pérdida vs Target (Ideal)</strong>:{" "}
                        {money(policyImpact.lostVsTargetAmount)}
                      </div>
                      <div>
                        <strong>% sobre Ideal</strong>:{" "}
                        {policyImpact.lostPctVsTarget || 0}%
                      </div>
                      <div>
                        <strong>% sobre Cobrado</strong>:{" "}
                        {policyImpact.lostPctVsCollected || 0}%
                      </div>
                    </Box>
                  }
                  arrow
                >
                  <Chip
                    size="small"
                    color={
                      (policyImpact.lostVsTargetAmount || 0) > 0
                        ? "warning"
                        : "default"
                    }
                    variant="outlined"
                    label={`Impacto política: ${money(
                      policyImpact.lostVsTargetAmount
                    )} • ${policyImpact.lostPctVsTarget || 0}% del Ideal`}
                  />
                </Tooltip>
              ) : null}
            </>
          ) : null}
        </Stack>

        {/* Controles de base de cálculo (sin “Nivel”) */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, opacity: 0.8 }}
            >
              Base de cálculo
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={dueMode}
              onChange={handleDueMode}
              aria-label="Base de cálculo del deber"
            >
              <ToggleButton value="ideal" aria-label="Ideal">
                Ideal
              </ToggleButton>
              <ToggleButton value="cuota" aria-label="Cuota">
                Cuota
              </ToggleButton>
              <ToggleButton value="vigente" aria-label="Real (vigente)">
                Real
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Stack>

      {/* Derecha: acciones */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ ml: "auto" }}
      >
        {onOpenFilters ? (
          <Tooltip title="Abrir filtros">
            <span>
              <IconButton
                onClick={onOpenFilters}
                disabled={loading}
                aria-label="Abrir filtros"
                size="small"
              >
                <TuneRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}

        {rightActions || null}

        <Button
          onClick={onReload}
          startIcon={<RefreshIcon />}
          variant="contained"
          size="small"
          disabled={loading}
          aria-label="Recalcular estadísticas"
          sx={{ textTransform: "uppercase", fontWeight: 800 }}
        >
          {loading ? "Actualizando…" : "Recalcular"}
        </Button>
      </Stack>
    </Box>
  );
}
