// src/components/CollectorClientsTable.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MapIcon from "@mui/icons-material/Map";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
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

const digits = (s = "") => String(s).replace(/\D+/g, "");
const buildAddress = (r) =>
  [r?.domicilio, r?.ciudad, r?.provincia, r?.cp].filter(Boolean).join(", ");

/* ---------- Helpers de estado de cobro ---------- */
const isDueThisMonth = (b) => !!b && b.current === "due";
const isAhead = (b) => !!b && Number(b.aheadCount || 0) > 0;
const isOnTime = (b) =>
  !!b &&
  b.current === "paid" &&
  Number(b.aheadCount || 0) === 0 &&
  Number(b.arrearsCount || 0) === 0;

/* “Faltantes x cobrar este mes” = pendientes (due) + sin datos */
const isMissingThisMonth = (b) => !b || isDueThisMonth(b);

/* Chip “Estado” por fila */
function BillingChip({ billing }) {
  if (!billing) {
    return (
      <Tooltip title="Sin datos de pago para este mes">
        <Chip size="small" label="Pendiente" color="warning" />
      </Tooltip>
    );
  }
  if (isDueThisMonth(billing)) {
    const atras = Number(billing.arrearsCount || 0);
    const label = atras > 1 ? `Atraso ${atras} meses` : "Atrasado";
    return (
      <Tooltip
        title={
          billing.lastPaidPeriod
            ? `Último pago: ${billing.lastPaidPeriod}`
            : "Con deuda pendiente"
        }
      >
        <Chip size="small" color="error" label={label} />
      </Tooltip>
    );
  }
  if (isAhead(billing)) {
    const adel = Number(billing.aheadCount || 0);
    const label = adel > 1 ? `Adelantado ${adel} meses` : "Adelantado";
    return (
      <Tooltip
        title={
          billing.lastPaidPeriod
            ? `Último pago: ${billing.lastPaidPeriod}`
            : "Cuotas adelantadas"
        }
      >
        <Chip size="small" color="info" label={label} />
      </Tooltip>
    );
  }
  return (
    <Tooltip
      title={
        billing.lastPaidPeriod
          ? `Último pago: ${billing.lastPaidPeriod}`
          : "Al día"
      }
    >
      <Chip size="small" color="success" label="Al día" />
    </Tooltip>
  );
}

export default function CollectorClientsTable() {
  const navigate = useNavigate();
  const { ctxId, items, q, loading, err, fetchClientsByCollector, setQ } =
    useCollector();

  const rows = Array.isArray(items) ? items : [];
  const [localSearch, setLocalSearch] = useState(q || "");
  const [localErr, setLocalErr] = useState("");
  const [sortDir, setSortDir] = useState("desc"); // más nuevos primero
  const sortBy = "createdAt";

  // filtro activo: 'all' | 'missing' | 'al-dia' | 'ahead'
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLocalSearch(q || "");
  }, [q]);

  // Debounce búsqueda -> actualiza q (server-side full)
  useEffect(() => {
    const t = setTimeout(() => {
      const nextQ = String(localSearch || "").trim();
      if (nextQ !== q) setQ(nextQ);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const load = useCallback(async () => {
    try {
      await fetchClientsByCollector({
        full: 1, // trae TODO el padrón asignado (sin page/limit)
        q,
        sortBy,
        sortDir,
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error al cargar";
      setLocalErr(msg);
    }
  }, [fetchClientsByCollector, q, sortBy, sortDir]);

  useEffect(() => {
    load();
  }, [load, ctxId]);

  const handleRefresh = () => load();
  const handleToggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setTimeout(load, 0);
  };
  const handleView = (r) =>
    navigate(`/app/collectorClientDetail/${r._id || r.id}`);

  const copyAddress = (r) => {
    const addr = buildAddress(r);
    if (!addr) return;
    navigator.clipboard?.writeText(addr).catch(() => {});
  };
  const openMaps = (r) => {
    const addr = buildAddress(r);
    if (!addr) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      addr
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openWhatsApp = (r) => {
    const phone = digits(r?.telefono || "");
    if (!phone) return;
    const cuotaVig =
      r?.cuotaVigente ?? (r?.usarCuotaIdeal ? r?.cuotaIdeal : r?.cuota) ?? 0;
    const msg =
      `Hola ${r?.nombre?.split(" ")[0] || ""}, te escribe *Memorial*.\n` +
      `Tengo registrada tu cuota vigente de *${fmtMoney(
        Number(cuotaVig)
      )}*.\n` +
      `¿Coordinamos el cobro a domicilio? (Cliente #${r?.idCliente ?? "—"}).`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sortLabel =
    sortDir === "asc" ? "Más viejos primero" : "Más nuevos primero";

  /* ---------- Contadores por estado (sobre TODO el padrón) ---------- */
  const counts = useMemo(() => {
    let missing = 0,
      alDia = 0,
      ahead = 0;
    for (const r of rows) {
      const b = r?.billing;
      if (isMissingThisMonth(b)) missing++;
      else if (isAhead(b)) ahead++;
      else if (isOnTime(b)) alDia++;
    }
    return { missing, alDia, ahead, all: rows.length };
  }, [rows]);

  /* ---------- Filtrado local por chip ---------- */
  const visibleRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => {
      const b = r?.billing;
      if (statusFilter === "missing") return isMissingThisMonth(b);
      if (statusFilter === "ahead") return isAhead(b);
      if (statusFilter === "al-dia") return isOnTime(b);
      return true;
    });
  }, [rows, statusFilter]);

  const toggleFilter = (key) =>
    setStatusFilter((prev) => (prev === key ? "all" : key));

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Toolbar sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Mis clientes · {loading && rows.length === 0 ? "…" : counts.all}
        </Typography>

        <Box
          sx={{ flex: 1, minWidth: 220, maxWidth: 520, ml: { xs: 0, md: 2 } }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por nombre, N° cliente o domicilio…"
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

        {/* Filtros/leyenda (clicables) */}
        <Box sx={{ ml: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              color="warning"
              variant={statusFilter === "missing" ? "filled" : "outlined"}
              label={`Faltantes este mes (${counts.missing})`}
              onClick={() => toggleFilter("missing")}
            />
            <Chip
              size="small"
              color="success"
              variant={statusFilter === "al-dia" ? "filled" : "outlined"}
              label={`Al día (${counts.alDia})`}
              onClick={() => toggleFilter("al-dia")}
            />
            <Chip
              size="small"
              color="info"
              variant={statusFilter === "ahead" ? "filled" : "outlined"}
              label={`Adelantado (${counts.ahead})`}
              onClick={() => toggleFilter("ahead")}
            />
            <Chip
              size="small"
              color="default"
              variant={statusFilter === "all" ? "filled" : "outlined"}
              label={`Todos (${counts.all})`}
              onClick={() => toggleFilter("all")}
            />
          </Stack>
        </Box>
      </Toolbar>

      <TableContainer>
        <Table size="small" aria-label="Tabla de clientes (cobrador)">
          <TableHead>
            <TableRow>
              <TableCell>N° Cliente</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((r) => {
                const cuotaVig =
                  r?.cuotaVigente ??
                  (r?.usarCuotaIdeal ? r?.cuotaIdeal : r?.cuota);
                return (
                  <TableRow hover key={r.id || r._id || r.idCliente}>
                    <TableCell>{r.idCliente ?? "—"}</TableCell>
                    <TableCell>{r.nombre ?? "—"}</TableCell>
                    <TableCell>{buildAddress(r) || "—"}</TableCell>

                    <TableCell>
                      <BillingChip billing={r.billing} />
                    </TableCell>

                    <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Copiar dirección">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => copyAddress(r)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Abrir en Maps">
                        <span>
                          <IconButton size="small" onClick={() => openMaps(r)}>
                            <MapIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openWhatsApp(r)}
                            disabled={!digits(r?.telefono || "")}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Ver ficha">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleView(r)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
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
    </Paper>
  );
}
