import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Stack,
  Typography,
  Paper,
  Divider,
  Button,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import { fmtMoney } from "./utils";

export default function ApplyPaymentDialog({
  open,
  onClose,
  client,
  debt,
  payAuto,
  payManual,
  onSuccess,
}) {
  const [tab, setTab] = useState("auto");
  const [payLoading, setPayLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (open) setTab("auto");
  }, [open]);

  useEffect(() => {
    if (!open || !Array.isArray(debt)) return;
    const r = debt
      .filter(
        (p) =>
          (p?.balance ?? 0) > 0 ||
          p?.status === "due" ||
          p?.status === "partial"
      )
      .map((p) => ({
        period: p.period,
        due: Number(p?.balance ?? p?.amountDue ?? 0) || 0,
        selected: false,
      }));
    setRows(r);
  }, [open, debt]);

  const totalManual = useMemo(
    () =>
      rows
        .filter((r) => r.selected)
        .reduce((acc, r) => acc + Number(r.due || 0), 0),
    [rows]
  );

  const autoTotal = useMemo(() => {
    if (!Array.isArray(debt)) return 0;
    return debt
      .filter((p) => (p?.balance ?? 0) > 0)
      .reduce((a, b) => a + (Number(b.balance) || 0), 0);
  }, [debt]);

  const updateRow = (period, checked) =>
    setRows((rows) =>
      rows.map((x) => (x.period === period ? { ...x, selected: checked } : x))
    );

  const handleConfirm = async () => {
    if (!client?._id) return;
    setPayLoading(true);
    try {
      let root;
      if (tab === "auto") {
        root = await payAuto(client._id, { method: "efectivo" });
      } else {
        const breakdown = rows
          .filter((r) => r.selected && r.due > 0)
          .map((r) => ({ period: r.period, amount: Number(r.due) }));
        if (!breakdown.length) {
          setPayLoading(false);
          return;
        }
        root = await payManual(client._id, breakdown, { method: "efectivo" });
      }
      if (root?.ok) onSuccess?.(root);
    } finally {
      setPayLoading(false);
    }
  };

  const hasClient = !!client;
  const noPendingRows = rows.length === 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={800}>
            Aplicar pago
          </Typography>
          {hasClient && (
            <Typography variant="body2" color="text.primary" noWrap>
              {client.nombre} · #{client.idCliente ?? "s/n"}
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          TabIndicatorProps={{
            sx: {
              height: 3,
              borderRadius: 999,
            },
          }}
          sx={{ mb: 2 }}
        >
          <Tab
            value="auto"
            label="Automático (FIFO)"
            sx={{
              textTransform: "none",
              fontSize: 13,
              minHeight: 40,
              "&.Mui-selected": {
                bgcolor: "action.selected",
                color: "text.primary",
                borderRadius: 999,
              },
            }}
          />
          <Tab
            value="manual"
            label="Manual (por período)"
            sx={{
              textTransform: "none",
              fontSize: 13,
              minHeight: 40,
              "&.Mui-selected": {
                bgcolor: "action.selected",
                color: "text.primary",
                borderRadius: 999,
              },
            }}
          />
        </Tabs>

        {tab === "auto" ? (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.primary">
              El sistema aplica el pago empezando por la deuda más antigua. Si
              el importe supera la deuda, el resto queda como crédito a favor.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography color="text.primary" variant="body2">
                Deuda detectada
              </Typography>
              <Typography fontWeight={800}>
                {fmtMoney(Number(autoTotal) || 0)}
              </Typography>
            </Paper>

            {autoTotal <= 0 && (
              <Typography variant="body2" color="text.primary">
                No se detectan saldos pendientes. Si existe un pago adelantado,
                se registrará como crédito.
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.primary">
              Seleccioná los períodos a cancelar. El total es la suma de los
              montos seleccionados.
            </Typography>

            <Stack
              spacing={0.75}
              sx={{ maxHeight: 300, overflow: "auto", pr: 0.5 }}
            >
              {rows.length ? (
                rows.map((row) => (
                  <Paper
                    key={row.period}
                    variant="outlined"
                    sx={{
                      px: 1,
                      py: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={row.selected}
                          onChange={(e) =>
                            updateRow(row.period, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Typography variant="body2">{row.period}</Typography>
                      }
                      sx={{ m: 0, mr: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ minWidth: 140, textAlign: "right" }}
                    >
                      A pagar: {fmtMoney(row.due)}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.primary">
                  No hay períodos con saldo pendiente para aplicar manualmente.
                </Typography>
              )}
            </Stack>

            <Divider />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2">Total seleccionado</Typography>
              <Typography fontWeight={800}>{fmtMoney(totalManual)}</Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={payLoading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<PaidIcon />}
          onClick={handleConfirm}
          disabled={
            payLoading ||
            !hasClient ||
            (tab === "manual" && (totalManual <= 0 || noPendingRows))
          }
        >
          {payLoading ? "Registrando…" : "Confirmar pago"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
