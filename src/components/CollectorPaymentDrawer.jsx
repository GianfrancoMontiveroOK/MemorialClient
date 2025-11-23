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
  Chip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PaymentsIcon from "@mui/icons-material/Payments";

const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
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
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [metodo, setMetodo] = useState("efectivo");
  const [ref, setRef] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!open) return;
    setMonto(
      client?.cuota != null && !Number.isNaN(Number(client.cuota))
        ? String(client.cuota)
        : ""
    );
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="h6" fontWeight={800}>
            Registrar cobro
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {client && (
          <Stack spacing={0.5} mt={1}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              noWrap
              title={client.nombre}
            >
              {client.nombre} · #{client.idCliente ?? "s/n"}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              label={`Cuota sugerida: ${fmtMoney(Number(client?.cuota || 0))}`}
              sx={{ alignSelf: "flex-start" }}
            />
          </Stack>
        )}
      </Box>

      <Divider />

      {/* Formulario (scrollable si hace falta) */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          pt: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {client ? (
          <>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
            >
              Datos del cobro
            </Typography>

            <TextField
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              fullWidth
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
                inputProps: { min: 0 },
              }}
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

            <TextField
              label="Método de pago"
              select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              fullWidth
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
            </TextField>

            <TextField
              label="Referencia / Comprobante"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              fullWidth
              placeholder="Últimos 4, nro de transferencia, etc. (opcional)"
            />

            <TextField
              label="Observaciones"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="Notas internas sobre este cobro (opcional)"
            />

            {/* Botones */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="flex-end"
              mt={1}
            >
              <Button
                onClick={onClose}
                color="inherit"
                disabled={loading}
                fullWidth={true}
                sx={{ order: { xs: 2, sm: 1 } }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={18} /> : <PaymentsIcon />
                }
                disabled={!canSubmit || loading}
                fullWidth={true}
                sx={{ order: { xs: 1, sm: 2 } }}
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
