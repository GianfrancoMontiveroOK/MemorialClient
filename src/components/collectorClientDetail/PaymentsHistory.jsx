// src/components/collector/PaymentsHistory.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  TablePagination,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { fmtDate, fmtMoney } from "./utils";
import { listCollectorPayments } from "../../api/collector";

export default function PaymentsHistory({ clientId }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(0); // UI 0-based
  const [size, setSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Debounce de búsqueda (250ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch pagos (ya vienen con receipt dentro)
  useEffect(() => {
    if (!clientId) {
      setRows([]);
      setTotal(0);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const params = {
          page: page + 1, // API 1-based
          limit: size,
          clientId,
        };
        if (debouncedQ) params.q = debouncedQ;

        const resp = await listCollectorPayments(params);

        const root = resp?.data ?? resp ?? {};
        const items = Array.isArray(root.items)
          ? root.items
          : root.data?.items ?? [];
        const totalIn = Number(root.total ?? root.data?.total ?? items.length);

        if (!cancelled) {
          setRows(items);
          setTotal(totalIn);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e?.response?.data?.message ||
            e?.message ||
            "Ocurrió un error al cargar los datos.";
          setErr(msg);
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, page, size, debouncedQ]);

  // Abre un PDF de recibo (usamos el receipt que viene dentro del pago)
  const openPdf = (receipt) => {
    if (!receipt) return;
    const year = receipt.createdAt
      ? new Date(receipt.createdAt).getFullYear()
      : new Date().getFullYear();

    const url = receipt.pdfUrl || `/files/receipts/${year}/${receipt._id}.pdf`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Stack spacing={1}>
      {/* HEADER: título + buscador */}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ minWidth: 80 }}
          >
            Historial de pagos
          </Typography>
        </Stack>
      </Paper>

      {err && (
        <Alert severity="error" variant="outlined">
          {err}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 0, position: "relative" }}>
        {loading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "background.paper",
              opacity: 0.6,
              zIndex: 1,
            }}
          >
            <CircularProgress size={28} />
          </Stack>
        )}

        {/* Tabla scrollable horizontal en mobile */}
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Método</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell>Recibo</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows?.map((it) => {
                const receipt = it.receipt || null;

                return (
                  <TableRow key={it._id}>
                    <TableCell>
                      {fmtDate(it.createdAt || it.postedAt)}
                    </TableCell>
                    <TableCell>{it.method || it.metodo || "—"}</TableCell>
                    <TableCell align="right">
                      {fmtMoney(Number(it.amount || it.importe || 0))}
                    </TableCell>
                    <TableCell>
                      {receipt ? (
                        <Tooltip
                          title={
                            receipt.number
                              ? `Ver recibo ${receipt.number}`
                              : "Ver PDF de recibo"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openPdf(receipt)}
                            >
                              <OpenInNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin recibo
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && rows?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: "center" }}
                    >
                      Sin pagos para mostrar.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => {
            setPage(0);
            setSize(parseInt(e.target.value, 10));
          }}
          rowsPerPageOptions={[10, 20, 50]}
          sx={{
            "& .MuiTablePagination-toolbar": {
              px: 1,
              gap: { xs: 1, sm: 2 },
            },
            "& .MuiTablePagination-selectLabel": {
              display: { xs: "none", sm: "block" },
            },
            "& .MuiTablePagination-input": {
              marginRight: { xs: 1, sm: 2 },
            },
            "& .MuiTablePagination-displayedRows": {
              fontSize: 12,
            },
          }}
        />
      </Paper>
    </Stack>
  );
}
