import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Snackbar,
  Alert,
  Typography,
  Skeleton,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useCollector } from "../context";

import {
  ClientHeader,
  AccountCard,
  PaymentsHistory,
  ApplyPaymentDialog,
  ReceiptDialog,
  MapCard, // ⬅️ nuevo
  buildAddress,
  fmtMoney,
} from "../components/collectorClientDetail";

export default function CollectorClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    loading,
    err,
    selectedClient: r,
    fetchCollectorClientById,
    debtLoading,
    debt,
    debtSummary,
    fetchCollectorClientDebt,
    payAuto,
    payManual,
  } = useCollector();

  useEffect(() => {
    if (!id) return;
    (async () => {
      await fetchCollectorClientById(id);
      await fetchCollectorClientDebt(id, { includeFuture: 1 });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addr = useMemo(() => buildAddress(r || {}), [r]);
  const cuotaVig = useMemo(
    () =>
      r?.cuotaVigente ?? (r?.usarCuotaIdeal ? r?.cuotaIdeal : r?.cuota) ?? 0,
    [r]
  );

  const [applyOpen, setApplyOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [toast, setToast] = useState({ open: false, sev: "info", msg: "" });

  const canChargeNow = Boolean(
    debtSummary?.canChargeNow ??
      (Array.isArray(debt)
        ? debt.some(
            (p) =>
              (p.balance ?? 0) > 0 && new Date(p.period + "-01") <= new Date()
          )
        : false)
  );

  const onPaymentSuccess = (root) => {
    setLastReceipt(root?.data || null);
    setApplyOpen(false);
    setReceiptOpen(true);
    setToast({
      open: true,
      sev: "success",
      msg: `Pago registrado: ${fmtMoney(
        Number(root?.data?.pago?.amount ?? root?.data?.payment?.amount ?? 0) ||
          0
      )}`,
    });
    if (r?._id) fetchCollectorClientDebt(r._id, { includeFuture: 1 });
  };

  return (
    <Box p={2} sx={{ maxWidth: 1100, mx: "auto" }}>
      <ClientHeader
        loading={loading && !r}
        client={r}
        cuotaVig={cuotaVig}
        canChargeNow={canChargeNow}
        onBack={() => navigate(-1)}
        onOpenApply={() => setApplyOpen(true)}
      />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        {/* Seguimiento del cobrador: Pagos / Recibos */}
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <PaymentsHistory clientId={r?._id} />
        </Paper>

        {/* Lateral derecho: Estado de cuenta + Mapa */}
        <Stack spacing={2} sx={{ width: { xs: "100%", lg: 380 } }}>
          <AccountCard
            debtLoading={debtLoading}
            debt={debt}
            debtSummary={debtSummary}
            onOpenApply={() => setApplyOpen(true)}
            canApply={Boolean(r)}
          />

          <MapCard
            address={addr}
            onOpenMaps={() =>
              addr &&
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  addr
                )}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          />
        </Stack>
      </Stack>

      {err ? (
        <Typography mt={2} color="error">
          {String(err)}
        </Typography>
      ) : null}

      <ApplyPaymentDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        client={r}
        debt={debt}
        payAuto={payAuto}
        payManual={payManual}
        onSuccess={onPaymentSuccess}
      />

      <ReceiptDialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        client={r}
        lastReceipt={lastReceipt}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

      {!r && loading ? (
        <Stack mt={2} spacing={1}>
          <Skeleton height={28} />
          <Skeleton height={160} />
        </Stack>
      ) : null}
    </Box>
  );
}
