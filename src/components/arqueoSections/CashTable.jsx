import * as React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Stack,
  TextField,
  MenuItem,
  Pagination,
  Box,
} from "@mui/material";
import { fmtMoney, fmtDateTime } from "./utils";

export default function CashTable({
  items,
  total,
  page,
  setPage,
  limit,
  setLimit,
  loading,
  totalPages,
  onReload,
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tipo/Lado</TableCell>
            <TableCell>Concepto</TableCell>
            <TableCell>Cuenta</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Fecha</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!items || items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Box py={3} textAlign="center" color="text.secondary">
                  {loading ? "Cargando…" : "Sin movimientos"}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((m) => (
              <TableRow
                key={m._id || `${m.postedAt}-${m.amount}-${Math.random()}`}
              >
                <TableCell>{m.type || m.side || "—"}</TableCell>
                <TableCell>
                  {m.concept || m.memo || m.description || "—"}
                </TableCell>
                <TableCell>{m.accountCode || "—"}</TableCell>
                <TableCell align="right">{fmtMoney(m.amount)}</TableCell>
                <TableCell>{fmtDateTime(m.postedAt || m.at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Divider />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ p: 1.25 }}
      >
        <TextField
          label="Filas"
          size="small"
          select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value) || 10);
            setPage(0);
            onReload();
          }}
          sx={{ width: 110 }}
          disabled={loading}
        >
          {[10, 25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
        <Pagination
          color="primary"
          page={page + 1}
          count={totalPages}
          onChange={(_, p1) => {
            setPage(p1 - 1);
            setTimeout(onReload, 0);
          }}
        />
      </Stack>
    </Paper>
  );
}
