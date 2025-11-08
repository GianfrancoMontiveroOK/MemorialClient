import React from "react";
import { Box, Typography } from "@mui/material";

export default function PagosSection() {
  return (
    <Box>
          <Typography variant="h4" fontWeight={700} textTransform= "uppercase" mb={2}>Pagos</Typography>
      <Typography variant="body2" color="text.secondary">
        Próximamente: listado/tabla de pagos con filtros y paginación.
      </Typography>
    </Box>
  );
}
