// src/components/CollectorMiCarteraSection.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

export default function CollectorMiCarteraSection() {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={1.5}
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
      >
        Mi cartera
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Próximamente vas a ver un resumen visual de tu cartera: clientes por
        zona, saldos pendientes, proyección de cobro y rutas sugeridas.
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Por ahora, podés gestionar tus clientes desde la sección{" "}
        <strong>Clientes</strong>.
      </Typography>
    </Box>
  );
}
