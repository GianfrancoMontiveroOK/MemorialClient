import * as React from "react";
import { Paper, Stack, TextField, MenuItem, Button } from "@mui/material";

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
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, mb: 1.25 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
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
        <TextField
          size="small"
          label="Dirección"
          select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          sx={{ width: 140 }}
          disabled={disabled}
        >
          <MenuItem value="desc">desc</MenuItem>
          <MenuItem value="asc">asc</MenuItem>
        </TextField>
        <Button variant="contained" onClick={onApply} disabled={disabled}>
          Aplicar
        </Button>
      </Stack>
    </Paper>
  );
}
