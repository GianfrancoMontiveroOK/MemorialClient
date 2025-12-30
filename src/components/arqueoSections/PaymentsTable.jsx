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
  TableContainer,
  Button,
  Tooltip,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
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
  const openReceipt = (url) => {
    const u = String(url || "").trim();
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      {/* ✅ Contenedor scrolleable horizontal (igual que CashTable) */}
      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 920,
            "& th, & td": { whiteSpace: "nowrap" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Ref/Recibo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Cuenta</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="center">PDF</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!items || items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    {loading ? "Cargando…" : "Sin pagos"}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => {
                // ⬇️ ESTE ES EL CAMPO QUE DEBE VENIR DEL BACKEND (Receipt.pdfUrl)
                const pdfUrl =
                  p.receiptPdfUrl || p.pdfUrl || p.receiptUrl || null;

                return (
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

                    <TableCell align="center">
                      {!pdfUrl ? (
                        <Box component="span" color="text.secondary">
                          —
                        </Box>
                      ) : (
                        <Tooltip title="Abrir recibo PDF">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PictureAsPdfRoundedIcon />}
                            endIcon={<OpenInNewRoundedIcon />}
                            onClick={() => openReceipt(pdfUrl)}
                          >
                            Abrir
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
