// src/components/collector/PaymentsHistory.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { fmtDate, fmtMoney } from "./utils";
import {
  listCollectorPayments,
  listCollectorReceipts,
} from "../../api/collector";

export default function PaymentsHistory({ clientId }) {
  const [tab, setTab] = useState("pagos"); // "pagos" | "recibos"
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

  // Fetch
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

        const resp =
          tab === "pagos"
            ? await listCollectorPayments(params)
            : await listCollectorReceipts(params);

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
  }, [clientId, tab, page, size, debouncedQ]);

  const openPdf = (row) => {
    if (!row) return;
    const url =
      row.pdfUrl ||
      (() => {
        const year = row.createdAt
          ? new Date(row.createdAt).getFullYear()
          : new Date().getFullYear();
        return `/files/receipts/${year}/${row._id}.pdf`;
      })();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onChangeTab = (_e, v) => {
    setPage(0);
    setTab(v);
    // limpiar errores al cambiar tab
    setErr("");
  };

  return (
    <Stack spacing={1}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tabs
            value={tab}
            onChange={onChangeTab}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 40,
                textTransform: "none",
                fontWeight: 800,
              },
            }}
          >
            <Tab label="Pagos" value="pagos" />
            <Tab label="Recibos" value="recibos" />
          </Tabs>
          <Box flex={1} />
          <TextField
            size="small"
            placeholder={tab === "pagos" ? "Buscar pagos…" : "Buscar recibos…"}
            value={q}
            onChange={(e) => {
              setPage(0);
              setQ(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
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

        <Table size="small">
          <TableHead>
            <TableRow>
              {tab === "pagos" ? (
                <>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="right">Importe</TableCell>
                  <TableCell>Recibo</TableCell>
                </>
              ) : (
                // TAB: RECIBOS → solo nombre del recibo + botón abrir
                <>
                  <TableCell>Recibo</TableCell>
                  <TableCell align="right">Abrir</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows?.map((it) => (
              <TableRow key={it._id}>
                {tab === "pagos" ? (
                  <>
                    <TableCell>
                      {fmtDate(it.createdAt || it.postedAt)}
                    </TableCell>
                    <TableCell>{it.method || it.metodo || "—"}</TableCell>
                    <TableCell align="right">
                      {fmtMoney(Number(it.amount || it.importe || 0))}
                    </TableCell>
                    <TableCell>
                      {it.receiptId || it.pdfUrl ? (
                        <Tooltip title="Ver PDF">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openPdf({
                                _id: it.receiptId || it._id,
                                createdAt: it.createdAt,
                                pdfUrl: it.pdfUrl,
                              })
                            }
                          >
                            <OpenInNewRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </>
                ) : (
                  // RECIBOS: solo nombre + botón
                  <>
                    <TableCell>
                      <Typography fontWeight={700}>
                        {it.number || it.numero || it._id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Abrir PDF">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openPdf(it)}
                            disabled={!it.pdfUrl && !it._id}
                          >
                            <OpenInNewRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}

            {/* Mensaje vacío */}
            {!loading && rows?.length === 0 && (
              <TableRow>
                <TableCell colSpan={tab === "pagos" ? 4 : 2}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: "center" }}
                  >
                    {tab === "pagos"
                      ? "Sin pagos para mostrar."
                      : "Sin recibos para mostrar."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
        />
      </Paper>
    </Stack>
  );
}
