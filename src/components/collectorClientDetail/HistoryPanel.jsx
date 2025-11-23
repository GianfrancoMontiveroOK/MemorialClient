import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
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
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { digits, fmtDate, fmtMoney } from "./utils";

export default function HistoryPanel({ clientId, idCliente, phone }) {
  const [tab, setTab] = useState("pagos");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!clientId) return;
    const ctrl = new AbortController();

    (async () => {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("size", String(size));
      if (q) params.set("q", q);
      if (clientId) params.set("clientId", clientId);

      let url = "";
      if (tab === "pagos") url = `/api/collector/pagos?${params}`;
      if (tab === "recibos") url = `/api/adminReceipts/receipts?${params}`; // cuando tengas /collector/receipts, apúntalo
      if (tab === "ledger")
        url = `/api/adminTransactions/transactions?${params}`; // filtrar por clientId en BE
      if (tab === "outbox") url = `/api/adminOutbox/events?${params}`; // si existe

      if (!url) return;
      const res = await fetch(url, {
        credentials: "include",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json.items || []);
      setTotal(json.total || 0);
    })().catch(() => {});

    return () => ctrl.abort();
  }, [clientId, tab, q, page, size]);

  const phoneDigits = digits(phone || "");
  const openWhats = () => {
    const url = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
          `Hola, te escribe *Memorial*. Te comparto información de tus pagos del grupo #${
            idCliente ?? "-"
          }`
        )}`
      : `https://wa.me/?text=${encodeURIComponent(
          "Hola, te escribe *Memorial*."
        )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleChangeTab = (_e, value) => {
    setPage(0);
    setTab(value);
  };

  return (
    <Stack spacing={1}>
      {/* HEADER: búsqueda + WhatsApp */}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box sx={{ flex: 1, width: "100%" }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar en el historial…"
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
            />
          </Box>

          <Tooltip title="Enviar WhatsApp con resumen">
            <span>
              <IconButton
                color="success"
                onClick={openWhats}
                disabled={!phoneDigits}
              >
                <WhatsAppIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* TABS: Pagos / Recibos / Ledger / Outbox */}
      <Paper variant="outlined" sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          TabIndicatorProps={{
            sx: {
              height: 3,
              borderRadius: 999,
            },
          }}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              minHeight: 36,
              px: 1.5,
            },
            "& .MuiTab-root.Mui-selected": {
              bgcolor: "action.selected",
              color: "text.primary",
              borderRadius: 999,
            },
          }}
        >
          <Tab label="Pagos" value="pagos" />
          <Tab label="Recibos" value="recibos" />
          <Tab label="Ledger" value="ledger" />
          <Tab label="Outbox" value="outbox" />
        </Tabs>
      </Paper>

      {/* TABLA */}
      <Paper variant="outlined" sx={{ p: 0 }}>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tab === "pagos" && (
                  <>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell align="right">Importe</TableCell>
                    <TableCell>Comprobante</TableCell>
                  </>
                )}
                {tab === "recibos" && (
                  <>
                    <TableCell>N° Recibo</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Importe</TableCell>
                    <TableCell>PDF</TableCell>
                  </>
                )}
                {tab === "ledger" && (
                  <>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </>
                )}
                {tab === "outbox" && (
                  <>
                    <TableCell>Evento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Creado</TableCell>
                    <TableCell>Intentos</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows?.map((it) => (
                <TableRow key={it._id}>
                  {tab === "pagos" && (
                    <>
                      <TableCell>
                        {fmtDate(it.createdAt || it.postedAt)}
                      </TableCell>
                      <TableCell>{it.method || it.metodo || "—"}</TableCell>
                      <TableCell align="right">
                        {fmtMoney(Number(it.amount || it.importe || 0))}
                      </TableCell>
                      <TableCell>
                        {it.receiptId ? (
                          <Tooltip title="Ver PDF">
                            <IconButton
                              size="small"
                              onClick={() =>
                                window.open(
                                  `/files/receipts/${new Date(
                                    it.createdAt
                                  ).getFullYear()}/${it.receiptId}.pdf`,
                                  "_blank"
                                )
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
                  )}

                  {tab === "recibos" && (
                    <>
                      <TableCell>{it.number || it.numero || "—"}</TableCell>
                      <TableCell>{fmtDate(it.createdAt)}</TableCell>
                      <TableCell align="right">
                        {fmtMoney(Number(it.amount || it.importe || 0))}
                      </TableCell>
                      <TableCell>
                        {it._id ? (
                          <Tooltip title="Ver PDF">
                            <IconButton
                              size="small"
                              onClick={() =>
                                window.open(
                                  `/files/receipts/${new Date(
                                    it.createdAt
                                  ).getFullYear()}/${it._id}.pdf`,
                                  "_blank"
                                )
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
                  )}

                  {tab === "ledger" && (
                    <>
                      <TableCell>{fmtDate(it.createdAt)}</TableCell>
                      <TableCell>{it.account || it.cuenta || "—"}</TableCell>
                      <TableCell>{it.type || it.tipo || "—"}</TableCell>
                      <TableCell align="right">
                        {fmtMoney(Number(it.amount || 0))}
                      </TableCell>
                    </>
                  )}

                  {tab === "outbox" && (
                    <>
                      <TableCell>{it.event || it.topic || "—"}</TableCell>
                      <TableCell>{it.status || "—"}</TableCell>
                      <TableCell>{fmtDate(it.createdAt)}</TableCell>
                      <TableCell>{it.attempts ?? 0}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}

              {!rows?.length && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: "center" }}
                    >
                      Sin registros para mostrar.
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
