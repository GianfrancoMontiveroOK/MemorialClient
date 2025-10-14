// src/components/CollectorClientsTable.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { useNavigate } from "react-router-dom";
import { useCollector } from "../context";

const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—";

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-AR");
};

export default function CollectorClientsTable({ onOpenCobro }) {
  const navigate = useNavigate();
  const {
    ctxId,
    items,
    total,
    page, // UI 0-based (según tu contexto)
    limit,
    q,
    loading,
    err,
    fetchClientsByCollector,
    setPage,
    setLimit,
    setQ,
  } = useCollector();

  const rows = Array.isArray(items) ? items : [];
  const [localSearch, setLocalSearch] = useState(q || "");
  const [localErr, setLocalErr] = useState("");
  const [sortDir, setSortDir] = useState("desc"); // default: más nuevos primero
  const sortBy = "createdAt";

  useEffect(() => {
    console.log("[CollectorTable ctxId]", ctxId);
  }, [ctxId]);

  useEffect(() => {
    console.log("[CollectorTable] items changed", {
      rowsLen: rows.length,
      total,
      loading,
      first: rows[0],
    });
  }, [items, rows.length, total, loading]);

  // sync input si q cambia externamente
  useEffect(() => {
    setLocalSearch(q || "");
  }, [q]);

  // debounce de búsqueda -> actualiza q en el contexto
  useEffect(() => {
    const t = setTimeout(() => {
      const nextQ = String(localSearch || "").trim();
      if (nextQ !== q) {
        setPage(0);
        setQ(nextQ);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const load = useCallback(async () => {
    try {
      await fetchClientsByCollector({
        page, // tu contexto ya sabe si convertir a 1-based
        limit,
        q,
        sortBy,
        sortDir,
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error al cargar";
      setLocalErr(msg);
    }
  }, [fetchClientsByCollector, page, limit, q, sortBy, sortDir]);

  const handleRefresh = () => {
    load();
  };

  const handleToggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(0);
    // disparamos una recarga luego del setState
    setTimeout(load, 0);
  };

  const handleView = (r) => navigate(`/app/clientes/${r._id || r.id}`);

  const sortLabel =
    sortDir === "asc" ? "Más viejos primero" : "Más nuevos primero";

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Mis clientes · {loading && rows.length === 0 ? "…" : total}
        </Typography>

        <Box
          sx={{ flex: 1, minWidth: 220, maxWidth: 420, ml: { xs: 0, md: 2 } }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre o N° cliente…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Toggle ver más viejos / más nuevos */}
        <Tooltip title={sortLabel}>
          <span>
            <IconButton
              onClick={handleToggleSort}
              disabled={loading}
              aria-label="Alternar orden"
            >
              <SwapVertIcon
                fontSize="small"
                style={{
                  transform:
                    sortDir === "asc" ? "rotate(0deg)" : "rotate(180deg)",
                  transition: "transform 120ms ease",
                }}
              />
            </IconButton>
          </span>
        </Tooltip>

        <Button
          variant="contained"
          size="small"
          onClick={() =>
            alert("Alta de cliente deshabilitada para cobradores.")
          }
        >
          Nuevo (bloqueado)
        </Button>

        <Tooltip title="Refrescar">
          <span>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>

        {(err || localErr) && (
          <Typography variant="body2" color="error" sx={{ ml: 1 }}>
            {err || localErr}
          </Typography>
        )}
      </Toolbar>

      <TableContainer>
        <Table size="small" aria-label="Tabla de clientes">
          <TableHead>
            <TableRow>
              <TableCell>N° Cliente</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell align="right">Cuota</TableCell>
              <TableCell>Ingreso</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <TableRow hover key={r.id || r._id || r.idCliente}>
                  <TableCell>{r.idCliente ?? "—"}</TableCell>
                  <TableCell>{r.nombre ?? "—"}</TableCell>
                  <TableCell>
                    {r.domicilio ||
                      [r.ciudad, r.provincia].filter(Boolean).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell align="right">{fmtMoney(r.cuota)}</TableCell>
                  <TableCell>{fmtDate(r.ingreso)}</TableCell>
                  <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      title="Ver"
                      onClick={() => handleView(r)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      title="Cobrar"
                      onClick={() => onOpenCobro?.(r)}
                    >
                      <PaymentsIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      Cargando…
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : err || localErr ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="error">
                      Error: {err || localErr}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      Sin resultados
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        rowsPerPageOptions={[10, 25, 50, 100]}
        count={Math.max(total, rows.length)}
        rowsPerPage={limit}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          const v = parseInt(e.target.value, 10);
          setLimit(v);
          setPage(0);
        }}
        labelRowsPerPage="Filas por página"
      />
    </Paper>
  );
}
