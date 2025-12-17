// src/components/collectorClientDetail/AccountCard.jsx
import React, { useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Stack,
  Chip,
  Skeleton,
  Divider,
  Button,
  LinearProgress,
  Tooltip,
  IconButton,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "./utils";

/* ---------- helpers ---------- */
const statusChip = (s) => {
  switch (s) {
    case "due":
      return { color: "warning", variant: "filled", label: "Vencido" };
    case "partial":
      return { color: "warning", variant: "outlined", label: "Parcial" };
    case "open":
      return { color: "default", variant: "outlined", label: "Abierto" };
    case "future":
      return { color: "default", variant: "outlined", label: "Futuro" };
    case "credit":
      return { color: "info", variant: "outlined", label: "Crédito" };
    case "paid":
    default:
      return { color: "success", variant: "outlined", label: "Pagado" };
  }
};

const periodToNum = (p = "") => Number(String(p).replace("-", "")) || 0; // "2025-12" => 202512
const nowPeriodNum = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return Number(`${d.getFullYear()}${mm}`);
};

/* ---------- agrupador con FIX de estados futuros ---------- */
function useGroupedDebt(debt) {
  return useMemo(() => {
    if (!Array.isArray(debt)) return [];
    const map = new Map();
    const nowNum = nowPeriodNum();

    for (const p of debt) {
      const key = p?.period;
      if (!key) continue;

      const charge = Number(p?.charge ?? p?.amountDue ?? 0) || 0;
      const paid = Number(p?.paid ?? 0) || 0;
      const balance =
        p?.balance != null
          ? Number(p.balance) || 0
          : Math.round((charge - paid) * 100) / 100;

      const prev = map.get(key) || {
        period: key,
        charge: 0,
        paid: 0,
        balance: 0,
        status: "open",
      };

      prev.charge += charge;
      prev.paid += paid;
      prev.balance += balance;

      // Resolver estado
      let st = p?.status || prev.status;
      const isFutureByDate = periodToNum(key) > nowNum;

      if (st === "future") {
        // Mantener "future" salvo que exista crédito
        if (prev.balance < 0) st = "credit";
      } else {
        if (prev.balance < 0) st = "credit";
        else if (prev.balance > 0 && prev.paid > 0) st = "partial";
        else if (prev.balance > 0 && prev.paid === 0) {
          st = isFutureByDate ? "future" : "due";
        } else if (prev.balance === 0) {
          // Cero no implica "paid" si el período es futuro
          st = isFutureByDate ? "future" : "paid";
        }
      }

      prev.status = st;
      map.set(key, prev);
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => a.period.localeCompare(b.period)); // ascendente YYYY-MM
    return rows;
  }, [debt]);
}

/* ---------- componente ---------- */
export default function AccountCard({
  debtLoading,
  debt,
  debtSummary,
  onOpenApply,
  canApply,
}) {
  const grouped = useGroupedDebt(debt);
  const [showAll, setShowAll] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const dueCount = useMemo(
    () => grouped.filter((p) => p.balance > 0 && p.status !== "future").length,
    [grouped]
  );

  const creditTotal = useMemo(
    () =>
      grouped
        .filter((p) => p.balance < 0)
        .reduce((acc, r) => acc + Math.abs(r.balance), 0),
    [grouped]
  );

  const totalDue = useMemo(() => {
    if (debtSummary?.totalDue != null) return Number(debtSummary.totalDue);
    return grouped
      .filter((p) => p.balance > 0 && p.status !== "future")
      .reduce((a, b) => a + b.balance, 0);
  }, [debtSummary, grouped]);

  const visibleRows = useMemo(() => {
    const rows = grouped;
    if (showAll) return rows;
    return rows.slice(Math.max(rows.length - 8, 0)); // últimos 8
  }, [grouped, showAll]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
        spacing={1}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={800}>
            Estado de cuenta
          </Typography>
          {!debtLoading && (
            <Typography variant="caption" color="text.secondary">
              Resumen por período (mensual)
            </Typography>
          )}
        </Stack>

        {!debtLoading && grouped.length > 8 && (
          <Tooltip
            title={showAll ? "Ver menos períodos" : "Ver todos los períodos"}
          >
            <IconButton size="small" onClick={() => setShowAll((s) => !s)}>
              {showAll ? <ExpandLessRounded /> : <ExpandMoreRounded />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Badges resumen */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5} rowGap={0.75}>
        {debtLoading ? (
          <>
            <Skeleton variant="rounded" height={24} width={120} />
            <Skeleton variant="rounded" height={24} width={140} />
          </>
        ) : (
          <>
            {dueCount > 0 ? (
              <Chip
                size="small"
                color="warning"
                label={`Debe ${dueCount} período${dueCount > 1 ? "s" : ""}`}
              />
            ) : (
              <Chip size="small" color="success" label="Al día" />
            )}
            {creditTotal > 0 ? (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`Crédito ${fmtMoney(creditTotal)}`}
              />
            ) : null}
          </>
        )}
      </Stack>

      {/* Lista de períodos */}
      <Stack
        spacing={0.5}
        sx={{
          maxHeight: isMobile ? 260 : 220,
          overflow: "auto",
          pr: 0.5,
          "&::-webkit-scrollbar": {
            height: 4,
            width: 4,
          },
        }}
      >
        {debtLoading ? (
          <>
            <Skeleton height={22} />
            <Skeleton height={22} />
            <Skeleton height={22} />
          </>
        ) : visibleRows.length ? (
          <AnimatePresence initial={false}>
            {visibleRows.map((p) => {
              const paidAmt = Math.max(
                0,
                Number(p.charge || 0) - Number(p.balance || 0)
              );
              const ratio =
                p.charge > 0
                  ? Math.min(100, Math.max(0, (100 * paidAmt) / p.charge))
                  : p.balance <= 0
                  ? 100
                  : 0;

              const chipCfg = statusChip(p.status);

              return (
                <motion.div
                  key={p.period}
                  initial={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <Box
                    sx={{
                      p: 0.75,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor:
                        p.status === "due"
                          ? "warning.light"
                          : p.status === "credit"
                          ? "info.light"
                          : "divider",
                      bgcolor:
                        p.status === "future" ? "action.hover" : "transparent",
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ minWidth: 0 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {p.period}
                          </Typography>
                          <Chip
                            size="small"
                            color={chipCfg.color}
                            variant={chipCfg.variant}
                            label={chipCfg.label}
                          />
                        </Stack>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color={
                            p.balance > 0
                              ? "warning.main"
                              : p.balance < 0
                              ? "info.main"
                              : "success.main"
                          }
                          sx={{ ml: 1 }}
                        >
                          {fmtMoney(Number(p.balance || 0))}
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={ratio}
                        sx={{
                          mt: 0.5,
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "action.hover",
                        }}
                      />

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Cargo: {fmtMoney(Number(p.charge || 0))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pagado: {fmtMoney(paidAmt)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin períodos para mostrar.
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* Resumen + botón */}
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Deuda detectada
            </Typography>
            {!debtLoading && (
              <Typography variant="caption" color="text.disabled">
                (excluye períodos futuros)
              </Typography>
            )}
          </Box>

          <Box
            component={motion.span}
            key={debtLoading ? "loading" : totalDue}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.2 }}
            sx={{
              fontWeight: 800,
              fontSize: isMobile ? "1rem" : "1.05rem",
            }}
          >
            {debtLoading ? "—" : fmtMoney(Number(totalDue) || 0)}
          </Box>
        </Stack>

        <Button
          variant="brandYellow"
          size="small"
          startIcon={<TuneIcon />}
          onClick={onOpenApply}
          disabled={!canApply}
          fullWidth={isMobile}
        >
          Aplicar pago
        </Button>
      </Stack>
    </Paper>
  );
}
