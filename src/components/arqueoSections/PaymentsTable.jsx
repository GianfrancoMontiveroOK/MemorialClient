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

export default function PaymentsTable({
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
            <TableCell>Ref/Recibo</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Método</TableCell>
            <TableCell>Cuenta</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Fecha</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!items || items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Box py={3} textAlign="center" color="text.secondary">
                  {loading ? "Cargando…" : "Sin pagos"}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((p) => (
              <TableRow
                key={p._id || `${p.postedAt}-${p.amount}-${Math.random()}`}
              >
                <TableCell>{p.receiptId || p.ref || "—"}</TableCell>
                <TableCell>
                  {p.clientName
                    ? `${p.clientId || ""} — ${p.clientName}`
                    : p.clientId || "—"}
                </TableCell>
                <TableCell>{p.method || p.paymentMethod || "—"}</TableCell>
                <TableCell>{p.accountCode || "—"}</TableCell>
                <TableCell align="right">{fmtMoney(p.amount)}</TableCell>
                <TableCell>{fmtDateTime(p.postedAt || p.at)}</TableCell>
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
