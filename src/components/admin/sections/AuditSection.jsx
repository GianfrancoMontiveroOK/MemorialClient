// src/components/AuditSection.jsx
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import FilterAltOffRounded from "@mui/icons-material/FilterAltOffRounded";
import SummarizeRounded from "@mui/icons-material/SummarizeRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { listAdminLedgerEntries } from "../../../api/ledger-entry";

// Helpers
const fmtAmount = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";

const fmtDateTime = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SIDES = [
  { value: "", label: "Todos" },
  { value: "debit", label: "DEBE" },
  { value: "credit", label: "HABER" },
];

const SORTABLE = [
  { value: "postedAt", label: "Fecha contable" },
  { value: "amount", label: "Importe" },
  { value: "side", label: "Lado" },
  { value: "accountCode", label: "Cuenta (propia)" },
  { value: "fromAccountCode", label: "De cuenta" },
  { value: "toAccountCode", label: "A cuenta" },
  // ✅ NUEVO ESQUEMA: fromUser/toUser en root (strings)
  { value: "fromUser", label: "De usuario" },
  { value: "toUser", label: "A usuario" },
  { value: "dimensions.idCobrador", label: "Id. Cobrador" },
  { value: "dimensions.idCliente", label: "Id. Cliente" },
  { value: "createdAt", label: "Creación" },
];

export default function AuditSection() {
  // Filtros
  const [q, setQ] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [side, setSide] = React.useState("");
  const [account, setAccount] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [idCobrador, setIdCobrador] = React.useState("");
  const [idCliente, setIdCliente] = React.useState("");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [includePayment, setIncludePayment] = React.useState(false);
  const [userId, setUserId] = React.useState(""); // filtrar por actor userId Mongo

  // UI toggles
  const [showCounterparty, setShowCounterparty] = React.useState(true); // De→A columnas
  const [dense, setDense] = React.useState(true);

  // Tabla
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [sortBy, setSortBy] = React.useState("postedAt");
  const [sortDir, setSortDir] = React.useState("desc");

  // Datos
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [stats, setStats] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const colSpan = React.useMemo(() => {
    // columnas fijas: Fecha, Lado, Cuenta, Importe, Moneda, IdCobrador, IdCliente, Refs = 8
    // + contrapartida (from/to) = +2
    // + payment (method/status) = +2
    return 8 + (showCounterparty ? 2 : 0) + (includePayment ? 2 : 0);
  }, [showCounterparty, includePayment]);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await listAdminLedgerEntries({
        page: page + 1, // backend 1-index
        limit: rowsPerPage,
        q,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        side: side || undefined,
        account: account || undefined,
        currency: currency || undefined,
        idCobrador: idCobrador !== "" ? Number(idCobrador) : undefined,
        idCliente: idCliente !== "" ? Number(idCliente) : undefined,
        minAmount: minAmount !== "" ? Number(minAmount) : undefined,
        maxAmount: maxAmount !== "" ? Number(maxAmount) : undefined,
        method: method || undefined,
        status: status || undefined,
        includePayment: includePayment ? "1" : "0", // ✅ backend usa strings
        sortBy,
        sortDir,
        userId: userId.trim() || undefined,
      });

      const payload = res?.data || {};
      if (!payload.ok) throw new Error(payload.message || "Error desconocido");
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setTotal(payload.total || 0);
      setStats(payload.stats || {});
    } catch (e) {
      setError(e?.message || "No se pudo cargar el libro mayor");
      setItems([]);
      setTotal(0);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    q,
    dateFrom,
    dateTo,
    side,
    account,
    currency,
    idCobrador,
    idCliente,
    minAmount,
    maxAmount,
    method,
    status,
    includePayment,
    sortBy,
    sortDir,
    userId,
  ]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
    setSide("");
    setAccount("");
    setCurrency("");
    setIdCobrador("");
    setIdCliente("");
    setMinAmount("");
    setMaxAmount("");
    setMethod("");
    setStatus("");
    setIncludePayment(false);
    setUserId("");
    setPage(0);
  };

  const onChangeSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const exportCSV = () => {
    const head = [
      "postedAt",
      "side",
      "accountCode",
      "amount",
      "currency",
      "idCobrador",
      "idCliente",
      ...(showCounterparty
        ? ["fromAccountCode", "toAccountCode", "fromUser", "toUser"]
        : []),
      ...(includePayment ? ["payment.method", "payment.status"] : []),
      "paymentId",
    ];

    const rows = items.map((r) => [
      r.postedAt || "",
      r.side || "",
      r.accountCode || "",
      r.amount ?? "",
      r.currency || "",
      r?.dimensions?.idCobrador ?? "",
      r?.dimensions?.idCliente ?? "",
      ...(showCounterparty
        ? [
            r.fromAccountCode || "",
            r.toAccountCode || "",
            r.fromUser || "",
            r.toUser || "",
          ]
        : []),
      ...(includePayment
        ? [r?.payment?.method || "", r?.payment?.status || ""]
        : []),
      r.paymentId || "",
    ]);

    const csv = [head, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SummarizeRounded />
        <Typography variant="h6" fontWeight={700}>
          Auditoría • Libro Mayor
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Exportar CSV">
          <span>
            <IconButton
              onClick={exportCSV}
              disabled={loading || items.length === 0}
            >
              <DownloadRounded />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Recargar">
          <span>
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshRounded />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Filtros */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Buscar (cuenta, from/to usuario, idCliente, idCobrador, importe)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              InputProps={{ endAdornment: <SearchRounded fontSize="small" /> }}
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Desde"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Hasta"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Lado"
              select
              value={side}
              onChange={(e) => setSide(e.target.value)}
              fullWidth
            >
              {SIDES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Cuenta (accountCode)"
              value={account}
              onChange={(e) => setAccount(e.target.value.trim())}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Moneda"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.trim().toUpperCase())}
              placeholder="ARS, USD..."
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Id Cobrador"
              value={idCobrador}
              onChange={(e) =>
                setIdCobrador(e.target.value.replace(/\D+/g, ""))
              }
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Id Cliente"
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value.replace(/\D+/g, ""))}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Importe mín."
              value={minAmount}
              onChange={(e) =>
                setMinAmount(e.target.value.replace(/[^\d.]+/g, ""))
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Importe máx."
              value={maxAmount}
              onChange={(e) =>
                setMaxAmount(e.target.value.replace(/[^\d.]+/g, ""))
              }
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Método (payment)"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="efectivo, transferencia..."
              fullWidth
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              label="Estado (payment)"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="posted, voided..."
              fullWidth
            />
          </Grid>

          {/* filtro por userId (Mongo) */}
          <Grid item xs={12} md={4}>
            <TextField
              label="UserId (Mongo) – actor del asiento"
              value={userId}
              onChange={(e) => setUserId(e.target.value.trim())}
              placeholder="653b... (opcional)"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={1} sx={{ height: "100%" }}>
              <Button
                variant="contained"
                onClick={() => {
                  setPage(0);
                  fetchData();
                }}
                startIcon={<SearchRounded />}
                disabled={loading}
              >
                Aplicar
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={clearFilters}
                startIcon={<FilterAltOffRounded />}
                disabled={loading}
              >
                Limpiar
              </Button>
              <Button
                variant={includePayment ? "contained" : "outlined"}
                color={includePayment ? "secondary" : "inherit"}
                onClick={() => {
                  setIncludePayment((v) => !v);
                  setPage(0);
                }}
              >
                {includePayment ? "Con Payment" : "Sin Payment"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Toggles de vista */}
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={showCounterparty}
                onChange={(_, v) => setShowCounterparty(v)}
              />
            }
            label="Mostrar columnas De → A (contrapartida)"
          />
          <FormControlLabel
            control={<Switch checked={dense} onChange={(_, v) => setDense(v)} />}
            label="Tabla compacta"
          />
        </Stack>
      </Paper>

      {/* Totales / Stats */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Totales por moneda
          </Typography>
          <Tooltip title="Totales calculados sobre el resultado del filtro actual">
            <InfoOutlined fontSize="small" />
          </Tooltip>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {Object.keys(stats).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No hay datos para los filtros actuales.
            </Typography>
          )}
          {Object.entries(stats).map(([cur, s]) => (
            <Chip
              key={cur}
              label={`${cur} • DEBE ${fmtAmount(
                s.debit
              )} | HABER ${fmtAmount(s.credit)} | Neto ${fmtAmount(s.net)} (${
                s.lines
              } líneas)`}
              variant="outlined"
            />
          ))}
        </Stack>
      </Paper>

      {/* Tabla */}
      <Paper variant="outlined">
        {error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <>
            <Table size={dense ? "small" : "medium"} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    onClick={() => onChangeSort("postedAt")}
                    sx={{ cursor: "pointer" }}
                  >
                    Fecha contable{" "}
                    {sortBy === "postedAt"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </TableCell>

                  <TableCell
                    onClick={() => onChangeSort("side")}
                    sx={{ cursor: "pointer" }}
                  >
                    Lado{" "}
                    {sortBy === "side" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </TableCell>

                  <TableCell
                    onClick={() => onChangeSort("accountCode")}
                    sx={{ cursor: "pointer" }}
                  >
                    Cuenta{" "}
                    {sortBy === "accountCode"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </TableCell>

                  {showCounterparty && (
                    <>
                      <TableCell
                        onClick={() => onChangeSort("fromUser")}
                        sx={{ cursor: "pointer" }}
                      >
                        De usuario{" "}
                        {sortBy === "fromUser"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </TableCell>
                      <TableCell
                        onClick={() => onChangeSort("toUser")}
                        sx={{ cursor: "pointer" }}
                      >
                        A usuario{" "}
                        {sortBy === "toUser"
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </TableCell>
                    </>
                  )}

                  <TableCell
                    align="right"
                    onClick={() => onChangeSort("amount")}
                    sx={{ cursor: "pointer" }}
                  >
                    Importe{" "}
                    {sortBy === "amount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </TableCell>

                  <TableCell>Moneda</TableCell>

                  <TableCell
                    onClick={() => onChangeSort("dimensions.idCobrador")}
                    sx={{ cursor: "pointer" }}
                  >
                    Id Cobrador{" "}
                    {sortBy === "dimensions.idCobrador"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </TableCell>

                  <TableCell
                    onClick={() => onChangeSort("dimensions.idCliente")}
                    sx={{ cursor: "pointer" }}
                  >
                    Id Cliente{" "}
                    {sortBy === "dimensions.idCliente"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </TableCell>

                  {includePayment && <TableCell>Método</TableCell>}
                  {includePayment && <TableCell>Estado</TableCell>}

                  <TableCell>Refs</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={colSpan}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ py: 2 }}
                      >
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                          Cargando…
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan}>
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{fmtDateTime(row.postedAt)}</TableCell>

                      <TableCell>
                        {row.side === "debit" ? (
                          <Chip
                            label="DE"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="HABER"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {row.accountCode}
                          </Typography>
                          {row.paymentId && (
                            <Tooltip title={`paymentId: ${row.paymentId}`}>
                              <InfoOutlined fontSize="small" />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>

                      {showCounterparty && (
                        <>
                          <TableCell>{row.fromUser || "—"}</TableCell>
                          <TableCell>{row.toUser || "—"}</TableCell>
                        </>
                      )}

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={
                            row.side === "debit" ? "success.main" : "info.main"
                          }
                        >
                          {fmtAmount(row.amount)}
                        </Typography>
                      </TableCell>

                      <TableCell>{row.currency || "-"}</TableCell>
                      <TableCell>{row?.dimensions?.idCobrador ?? "-"}</TableCell>
                      <TableCell>{row?.dimensions?.idCliente ?? "-"}</TableCell>

                      {includePayment && (
                        <TableCell>{row?.payment?.method ?? "-"}</TableCell>
                      )}
                      {includePayment && (
                        <TableCell>{row?.payment?.status ?? "-"}</TableCell>
                      )}

                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {row.paymentId
                              ? String(row.paymentId).slice(0, 6) + "…"
                              : "—"}
                          </Typography>
                          {row.paymentId && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigator.clipboard?.writeText(
                                  String(row.paymentId)
                                )
                              }
                            >
                              <ContentCopyRounded fontSize="inherit" />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Divider />

            <Grid container alignItems="center" sx={{ px: 2, py: 1 }}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    select
                    size="small"
                    label="Ordenar por"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(0);
                    }}
                    sx={{ minWidth: 220 }}
                  >
                    {SORTABLE.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Dirección"
                    value={sortDir}
                    onChange={(e) => {
                      setSortDir(e.target.value);
                      setPage(0);
                    }}
                    sx={{ width: 140 }}
                  >
                    <MenuItem value="asc">Ascendente</MenuItem>
                    <MenuItem value="desc">Descendente</MenuItem>
                  </TextField>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Filas por página"
                />
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  );
}
