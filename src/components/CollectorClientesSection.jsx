// src/components/CollectorClientesSection.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import CollectorClientsTable from "./CollectorClientsTable";

export default function CollectorClientesSection({ onOpenCobro }) {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={1.5}
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
      >
        Clientes
      </Typography>

      <CollectorClientsTable onOpenCobro={onOpenCobro} />
    </Box>
  );
}
