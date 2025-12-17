// src/components/admin/sections/TransactionsSection.jsx
import React, { useMemo, useState, useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tooltip,
  Divider,
  Pagination,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useTransactions } from "../../../context/TransactionsContext";

/* ---------------- helpers ---------------- */
const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—";

const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.toLocaleDateString("es-AR")} ${dt
    .toLocaleTimeString("es-AR")
    .slice(0, 5)}`;
};

const METHODS = [
  { value: "", label: "Todos" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "qr", label: "QR" },
  { value: "otro", label: "Otro" },
];

const STATUS = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "posted", label: "Contabilizado" },
  { value: "settled", label: "Rendido" },
  { value: "reversed", label: "Reversado" },
];

/* =============== Component =============== */
export default function TransactionsSection() {
  const {
    items,
    total,
    page,
    limit,
    sortBy,
    sortDir,
    q,
    dateFrom,
    dateTo,
    method,
    status,
    loading,
    setPage,
    setLimit,
    setSortBy,
    setSortDir,
    setQ,
    setDateFrom,
    setDateTo,
    setMethod,
    setStatus,
    refresh,
    fetchPayments,
    // ⬇️ importadores desde el contexto
    importNaranja,
    importBancoNacion,
  } = useTransactions();

  const [localQ, setLocalQ] = useState(q || "");
  const [importing, setImporting] = useState(false);

  const naranjaInputRef = useRef(null);
  const nacionInputRef = useRef(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 10))),
    [total, limit]
  );

  const handleApplyFilters = () =>
    fetchPayments({
      page: 0,
      limit,
      q: localQ,
      sortBy,
      sortDir,
      dateFrom,
      dateTo,
      method,
      status,
    }).then(() => setPage(0));

  const handleSort = (col) => {
    const nextDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(nextDir);
    fetchPayments({ page: 0, limit, q: localQ, sortBy: col, sortDir: nextDir });
    setPage(0);
  };

  const exportCSV = () => {
    const rows = [
      ["Fecha", "Estado", "Cliente", "ID Cliente", "Importe", "Método", "Recibo"],
      ...items.map((p) => [
        fmtDateTime(p.postedAt || p.createdAt),
        p.status || "posted",
        p?.cliente?.nombre || p.nombre || "",
        p?.cliente?.idCliente ?? p.idCliente ?? "",
        Number(p.amount ?? p.importe ?? 0),
        p.method || p.medio || "efectivo",
        p?.receipt?.number || p.recibo || "",
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "");
            return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(";")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClickImportNaranja = () => {
    if (naranjaInputRef.current) naranjaInputRef.current.click();
  };

  const handleClickImportNacion = () => {
    if (nacionInputRef.current) nacionInputRef.current.click();
  };

  const handleImportFile = async (event, tipo) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);

      if (tipo === "naranja") {
        await importNaranja(file);
        window.alert("Importación de Naranja completada.");
      } else {
        await importBancoNacion(file);
        window.alert("Importación de Banco Nación completada.");
      }

      await refresh();
    } catch (err) {
      console.error("Error en importación:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error inesperado al importar el archivo.";
      window.alert(msg);
    } finally {
      setImporting(false);
      event.target.value = ""; // permitir re-subir el mismo archivo
    }
  };

  return (
    <Box>
      {/* inputs ocultos para subir archivos */}
      <input
        type="file"
        accept=".txt"
        ref={naranjaInputRef}
        style={{ display: "none" }}
        onChange={(e) => handleImportFile(e, "naranja")}
      />
      <input
        type="file"
        accept=".txt"
        ref={nacionInputRef}
        style={{ display: "none" }}
        onChange={(e) => handleImportFile(e, "nacion")}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        mb={1.5}
      >
        <Typography variant="h5" fontWeight={800}>
          Transacciones
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={() => refresh()}
            disabled={loading || importing}
          >
            Refrescar
          </Button>

          <Button
            startIcon={<DownloadRoundedIcon />}
            onClick={exportCSV}
            disabled={!items.length}
          >
            Exportar CSV
          </Button>

          <Button
            startIcon={<UploadFileRoundedIcon />}
            variant="outlined"
            onClick={handleClickImportNaranja}
            disabled={importing}
          >
            Importar Naranja
          </Button>

          <Button
            startIcon={<UploadFileRoundedIcon />}
            variant="outlined"
            onClick={handleClickImportNacion}
            disabled={importing}
          >
            Importar Banco Nación
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 1.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre, #cliente, recibo, referencia…"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={dateFrom || ""}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={dateTo || ""}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <TextField
            size="small"
            select
            label="Método"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {METHODS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {STATUS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="brandYellow"
            onClick={handleApplyFilters}
            disabled={loading || importing}
          >
            Aplicar
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <Th
                label="Fecha"
                active={sortBy === "postedAt" || sortBy === "createdAt"}
                dir={sortDir}
                onClick={() => handleSort("postedAt")}
              />
              <TableCell>Estado</TableCell>
              <Th
                label="Cliente"
                active={sortBy === "cliente.idCliente" || sortBy === "nombre"}
                dir={sortDir}
                onClick={() => handleSort("cliente.idCliente")}
              />
              <Th
                label="Importe"
                align="right"
                active={sortBy === "amount" || sortBy === "importe"}
                dir={sortDir}
                onClick={() => handleSort("amount")}
              />
              <Th
                label="Método"
                active={sortBy === "method"}
                dir={sortDir}
                onClick={() => handleSort("method")}
              />
              <TableCell>Recibo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    {loading ? "Cargando…" : "Sin resultados"}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {items.map((p) => {
              const fecha = p.postedAt || p.createdAt;
              const importe = Number(p.amount ?? p.importe ?? 0);
              const idCli = p?.cliente?.idCliente ?? p.idCliente ?? "—";
              const nombre = p?.cliente?.nombre ?? p.nombre ?? "—";
              const metodo = p.method || p.medio || "efectivo";
              const estado = p.status || "posted";
              const rxNum = p?.receipt?.number || p.recibo || "—";
              const pdfUrl = p?.receipt?.pdfUrl || null;

              return (
                <TableRow key={p._id || `${fecha}_${idCli}_${importe}`}>
                  <TableCell>{fmtDateTime(fecha)}</TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        estado === "posted"
                          ? "Contabilizado"
                          : estado === "settled"
                          ? "Rendido"
                          : estado === "reversed"
                          ? "Reversado"
                          : "Borrador"
                      }
                      color={
                        estado === "posted"
                          ? "success"
                          : estado === "settled"
                          ? "info"
                          : estado === "reversed"
                          ? "error"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" variant="outlined" label={`#${idCli}`} />
                      <span>{nombre}</span>
                    </Stack>
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fmtMoney(importe)}
                  </TableCell>

                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {metodo}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongRoundedIcon fontSize="small" />
                      <Typography variant="body2">
                        {rxNum !== "—" ? rxNum : "—"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title={pdfUrl ? "Abrir recibo" : "Sin PDF"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
                          disabled={!pdfUrl}
                        >
                          <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
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
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              select
              label="Filas"
              value={limit}
              onChange={(e) => {
                const v = Number(e.target.value) || 10;
                setLimit(v);
                fetchPayments({
                  page: 0,
                  limit: v,
                  q: localQ,
                  sortBy,
                  sortDir,
                });
                setPage(0);
              }}
              sx={{ width: 110 }}
            >
              {[10, 25, 50, 100].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" color="text.secondary">
              {total} resultados
            </Typography>
          </Stack>

          <Pagination
            color="primary"
            page={page + 1}
            count={totalPages}
            onChange={(_, p1) => {
              setPage(p1 - 1);
              fetchPayments({
                page: p1 - 1,
                limit,
                q: localQ,
                sortBy,
                sortDir,
                dateFrom,
                dateTo,
                method,
                status,
              });
            }}
          />
        </Stack>
      </Paper>
    </Box>
  );
}

/* -------- small header cell with sort indicator -------- */
function Th({ label, active, dir, onClick, align = "left" }) {
  return (
    <TableCell
      align={align}
      onClick={onClick}
      sx={{
        userSelect: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontWeight: 700,
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <span>{label}</span>
        {active ? (
          dir === "asc" ? (
            <ArrowUpwardRoundedIcon fontSize="inherit" />
          ) : (
            <ArrowDownwardRoundedIcon fontSize="inherit" />
          )
        ) : null}
      </Stack>
    </TableCell>
  );
}
