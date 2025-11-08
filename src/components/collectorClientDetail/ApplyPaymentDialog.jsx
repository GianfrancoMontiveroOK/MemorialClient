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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Aplicar pago</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="Automático (FIFO)" value="auto" />
          <Tab label="Manual (por período)" value="manual" />
        </Tabs>

        {tab === "auto" ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Se aplica desde la deuda más antigua. Si sobra, queda como
              crédito.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Deuda detectada</Typography>
                <Typography fontWeight={800}>
                  {fmtMoney(
                    Number(
                      debt
                        ?.filter((p) => (p.balance ?? 0) > 0)
                        .reduce((a, b) => a + (b.balance || 0), 0)
                    ) || 0
                  )}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Seleccioná períodos a cancelar. El total es la suma.
            </Typography>
            <Stack spacing={0.75} sx={{ maxHeight: 300, overflow: "auto" }}>
              {rows.length ? (
                rows.map((row) => (
                  <Stack
                    key={row.period}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    justifyContent="space-between"
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
                      sx={{ mr: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ minWidth: 140, textAlign: "right" }}
                    >
                      A pagar: {fmtMoney(row.due)}
                    </Typography>
                  </Stack>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay períodos con saldo pendiente.
                </Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography>Total seleccionado</Typography>
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
            payLoading || !client || (tab === "manual" && totalManual <= 0)
          }
        >
          {payLoading ? "Registrando…" : "Confirmar pago"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
