// src/components/admin/sections/ReceiptsSection.jsx
import React, { useEffect, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Pagination,
  Skeleton,
} from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearAllRoundedIcon from "@mui/icons-material/ClearAllRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import { useReceipts } from "../../../context";
import api from "../../../api/axios"; // ⬅️ usamos tu axios para leer baseURL

// helpers
const fmtMoney = (n, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(
    Number(n || 0)
  );
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString("es-AR") : "—");

// Derivamos el ORIGEN real del server a partir del baseURL de axios.
// Ej: http://localhost:4000/api  ->  http://localhost:4000
const API_BASE = (api?.defaults?.baseURL || "").trim();
const API_ORIGIN =
  API_BASE.replace(/\/+$/, "").replace(/\/api\/?$/i, "") ||
  window.location.origin;

const toAbsoluteUrl = (maybeRelative) => {
  if (!maybeRelative) return "";
  const url = String(maybeRelative);
  if (/^https?:\/\//i.test(url)) return url; // ya absoluta
  // aseguramos que empiece con "/"
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_ORIGIN}${path}`;
};

export default function ReceiptsSection() {
  const { items, total, loading, filters, setFilters, refresh } = useReceipts();

  // Carga inicial
  useEffect(() => {
    refresh({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = useMemo(() => {
    const size = Number(filters.pageSize || 25);
    return Math.max(1, Math.ceil(Number(total || 0) / size));
  }, [total, filters.pageSize]);

  const onPageChange = (_e, p) => {
    const next = { ...filters, page: p };
    setFilters(next);
    refresh(next);
  };

  const onPageSizeChange = (e) => {
    const pageSize = Number(e.target.value);
    const next = { ...filters, pageSize, page: 1 };
    setFilters(next);
    refresh(next);
  };

  const onQueryChange = (e) => {
    const next = { ...filters, q: e.target.value };
    setFilters(next);
  };
  const runSearch = () => refresh({ ...filters, page: 1 });

  const toggleOnlyWithPdf = () => {
    const next = { ...filters, page: 1, onlyWithPdf: !filters.onlyWithPdf };
    setFilters(next);
    refresh(next);
  };

  const clearFilters = () => {
    const next = {
      ...filters,
      page: 1,
      q: "",
      dateFrom: "",
      dateTo: "",
      method: "",
      status: "",
    };
    setFilters(next);
    refresh(next);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text));
    } catch {}
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        gap={2}
        mb={2}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight={800}>
            Recibos
          </Typography>
          <Chip
            size="small"
            label={loading ? "Cargando…" : `${total} registros`}
          />
        </Stack>

        <Stack
          direction="row"
          gap={1}
          justifyContent="flex-end"
          flexWrap="wrap"
        >
          <FormControlLabel
            control={
              <Switch
                checked={!!filters.onlyWithPdf}
                onChange={toggleOnlyWithPdf}
              />
            }
            label="Solo con PDF"
          />
          <TextField
            size="small"
            placeholder="Buscar por #, cliente, referencia…"
            value={filters.q || ""}
            onChange={onQueryChange}
            InputProps={{
              startAdornment: (
                <SearchRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              ),
            }}
            sx={{ minWidth: 280 }}
          />
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
            InputProps={{
              startAdornment: (
                <CalendarMonthRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              ),
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filters.dateTo || ""}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            InputProps={{
              startAdornment: (
                <CalendarMonthRoundedIcon fontSize="small" sx={{ mr: 1 }} />
              ),
            }}
          />
          <TextField
            size="small"
            select
            label="Medio"
            value={filters.method || ""}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="efectivo">Efectivo</MenuItem>
            <MenuItem value="transferencia">Transferencia</MenuItem>
            <MenuItem value="tarjeta">Tarjeta</MenuItem>
          </TextField>
          <TextField
            size="small"
            select
            label="Estado"
            value={filters.status || ""}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="posted">Registrado</MenuItem>
            <MenuItem value="voided">Anulado</MenuItem>
          </TextField>

          <Button
            variant="contained"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={runSearch}
            disabled={loading}
          >
            Aplicar
          </Button>
          <Button
            variant="text"
            startIcon={<ClearAllRoundedIcon />}
            onClick={clearFilters}
            disabled={loading}
          >
            Limpiar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => refresh()}
            disabled={loading}
          >
            Refrescar
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Tabla */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N°</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>PDF</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: Number(filters.pageSize || 10) }).map(
                  (_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={8}>
                        <Skeleton height={36} />
                      </TableCell>
                    </TableRow>
                  )
                )}

              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">
                      No hay recibos para mostrar.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((row) => {
                  const pay = row.payment || {};
                  const cliente = pay.cliente || {};
                  const pdfHref = row.pdfUrl ? toAbsoluteUrl(row.pdfUrl) : "";

                  return (
                    <TableRow key={row._id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography fontWeight={700}>
                            {row.number ?? "—"}
                          </Typography>
                          {!!row.number && (
                            <Tooltip title="Copiar número">
                              <IconButton
                                size="small"
                                onClick={() => copy(row.number)}
                              >
                                <ContentCopyRoundedIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <CalendarMonthRoundedIcon fontSize="small" />
                          <Typography variant="body2">
                            {fmtDateTime(pay.postedAt || pay.createdAt)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.3}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <PersonOutlineRoundedIcon fontSize="small" />
                            <Typography variant="body2" fontWeight={600}>
                              {cliente?.nombre || "—"}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            ID Cliente: {cliente?.idCliente ?? "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800}>
                          {fmtMoney(pay.amount, pay.currency)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          icon={<CreditScoreRoundedIcon />}
                          label={(pay.method || "—").toUpperCase()}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          color={
                            pay.status === "posted"
                              ? "success"
                              : pay.status === "voided"
                              ? "error"
                              : "default"
                          }
                          label={(pay.status || "—").toUpperCase()}
                        />
                      </TableCell>

                      <TableCell>
                        {row.pdfUrl ? (
                          <Stack direction="row" alignItems="center" gap={1}>
                            <PictureAsPdfOutlinedIcon fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              PDF listo
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" gap={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            href={pdfHref || undefined}
                            target={pdfHref ? "_blank" : undefined}
                            rel={pdfHref ? "noopener noreferrer" : undefined}
                            disabled={!pdfHref}
                            startIcon={<PictureAsPdfOutlinedIcon />}
                          >
                            Ver PDF
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer: paginación y pageSize */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          p={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Mostrando página {filters.page || 1} de {pages}
            </Typography>
            <TextField
              selR  ect
              size="small"
              label="Tamaño"
              value={filters.pageSize || 25}
              onChange={onPageSizeChange}
              sx={{ width: 120, ml: 1 }}
            >
              {[10, 25, 50, 100].map((n) => (
                <MenuItem key={n} value={n}>
                  {n} / pág.
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Pagination
            color="primary"
            page={Number(filters.page || 1)}
            count={pages}
            onChange={onPageChange}
            siblingCount={1}
            boundaryCount={1}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
