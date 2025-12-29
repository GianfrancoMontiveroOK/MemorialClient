// src/components/CollectorClientsTable.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Tooltip,
  Chip,
  Stack,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MapIcon from "@mui/icons-material/Map";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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
const onlyDigits = (s = "") => String(s).replace(/\D+/g, "");

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
        billing.lastPaidPeriod ? `Último pago: ${billing.lastPaidPeriod}` : "Al día"
      }
    >
      <Chip size="small" color="success" label="Al día" />
    </Tooltip>
  );
}

/* ---------- Card para mobile ---------- */
function MobileClientCard({
  row,
  onCopyAddress,
  onOpenMaps,
  onOpenWhatsApp,
  onView,
}) {
  const hasPhone = !!digits(row?.telefono || "");
  const cuotaVig =
    row?.cuotaVigente ?? (row?.usarCuotaIdeal ? row?.cuotaIdeal : row?.cuota);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5, mb: 1 }}>
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {row.nombre ?? "—"}
          </Typography>
          <BillingChip billing={row.billing} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Cliente #{row.idCliente ?? "—"}
          {cuotaVig ? ` · Cuota ${fmtMoney(Number(cuotaVig))}` : ""}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {buildAddress(row) || "Sin dirección"}
        </Typography>

        <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <Tooltip title="Copiar dirección">
            <span>
              <IconButton size="small" onClick={() => onCopyAddress(row)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Abrir en Maps">
            <span>
              <IconButton size="small" onClick={() => onOpenMaps(row)}>
                <MapIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={hasPhone ? "WhatsApp" : "Sin teléfono"}>
            <span>
              <IconButton
                size="small"
                color="success"
                onClick={() => hasPhone && onOpenWhatsApp(row)}
                disabled={!hasPhone}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ver ficha">
            <span>
              <IconButton size="small" onClick={() => onView(row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function CollectorClientsTable() {
  const navigate = useNavigate();
  const {
    ctxId,
    items,
    total, // asegurate de exponer esto en el contexto
    loading,
    err,
    fetchClientsByCollector,
  } = useCollector();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const rowsRaw = Array.isArray(items) ? items : [];
  const [localErr, setLocalErr] = useState("");

  const [page, setPage] = useState(0); // 0-based
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDir, setSortDir] = useState("desc");
  const sortBy = "createdAt";

  // filtro activo: 'all' | 'missing' | 'al-dia' | 'ahead'
  const [statusFilter, setStatusFilter] = useState("all");

  // 🔎 buscador tipo admin
  const [searchText, setSearchText] = useState("");
  const [activeQuery, setActiveQuery] = useState({
    q: "",
    byIdCliente: undefined,
    byDocumento: undefined,
  });

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const parseSearch = useCallback((raw) => {
    const v = String(raw || "").trim();
    const low = v.toLowerCase();
    const digitsOnly = onlyDigits(v);

    // Prefijos explícitos de DNI/doc
    const dniPref =
      /^dni[:\s]+(.+)$/.exec(low) || /^doc(?:umento)?[:\s]+(.+)$/.exec(low);
    if (dniPref) {
      const d = onlyDigits(dniPref[1]);
      return { q: "", byIdCliente: undefined, byDocumento: d || undefined };
    }

    // Forzar ID cliente con "#123" o "id: 123"
    const idMatch = /^id\s*:\s*(\d+)$/.exec(low) || /^#\s*(\d+)$/.exec(v);
    if (idMatch) {
      return {
        q: "",
        byIdCliente: Number(idMatch[1]),
        byDocumento: undefined,
      };
    }

    // Si tiene separadores y ≥6 dígitos → DNI
    const hasNonDigits = /\D/.test(v);
    if (hasNonDigits && digitsOnly.length >= 6) {
      return { q: "", byIdCliente: undefined, byDocumento: digitsOnly };
    }

    // Solo dígitos
    if (/^\d+$/.test(v)) {
      if (v.length >= 6) {
        // Ambiguo: por defecto DNI (si quieren idCliente largo, que usen #123 o id:123)
        return { q: "", byIdCliente: undefined, byDocumento: v };
      }
      // Cortos → idCliente
      return { q: "", byIdCliente: Number(v), byDocumento: undefined };
    }

    // Texto libre
    return { q: v, byIdCliente: undefined, byDocumento: undefined };
  }, []);

  const pageForApi = useMemo(() => page + 1, [page]);

  const load = useCallback(async () => {
    try {
      const params = {
        page: pageForApi,
        limit: rowsPerPage,
        sortBy,
        sortDir,
      };

      if (activeQuery.byDocumento) {
        params.byDocumento = String(activeQuery.byDocumento);
      } else if (activeQuery.byIdCliente !== undefined) {
        params.byIdCliente = activeQuery.byIdCliente;
      } else if (activeQuery.q) {
        params.q = activeQuery.q;
      }

      await fetchClientsByCollector(params);
      setLocalErr("");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error al cargar";
      setLocalErr(msg);
    }
  }, [
    fetchClientsByCollector,
    pageForApi,
    rowsPerPage,
    sortBy,
    sortDir,
    activeQuery,
  ]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [load, ctxId]);

  // ✅ debounce search FIX (sin activeQuery stale)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const parsed = parseSearch(searchText);

      setActiveQuery((prev) => {
        const changed =
          parsed.q !== prev.q ||
          parsed.byIdCliente !== prev.byIdCliente ||
          parsed.byDocumento !== prev.byDocumento;

        if (changed) setPage(0);
        return changed ? parsed : prev;
      });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText, parseSearch]);

  const handleRefresh = () => load();
  const handleToggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(0);
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
      `Tengo registrada tu cuota vigente de *${fmtMoney(Number(cuotaVig))}*.\n` +
      `¿Coordinamos el cobro a domicilio? (Cliente #${r?.idCliente ?? "—"}).`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sortLabel =
    sortDir === "asc" ? "Más viejos primero" : "Más nuevos primero";

  const errorMsg = err || localErr;

  /* ---------- Contadores por estado (sobre la página actual) ---------- */
  const counts = useMemo(() => {
    let missing = 0,
      alDia = 0,
      ahead = 0;
    for (const r of rowsRaw) {
      const b = r?.billing;
      if (isMissingThisMonth(b)) missing++;
      else if (isAhead(b)) ahead++;
      else if (isOnTime(b)) alDia++;
    }
    return { missing, alDia, ahead, all: rowsRaw.length };
  }, [rowsRaw]);

  /* ---------- Filtrado local por chip (sobre page actual) ---------- */
  const visibleRows = useMemo(() => {
    if (statusFilter === "all") return rowsRaw;
    return rowsRaw.filter((r) => {
      const b = r?.billing;
      if (statusFilter === "missing") return isMissingThisMonth(b);
      if (statusFilter === "ahead") return isAhead(b);
      if (statusFilter === "al-dia") return isOnTime(b);
      return true;
    });
  }, [rowsRaw, statusFilter]);

  const toggleFilter = (key) =>
    setStatusFilter((prev) => (prev === key ? "all" : key));

  const hasFilter =
    (activeQuery.q && activeQuery.q.length > 0) ||
    activeQuery.byIdCliente !== undefined ||
    activeQuery.byDocumento !== undefined;

  const clearSearch = () => {
    setSearchText("");
    setActiveQuery({ q: "", byIdCliente: undefined, byDocumento: undefined });
    setPage(0);
    searchRef.current?.focus?.();
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
      {/* Toolbar */}
      <Toolbar
        sx={{
          gap: 1,
          flexWrap: "wrap",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          p: 1.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Mis clientes · {loading && total == null ? "…" : total ?? 0}
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <Tooltip title={sortLabel}>
              <span>
                <IconButton
                  onClick={handleToggleSort}
                  disabled={loading}
                  aria-label="Alternar orden"
                  size="small"
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
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  size="small"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Buscador tipo admin */}
        <Box
          sx={{
            flex: 1,
            minWidth: { xs: "100%", sm: 260 },
            maxWidth: { xs: "100%", md: 520 },
          }}
        >
          <TextField
            size="small"
            fullWidth
            inputRef={searchRef}
            placeholder='Buscar por nombre, N° cliente o DNI… (ej: "dni 30.123.456", "#123", "30123456")'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchText ? (
                <InputAdornment position="end">
                  <Tooltip title="Limpiar">
                    <IconButton size="small" onClick={clearSearch}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : null,
            }}
          />

          {hasFilter && (
            <Box mt={0.5}>
              {activeQuery.byDocumento !== undefined ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`DNI: ${activeQuery.byDocumento}`}
                  onDelete={clearSearch}
                  sx={{ mr: 0.5 }}
                />
              ) : activeQuery.byIdCliente !== undefined ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`N° cliente: ${activeQuery.byIdCliente}`}
                  onDelete={clearSearch}
                  sx={{ mr: 0.5 }}
                />
              ) : activeQuery.q ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Búsqueda: “${activeQuery.q}”`}
                  onDelete={clearSearch}
                  sx={{ mr: 0.5 }}
                />
              ) : null}
            </Box>
          )}
        </Box>

        {/* Botones en desktop */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
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
        </Stack>

        {errorMsg && (
          <Typography
            variant="body2"
            color="error"
            sx={{ ml: { sm: 1 }, mt: { xs: 0.5, sm: 0 } }}
          >
            {errorMsg}
          </Typography>
        )}

        {/* Filtros/leyenda (clicables) */}
        <Box sx={{ width: "100%", mt: 0.5 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { height: 4 },
            }}
          >
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

      {/* Mensaje si hay filtro de estado y búsqueda server-side: aclaración opcional */}
      {statusFilter !== "all" && hasFilter ? (
        <Box px={1.5} pb={1}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nota: el buscador filtra en servidor (por páginas) y el chip de estado filtra
            localmente sobre la página actual.
          </Alert>
        </Box>
      ) : null}

      {/* LISTA MOBILE */}
      {isMobile && (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          {visibleRows.length > 0 ? (
            visibleRows.map((r) => (
              <MobileClientCard
                key={r.id || r._id || r.idCliente}
                row={r}
                onCopyAddress={copyAddress}
                onOpenMaps={openMaps}
                onOpenWhatsApp={openWhatsApp}
                onView={handleView}
              />
            ))
          ) : loading ? (
            <Box py={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Cargando…
              </Typography>
            </Box>
          ) : errorMsg ? (
            <Box py={3} textAlign="center">
              <Typography variant="body2" color="error">
                Error: {errorMsg}
              </Typography>
            </Box>
          ) : (
            <Box py={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Sin resultados
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* TABLA DESKTOP */}
      {!isMobile && (
        <>
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
                  visibleRows.map((r) => (
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
                            <IconButton size="small" onClick={() => copyAddress(r)}>
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
                        <Tooltip title={digits(r?.telefono || "") ? "WhatsApp" : "Sin teléfono"}>
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
                            <IconButton size="small" onClick={() => handleView(r)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={3}>
                        <Typography variant="body2" color="text.secondary">
                          Cargando…
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : errorMsg ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={3}>
                        <Typography variant="body2" color="error">
                          Error: {errorMsg}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
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
            count={total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setRowsPerPage(v);
              setPage(0);
            }}
            labelRowsPerPage="Filas por página"
          />
        </>
      )}
    </Paper>
  );
}
