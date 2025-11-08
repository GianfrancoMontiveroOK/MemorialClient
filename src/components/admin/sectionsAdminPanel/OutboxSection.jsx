// src/components/admin/sections/OutboxSection.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  Divider,
  Pagination,
  Tooltip,
  Typography,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import {
  listAdminOutbox,
  requeueOutboxOne,
  requeueOutboxBulk,
} from "../../../api/outbox";

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "processing", label: "Procesando" }, // si tu worker usa "processing"
  { value: "sent", label: "Enviados" }, // backend: "sent"
  { value: "delivered", label: "Entregados" }, // opcional
  { value: "failed", label: "Fallidos" },
];

const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.toLocaleDateString("es-AR")} ${dt
    .toLocaleTimeString("es-AR")
    .slice(0, 5)}`;
};

function truncate(s, max = 100) {
  const str = String(s ?? "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/**
 * OutboxSection (conectada a API)
 * - Lista, filtra, pagina y reintenta eventos outbox.
 */
export default function OutboxSection() {
  // tabla / query
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // UI 0-based
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [topic, setTopic] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // selección (bulk)
  const [selectedIds, setSelectedIds] = useState([]);

  // feedback
  const [toast, setToast] = useState({ open: false, msg: "", sev: "success" });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 10))),
    [total, limit]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminOutbox({
        page: page + 1, // backend 1-based
        limit,
        q,
        status,
        topic,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDir,
      });
      const data = res?.data || {};
      if (!data.ok) throw new Error(data.message || "Error");
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setSelectedIds([]); // limpia selección al refrescar
    } catch (e) {
      setItems([]);
      setTotal(0);
      setToast({
        open: true,
        sev: "error",
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar la Outbox",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, status, topic, dateFrom, dateTo, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Acciones UI
  const apply = () => {
    setPage(0);
    fetchData();
  };

  const sort = (col) => {
    const nextDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(nextDir);
    setPage(0);
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map((x) => String(x._id)));
  };

  const exportCSV = () => {
    const rows = [
      [
        "Creado",
        "Actualizado",
        "Estado",
        "Intentos",
        "Próx. intento",
        "Tópico",
        "ID",
        "Error",
      ],
      ...items.map((e) => [
        fmtDateTime(e.createdAt),
        fmtDateTime(e.updatedAt),
        e.status || "",
        Number(e.attempts ?? 0),
        fmtDateTime(e.nextAttemptAt),
        e.topic || "",
        String(e._id || ""),
        (e.lastError || "").replace(/\r?\n/g, " "),
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
    a.download = `outbox_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onRetry = async (item) => {
    try {
      await requeueOutboxOne(item._id);
      setToast({
        open: true,
        sev: "success",
        msg: "Evento encolado para reintento.",
      });
      fetchData();
    } catch (e) {
      setToast({
        open: true,
        sev: "error",
        msg: e?.response?.data?.message || "No se pudo reintentar",
      });
    }
  };

  const onBulkRetry = async (ids) => {
    try {
      if (!ids?.length) return;
      await requeueOutboxBulk(ids);
      setToast({
        open: true,
        sev: "success",
        msg: `Reintento encolado (${ids.length}).`,
      });
      fetchData();
    } catch (e) {
      setToast({
        open: true,
        sev: "error",
        msg: e?.response?.data?.message || "No se pudo reintentar selección",
      });
    }
  };

  // Modal JSON
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonItem, setJsonItem] = useState(null);
  const openJSON = (it) => {
    setJsonItem(it);
    setJsonOpen(true);
  };
  const copyPayload = () => {
    if (!jsonItem) return;
    const txt = JSON.stringify(
      { payload: jsonItem.payload, lastError: jsonItem.lastError },
      null,
      2
    );
    navigator.clipboard?.writeText(txt);
    setToast({ open: true, sev: "success", msg: "JSON copiado." });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        mb={1.5}
      >
        <Typography variant="h5" fontWeight={800}>
          Outbox (eventos hacia ERP/externos)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchData}
            disabled={loading}
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
            startIcon={<RestartAltRoundedIcon />}
            color="warning"
            disabled={!selectedIds.length || loading}
            onClick={() => onBulkRetry(selectedIds)}
          >
            Reintentar selección ({selectedIds.length})
          </Button>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 1.5 }}>
        <Stack direction={{ xs: "column", xl: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar (tópico, error, id, texto del payload…)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
            select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Tópico"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <TextField
            size="small"
            type="date"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Button variant="contained" onClick={apply} disabled={loading}>
            Aplicar
          </Button>
        </Stack>
      </Paper>

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < items.length
                  }
                  checked={
                    items.length > 0 && selectedIds.length === items.length
                  }
                  onChange={toggleAll}
                />
              </TableCell>
              <Th
                label="Creado"
                active={sortBy === "createdAt"}
                dir={sortDir}
                onClick={() => sort("createdAt")}
              />
              <Th
                label="Actualizado"
                active={sortBy === "updatedAt"}
                dir={sortDir}
                onClick={() => sort("updatedAt")}
              />
              <Th
                label="Estado"
                active={sortBy === "status"}
                dir={sortDir}
                onClick={() => sort("status")}
              />
              <Th
                label="Intentos"
                active={sortBy === "attempts"}
                dir={sortDir}
                onClick={() => sort("attempts")}
                align="right"
              />
              <TableCell>Próx. intento</TableCell>
              <Th
                label="Tópico"
                active={sortBy === "topic"}
                dir={sortDir}
                onClick={() => sort("topic")}
              />
              <TableCell>ID</TableCell>
              <TableCell>Error</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    {loading ? "Cargando…" : "Sin resultados"}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {items.map((e) => {
              const id = String(e._id || "");
              const st = String(e.status || "");
              const chipColor =
                st === "sent" || st === "delivered"
                  ? "success"
                  : st === "failed"
                  ? "error"
                  : st === "processing"
                  ? "info"
                  : "default";

              return (
                <TableRow key={id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleRow(id)}
                    />
                  </TableCell>
                  <TableCell>{fmtDateTime(e.createdAt)}</TableCell>
                  <TableCell>{fmtDateTime(e.updatedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={st || "—"}
                      color={chipColor}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{Number(e.attempts ?? 0)}</TableCell>
                  <TableCell>{fmtDateTime(e.nextAttemptAt)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {e.topic || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {id.slice(0, 10)}…
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {e.lastError ? (
                      <Tooltip title={e.lastError}>
                        <Typography
                          variant="body2"
                          color="error"
                          noWrap
                          sx={{ maxWidth: 220 }}
                        >
                          {truncate(e.lastError, 40)}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver JSON">
                      <span>
                        <IconButton size="small" onClick={() => openJSON(e)}>
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Reintentar ahora">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onRetry(e)}
                          disabled={
                            loading || st === "sent" || st === "delivered"
                          }
                        >
                          <RestartAltRoundedIcon fontSize="small" />
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
            onChange={(_, p1) => setPage(p1 - 1)}
          />
        </Stack>
      </Paper>

      {/* Modal JSON */}
      <Dialog
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Evento outbox</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary">
            ID: {String(jsonItem?._id || "—")}
          </Typography>
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 1.5,
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.04)",
              borderRadius: 2,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 420,
              overflow: "auto",
              fontSize: 12.5,
            }}
          >
            {JSON.stringify(
              {
                topic: jsonItem?.topic ?? null,
                status: jsonItem?.status ?? null,
                attempts: jsonItem?.attempts ?? 0,
                nextAttemptAt: jsonItem?.nextAttemptAt ?? null,
                createdAt: jsonItem?.createdAt ?? null,
                updatedAt: jsonItem?.updatedAt ?? null,
                payload: jsonItem?.payload ?? {},
                lastError: jsonItem?.lastError ?? null,
              },
              null,
              2
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ContentCopyRoundedIcon />} onClick={copyPayload}>
            Copiar JSON
          </Button>
          <Button
            startIcon={<RestartAltRoundedIcon />}
            color="warning"
            onClick={() => {
              if (jsonItem) onRetry(jsonItem);
              setJsonOpen(false);
            }}
          >
            Reintentar
          </Button>
          <Button onClick={() => setJsonOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
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
          <span style={{ opacity: 0.7, fontSize: 12 }}>
            {dir === "asc" ? "▲" : "▼"}
          </span>
        ) : null}
      </Stack>
    </TableCell>
  );
}
