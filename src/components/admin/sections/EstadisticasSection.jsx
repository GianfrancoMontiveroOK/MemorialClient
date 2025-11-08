import React from "react";
import { Box, Container } from "@mui/material";
import ClientesStats from "../../ClientesStats";

export default function EstadisticasSection() {
  return (
    <Box sx={{ py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <ClientesStats />
      </Container>
    </Box>
  );
}
