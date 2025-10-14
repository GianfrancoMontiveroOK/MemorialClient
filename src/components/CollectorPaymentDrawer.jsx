import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Alert,
  Button,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PaymentsIcon from "@mui/icons-material/Payments";

const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
    : "—";

export default function CollectorPaymentDrawer({
  open,
  onClose,
  client,
  onCreatePayment,
  loading = false,
  error = "",
}) {
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [metodo, setMetodo] = useState("efectivo");
  const [ref, setRef] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!open) return;
    setMonto(client?.cuota ?? "");
    setFecha(new Date().toISOString().slice(0, 10));
    setMetodo("efectivo");
    setRef("");
    setObs("");
  }, [open, client]);

  const canSubmit = useMemo(() => {
    const m = Number(monto);
    return Number.isFinite(m) && m > 0 && Boolean(fecha);
  }, [monto, fecha]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    const payload = {
      monto: Number(monto),
      fecha,
      metodo,
      referencia: ref || undefined,
      observaciones: obs || undefined,
      clienteId: client?._id,
      idCliente: client?.idCliente,
    };
    await onCreatePayment?.(client, payload);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800}>
            Cobrar
          </Typography>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>
      <Divider />
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, display: "grid", gap: 2 }}>
        {client ? (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              {client.nombre} · #{client.idCliente ?? "s/n"}
            </Typography>
            <TextField
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value === "" ? "" : Number(e.target.value))}
              fullWidth
              required
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              helperText={`Cuota sugerida: ${fmtMoney(client?.cuota)}`}
            />
            <TextField
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Método" select value={metodo} onChange={(e) => setMetodo(e.target.value)} fullWidth>
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
            </TextField>
            <TextField label="Referencia / Comprobante" value={ref} onChange={(e) => setRef(e.target.value)} fullWidth />
            <TextField
              label="Observaciones"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={onClose}>Cancelar</Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} /> : <PaymentsIcon />}
                disabled={!canSubmit || loading}
              >
                Registrar cobro
              </Button>
            </Stack>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Seleccioná un cliente para cobrar.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
