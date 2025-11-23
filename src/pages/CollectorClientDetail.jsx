// src/pages/CollectorClientDetail.jsx (o donde lo tengas)
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Snackbar,
  Alert,
  Typography,
  Skeleton,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useCollector } from "../context";

import {
  ClientHeader,
  AccountCard,
  PaymentsHistory,
  ApplyPaymentDialog,
  ReceiptDialog,
  MapCard,
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

  // sección activa: 'payments' | 'account'
  const [activeSection, setActiveSection] = useState("account");

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

  const handleCloseToast = () =>
    setToast((t) => ({
      ...t,
      open: false,
    }));

  const handleGoBack = () => navigate(-1);

  return (
    <Box p={2} sx={{ maxWidth: 1100, mx: "auto" }}>
      <ClientHeader
        loading={loading && !r}
        client={r}
        cuotaVig={cuotaVig}
        canChargeNow={canChargeNow}
        onBack={handleGoBack}
        onOpenApply={() => setApplyOpen(true)}
      />

      {/* Botonera horizontal de secciones */}
      <Box mt={2} mb={1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": {
              height: 4,
            },
          }}
        >
          <Button
            size="small"
            variant={activeSection === "account" ? "contained" : "outlined"}
            onClick={() => setActiveSection("account")}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Estado de cuenta
          </Button>
          <Button
            size="small"
            variant={activeSection === "payments" ? "contained" : "outlined"}
            onClick={() => setActiveSection("payments")}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Historial de pagos
          </Button>
          {/* Si en el futuro sumás más secciones, las agregás acá */}
        </Stack>
      </Box>

      {/* Contenido según sección */}
      <Stack spacing={2}>
        {/* Sección: Historial de pagos */}
        {activeSection === "payments" && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <PaymentsHistory clientId={r?._id} />
          </Paper>
        )}

        {/* Sección: Estado de cuenta (incluye mapa como apoyo visual) */}
        {activeSection === "account" && (
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
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
        )}
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
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
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
