// src/components/arqueoSections/CollectorCommissionSection.jsx
import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

import {
  getCollectorCommissionSummaryAdmin,
  pagarComisionCobrador,
} from "../../api/arqueos";
import { fmtMoney } from "./utils";

export default function CollectorCommissionSection({
  user,
  dateFrom,
  dateTo,
  disabled = false,
  onAfterPay,
  setToast,
}) {
  const userId = user?.userId;
  const userIdOk =
    userId !== undefined && userId !== null && String(userId) !== "";

  const [loading, setLoading] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [summary, setSummary] = React.useState(null);

  const loadSummary = React.useCallback(async () => {
    if (!userIdOk) return;
    setLoading(true);
    try {
      const res = await getCollectorCommissionSummaryAdmin({
        userId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const data = res?.data?.data || res?.data || null;
      setSummary(data || null);
    } catch (e) {
      console.error(e);
      setSummary(null);
      setToast &&
        setToast({
          open: true,
          sev: "error",
          msg:
            e?.response?.data?.message ||
            e?.message ||
            "No se pudo cargar el resumen de comisiones.",
        });
    } finally {
      setLoading(false);
    }
  }, [userIdOk, userId, dateFrom, dateTo, setToast]);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ───────── Mapear amounts según respuestas posibles del backend ─────────
  const commissions = summary?.commissions || null;
  const amounts =
    commissions?.amounts || summary?.amounts || {}; // soporta ambos shapes

  const totalCommission = Number(amounts.totalCommission || 0);
  const totalCommissionNoPenalty = Number(
    amounts.totalCommissionNoPenalty || 0
  );
  const alreadyPaid = Number(
    amounts.alreadyPaid || amounts.alreadyPaidAfter || 0
  );
  const pendingRaw =
    amounts.pendingAfter ??
    amounts.pending ??
    Math.max(totalCommission - alreadyPaid, 0);
  const pending = Number(pendingRaw || 0);

  // ───────── Label del período ─────────
  const periodLabel = React.useMemo(() => {
    if (summary?.month?.label) return summary.month.label;
    if (summary?.month?.period) return `Período: ${summary.month.period}`;

    if (summary?.range?.from || summary?.range?.to) {
      const from = summary.range.from
        ? new Date(summary.range.from).toISOString().slice(0, 10)
        : "";
      const to = summary.range.to
        ? new Date(summary.range.to).toISOString().slice(0, 10)
        : "";
      if (from && to) return `Período: ${from} al ${to}`;
      if (from) return `Desde: ${from}`;
      if (to) return `Hasta: ${to}`;
    }
    if (summary?.period) return `Período: ${summary.period}`;

    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) return `Período: ${dateFrom} al ${dateTo}`;
      if (dateFrom) return `Desde: ${dateFrom}`;
      if (dateTo) return `Hasta: ${dateTo}`;
    }

    return "Período: mes actual";
  }, [summary, dateFrom, dateTo]);

  // ───────── Pago de comisión: SIEMPRE TODO EL PENDING ─────────
  const handlePay = async () => {
    if (!userIdOk || pending <= 0) return;

    // Elegir cuenta de origen
    const choiceRaw = window.prompt(
      "¿Desde qué caja querés pagar la comisión?\n" +
        "1 = CAJA_CHICA\n" +
        "2 = CAJA_ADMIN",
      "1"
    );
    if (choiceRaw === null) return; // canceló

    const choice = choiceRaw.trim();
    let sourceAccountCode = "CAJA_CHICA";
    if (choice === "2") {
      sourceAccountCode = "CAJA_ADMIN";
    }

    const amount = pending; // siempre TODO lo pendiente

    const note =
      window.prompt("Nota opcional para el pago de comisión:", "") || "";

    const confirmMsg = `¿Confirmás pagar ${fmtMoney(
      amount
    )} de comisión al cobrador desde ${sourceAccountCode}?`;
    if (!window.confirm(confirmMsg)) return;

    setPaying(true);
    try {
      await pagarComisionCobrador({
        userId,
        amount,
        note,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sourceAccountCode,
      });

      setToast &&
        setToast({
          open: true,
          sev: "success",
          msg: "Comisión pagada correctamente.",
        });

      await loadSummary();
      onAfterPay && onAfterPay();
    } catch (e) {
      console.error(e);
      setToast &&
        setToast({
          open: true,
          sev: "error",
          msg:
            e?.response?.data?.message ||
            e?.message ||
            "No se pudo registrar el pago de comisión.",
        });
    } finally {
      setPaying(false);
    }
  };

  if (!userIdOk) return null;

  return (
    <Box
      sx={(theme) => ({
        mb: 1.5,
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
            <PaidRoundedIcon fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>
              Resumen de comisiones
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {periodLabel}
          </Typography>

          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Calculando comisiones...
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Stack spacing={0.25}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <MonetizationOnRoundedIcon fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Comisión ideal
                  </Typography>
                </Stack>
                <Typography variant="subtitle2">
                  {fmtMoney(totalCommissionNoPenalty)}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ReceiptLongRoundedIcon fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    Comisión con penalidad
                  </Typography>
                </Stack>
                <Typography variant="subtitle2">
                  {fmtMoney(totalCommission)}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Ya pagado
                </Typography>
                <Typography variant="subtitle2">
                  {fmtMoney(alreadyPaid)}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Box>

        <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Typography variant="caption" color="text.secondary">
            Comisión pendiente
          </Typography>
          <Typography
            variant="h6"
            sx={(theme) => ({
              color:
                pending > 0
                  ? theme.palette.warning.main
                  : theme.palette.text.secondary,
            })}
          >
            {fmtMoney(pending)}
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={handlePay}
            disabled={disabled || paying || loading || pending <= 0}
          >
            {paying ? (
              <CircularProgress size={18} sx={{ color: "inherit" }} />
            ) : (
              "Pagar comisión"
            )}
          </Button>
          {pending <= 0 && !loading && (
            <Typography variant="caption" color="text.secondary">
              No hay comisión pendiente para este período.
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
