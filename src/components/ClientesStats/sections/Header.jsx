import React from "react";
import { Box, Typography, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function Header({ loading, onReload }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
        flexWrap: "wrap",
      }}
    >
      <Typography variant="h4" fontWeight={800}>
        Estadísticas
      </Typography>
      <Button
        onClick={onReload}
        startIcon={<RefreshIcon />}
        variant="outlined"
        size="small"
        disabled={loading}
      >
        {loading ? "Actualizando…" : "Recalcular"}
      </Button>
    </Box>
  );
}
