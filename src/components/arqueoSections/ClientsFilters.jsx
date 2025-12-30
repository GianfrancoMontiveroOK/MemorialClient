// src/components/admin/sectionsAdminPanel/ClientsFilters.jsx
import * as React from "react";
import {
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Box,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";

export default function ClientsFilters({
  q,
  setQ,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  onApply,
  loading, // 👈 renombralo para que sea claro
}) {
  const isAsc = sortDir === "asc";
  const isDesc = sortDir === "desc";

  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, mb: 1.25 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems="center"
      >
        <TextField
          size="small"
          label="Buscar (nombre, domicilio, id)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 260 }}
          disabled={false} // ✅ nunca deshabilitar para no perder foco
          InputProps={{
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={16} />
              </InputAdornment>
            ) : null,
          }}
        />

        <TextField
          size="small"
          label="Ordenar por"
          select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 180 }}
          disabled={loading}
        >
          {[
            "createdAt",
            "idCliente",
            "nombre",
            "ingreso",
            "cuota",
            "cuotaIdeal",
            "updatedAt",
          ].map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
        </TextField>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.5,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tooltip title="Ascendente">
            <span>
              <IconButton
                size="small"
                onClick={() => setSortDir("asc")}
                disabled={loading}
                color={isAsc ? "primary" : "default"}
                sx={{ bgcolor: isAsc ? "action.selected" : "transparent" }}
              >
                <ArrowUpwardRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Descendente">
            <span>
              <IconButton
                size="small"
                onClick={() => setSortDir("desc")}
                disabled={loading}
                color={isDesc ? "primary" : "default"}
                sx={{ bgcolor: isDesc ? "action.selected" : "transparent" }}
              >
                <ArrowDownwardRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Button variant="brandYellow" onClick={onApply} disabled={loading}>
          Aplicar
        </Button>
      </Stack>
    </Paper>
  );
}
