import React from "react";
import { Box, Typography, Grid, Paper, Divider } from "@mui/material";

export default function ResumenSection({ resumen, ultimosPagos, ultimosUsuarios }) {
  const getMonto = (p) => (typeof p?.monto === "number" ? p.monto : p?.amount) ?? 0;
  const getCliente = (p) => p?.clienteNombre || p?.customer?.name || p?.customerName || "Cliente";
  const getEtiqueta = (p) => p?.receiptNumber || (p?._id ? `#${String(p._id).slice(-6)}` : "");

  return (
    <Box>
          <Typography variant="h4" fontWeight={700} textTransform= "uppercase" mb={3}>
        Panel SuperAdmin
      </Typography>

      <Grid container spacing={3}>
        {[{ label: "Usuarios", value: resumen?.usuarios },
          { label: "Clientes", value: resumen?.clientes },
          { label: "Pagos", value: resumen?.pagos }].map((item) => (
          <Grid item xs={12} md={4} key={item.label}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                background:
                  "linear-gradient(145deg, rgba(47,111,237,0.10), rgba(47,111,237,0.05))",
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                {item.value ?? "–"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Últimos pagos</Typography>
          {(ultimosPagos || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin registros recientes.</Typography>
          ) : (
            ultimosPagos.map((pago) => (
              <Box key={pago._id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>{getCliente(pago)}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap" }}>
                  ${getMonto(pago).toLocaleString("es-AR")}
                </Typography>
                {getEtiqueta(pago) && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: "nowrap" }}>
                    {getEtiqueta(pago)}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Nuevos usuarios</Typography>
          {(ultimosUsuarios || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin registros recientes.</Typography>
          ) : (
            ultimosUsuarios.map((u) => (
              <Box key={u._id} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Typography variant="body2">{u.name || u.username || "Usuario"}</Typography>
                <Typography variant="body2" color="text.secondary">{u.email || "—"}</Typography>
              </Box>
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
