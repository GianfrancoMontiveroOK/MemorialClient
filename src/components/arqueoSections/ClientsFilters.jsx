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
  disabled,
}) {
  const isAsc = sortDir === "asc";
  const isDesc = sortDir === "desc";

  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, mb: 1.25 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
        <TextField
          size="small"
          label="Buscar (nombre, domicilio, id)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 260 }}
          disabled={disabled}
        />

        <TextField
          size="small"
          label="Ordenar por"
          select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 180 }}
          disabled={disabled}
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

        {/* Dirección: botones de flechas */}
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
                disabled={disabled}
                color={isAsc ? "primary" : "default"}
                sx={{
                  bgcolor: isAsc ? "action.selected" : "transparent",
                }}
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
                disabled={disabled}
                color={isDesc ? "primary" : "default"}
                sx={{
                  bgcolor: isDesc ? "action.selected" : "transparent",
                }}
              >
                <ArrowDownwardRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Button variant="brandYellow" onClick={onApply} disabled={disabled}>
          Aplicar
        </Button>
      </Stack>
    </Paper>
  );
}
