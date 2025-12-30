import * as React from "react";
import { Paper, Stack, TextField, MenuItem, Button } from "@mui/material";

export default function BoxFilters({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  sideFilter,
  setSideFilter,
  accountCodes,
  setAccountCodes,
  onApply,
  disabled,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 1.5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        <TextField
          size="small"
          type="date"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          sx={{ minWidth: 160 }}
          disabled={disabled}
        />
        <TextField
          size="small"
          type="date"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          sx={{ minWidth: 160 }}
          disabled={disabled}
        />
        <TextField
          size="small"
          select
          label="Lado"
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          disabled={disabled}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="debit">Ingresos</MenuItem>
          <MenuItem value="credit">Egresos</MenuItem>
        </TextField>

        <Button
          variant="brandYellow"
          onClick={onApply}
          disabled={disabled}
          sx={{ minWidth: 90 }}
        >
          Aplicar
        </Button>
      </Stack>
    </Paper>
  );
}
