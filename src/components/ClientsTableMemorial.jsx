// src/components/ClientsTableMemorial.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useNavigate } from "react-router-dom";
import { useClients } from "../context/ClientsContext";

const onlyDigits = (s = "") => String(s).replace(/\D+/g, "");

export default function ClientsTableMemorial() {
  const navigate = useNavigate();
  const { list, items, total, loading, err } = useClients();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDir, setSortDir] = useState("desc");
  const [sortBy] = useState("createdAt");

  // 🔎 buscador (server-side → global a toda la base)
  const [searchText, setSearchText] = useState("");
  const [activeQuery, setActiveQuery] = useState({
    q: "",
    byIdCliente: undefined,
    byDocumento: undefined, // DNI/documento (solo dígitos)
  });
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // 🎯 filtros locales (client-side)
  const FILTERS = {
    ALL: "ALL",
    ONLY_IDEAL: "ONLY_IDEAL",
    ONLY_HIST: "ONLY_HIST",
    BELOW_IDEAL: "BELOW_IDEAL",
    ABOVE_IDEAL: "ABOVE_IDEAL",
  };
  const [localFilter, setLocalFilter] = useState(FILTERS.ALL);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }),
    []
  );

  const fmtDiff = useCallback(
    (n) => {
      if (!Number.isFinite(n)) return "—";
      const sign = n > 0 ? "+" : n < 0 ? "−" : "";
      const abs = Math.abs(n);
      return `${sign}${money.format(abs)}`;
    },
    [money]
  );

  /**
   * Parser profesional:
   * - "dni 30.123.456", "dni:30123456", "doc 30123456", "documento 30-123-456" ⇒ byDocumento = DIGITS
   * - "#123", "id: 123" ⇒ byIdCliente = 123
   * - "30.123.456" o "30-123-456" ⇒ byDocumento = DIGITS (contiene separadores)
   * - "30123456" (>=6 dígitos) ⇒ por defecto DNI (byDocumento); usá "#123" o "id:123" para forzar idCliente
   * - "123" (<=5 dígitos puros) ⇒ idCliente
   * - resto ⇒ q (texto libre)
   */
  const parseSearch = useCallback((raw) => {
    const v = String(raw || "").trim();
    const low = v.toLowerCase();
    const digits = onlyDigits(v);

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

    // Si el texto contiene separadores y tiene ≥6 dígitos, asumir DNI normalizado
    const hasNonDigits = /\D/.test(v);
    if (hasNonDigits && digits.length >= 6) {
      return { q: "", byIdCliente: undefined, byDocumento: digits };
    }

    // Solo dígitos
    if (/^\d+$/.test(v)) {
      if (v.length >= 6) {
        // Ambiguo, por defecto DNI para que funcione con "30123456"
        return { q: "", byIdCliente: undefined, byDocumento: v };
      }
      // Cortos → idCliente
      return { q: "", byIdCliente: Number(v), byDocumento: undefined };
    }

    // Texto libre
    return { q: v, byIdCliente: undefined, byDocumento: undefined };
  }, []);

  const pageForApi = useMemo(() => page + 1, [page]);
  const rowsRaw = Array.isArray(items) ? items : [];

  const getIdForRoute = (r) => r?._id ?? r?.idCliente ?? r?.id;
  const getRowKey = (r) =>
    r?._id ?? `${r?.idCliente ?? "row"}-${r?.documento ?? Math.random()}`;

  const getCuotaCobrada = (r) => {
    const ideal = Number(r?.cuotaIdeal || 0);
    const hist = Number(r?.cuota || 0);
    return r?.usarCuotaIdeal ? ideal : hist;
  };

  const getDiff = (r) => {
    const ideal = Number(r?.cuotaIdeal || 0);
    const cobrada = getCuotaCobrada(r);
    if (!Number.isFinite(ideal) || !Number.isFinite(cobrada)) return undefined;
    return cobrada - ideal;
  };

  const rows = useMemo(() => {
    switch (localFilter) {
      case FILTERS.ONLY_IDEAL:
        return rowsRaw.filter((r) => !!r.usarCuotaIdeal);
      case FILTERS.ONLY_HIST:
        return rowsRaw.filter((r) => !r.usarCuotaIdeal);
      case FILTERS.BELOW_IDEAL:
        return rowsRaw.filter((r) => {
          const d = getDiff(r);
          return Number.isFinite(d) && d < 0;
        });
      case FILTERS.ABOVE_IDEAL:
        return rowsRaw.filter((r) => {
          const d = getDiff(r);
          return Number.isFinite(d) && d > 0;
        });
      default:
        return rowsRaw;
    }
  }, [rowsRaw, localFilter]);

  // 🚚 cargar lista (server-side → GLOBAL)
  const load = useCallback(async () => {
    const params = {
      page: pageForApi,
      limit: rowsPerPage,
      sortBy,
      sortDir,
    };
    if (activeQuery.byDocumento) {
      // FRONT normaliza → siempre dígitos
      params.byDocumento = String(activeQuery.byDocumento);
      params.q = "";
      params.byIdCliente = undefined;
    } else if (activeQuery.byIdCliente !== undefined) {
      params.byIdCliente = activeQuery.byIdCliente;
      params.q = "";
    } else {
      params.q = activeQuery.q || "";
    }
    await list(params);
  }, [list, pageForApi, rowsPerPage, sortBy, sortDir, activeQuery]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  // ⌛ debounce search (server-side)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseSearch(searchText);
      const changed =
        parsed.q !== activeQuery.q ||
        parsed.byIdCliente !== activeQuery.byIdCliente ||
        parsed.byDocumento !== activeQuery.byDocumento;
      if (changed) {
        setActiveQuery(parsed);
        setPage(0);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, parseSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // pag/orden
  const handleChangePage = (_evt, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (evt) => {
    const v = parseInt(evt.target.value, 10);
    setRowsPerPage(v);
    setPage(0);
  };
  const handleToggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(0);
  };

  const handleView = (r) => navigate(`/app/clientes/${getIdForRoute(r)}`);
  const sortLabel =
    sortDir === "asc" ? "Más viejos primero" : "Más nuevos primero";

  // accesos rápidos
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if (
        (isMac && e.metaKey && e.key.toLowerCase() === "k") ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Enter" && document.activeElement === searchRef.current) {
        const parsed = parseSearch(searchText);
        const changed =
          parsed.q !== activeQuery.q ||
          parsed.byIdCliente !== activeQuery.byIdCliente ||
          parsed.byDocumento !== activeQuery.byDocumento;
        if (changed) {
          setActiveQuery(parsed);
          setPage(0);
        } else {
          load();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeQuery, load, parseSearch, searchText]);

  const clearSearch = () => {
    setSearchText("");
    setActiveQuery({ q: "", byIdCliente: undefined, byDocumento: undefined });
    setPage(0);
  };

  const hasFilter =
    (activeQuery.q && activeQuery.q.length > 0) ||
    activeQuery.byIdCliente !== undefined ||
    activeQuery.byDocumento !== undefined;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Toolbar sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="h4" fontWeight={700} textTransform="uppercase">
          Clientes {loading ? "…" : `· ${total ?? 0}`}
        </Typography>

        {/* Filtros locales */}
        <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
          <Chip
            label="Todos"
            size="small"
            color={localFilter === FILTERS.ALL ? "primary" : "default"}
            onClick={() => setLocalFilter(FILTERS.ALL)}
            variant={localFilter === FILTERS.ALL ? "filled" : "outlined"}
          />
          <Chip
            label="Solo IDEAL"
            size="small"
            color={localFilter === FILTERS.ONLY_IDEAL ? "success" : "default"}
            onClick={() => setLocalFilter(FILTERS.ONLY_IDEAL)}
            variant={localFilter === FILTERS.ONLY_IDEAL ? "filled" : "outlined"}
          />
          <Chip
            label="Solo HIST."
            size="small"
            onClick={() => setLocalFilter(FILTERS.ONLY_HIST)}
            variant={localFilter === FILTERS.ONLY_HIST ? "filled" : "outlined"}
          />
          <Chip
            label="Por debajo del ideal"
            size="small"
            color={localFilter === FILTERS.BELOW_IDEAL ? "error" : "default"}
            onClick={() => setLocalFilter(FILTERS.BELOW_IDEAL)}
            variant={
              localFilter === FILTERS.BELOW_IDEAL ? "filled" : "outlined"
            }
          />
          <Chip
            label="Por encima del ideal"
            size="small"
            color={localFilter === FILTERS.ABOVE_IDEAL ? "success" : "default"}
            onClick={() => setLocalFilter(FILTERS.ABOVE_IDEAL)}
            variant={
              localFilter === FILTERS.ABOVE_IDEAL ? "filled" : "outlined"
            }
          />
        </Stack>

        {/* 🔎 Buscador (server-side → GLOBAL) */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <TextField
            inputRef={searchRef}
            size="small"
            fullWidth
            placeholder='Buscar por nombre, N° cliente o DNI… (ej: "dni 30.123.456", "#123", "30123456")'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
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

        {/* Orden */}
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
          variant="brandYellow"
          startIcon={<AddIcon />}
          onClick={() => navigate("/app/clientes/nuevo")}
        >
          Nuevo cliente
        </Button>

        <Tooltip title="Refrescar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>

        {err && (
          <Typography variant="body2" color="error" sx={{ ml: 1 }}>
            {String(err)}
          </Typography>
        )}
      </Toolbar>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>N° Cliente</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>ID Cobrador</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell align="center">Integrantes</TableCell>
              <TableCell align="right">Cuota</TableCell>
              <TableCell align="right">Diferencia</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      Cargando…
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      {err ? `Error: ${err}` : "Sin resultados"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const cuotaCobrada = getCuotaCobrada(r);
                const diff = getDiff(r);
                const above = Number.isFinite(diff) && diff > 0;
                const below = Number.isFinite(diff) && diff < 0;

                return (
                  <TableRow hover key={getRowKey(r)}>
                    <TableCell>{r.idCliente ?? "—"}</TableCell>
                    <TableCell>{r.nombre ?? "—"}</TableCell>
                    <TableCell>
                      {Number.isFinite(r.idCobrador) ? (
                        <Chip
                          size="small"
                          label={`#${r.idCobrador}`}
                          sx={{ height: 22, fontWeight: 700 }}
                          variant="outlined"
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{r.domicilio ?? "—"}</TableCell>
                    <TableCell align="center">
                      {Number.isFinite(r.integrantesCount)
                        ? r.integrantesCount
                        : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {Number.isFinite(cuotaCobrada)
                        ? money.format(cuotaCobrada)
                        : "—"}
                      {r.usarCuotaIdeal ? (
                        <Chip
                          size="small"
                          label="IDEAL"
                          color="success"
                          sx={{ ml: 1, height: 20, fontWeight: 700 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="HIST."
                          variant="outlined"
                          sx={{
                            ml: 1,
                            height: 20,
                            fontWeight: 700,
                            color: "text.secondary",
                            borderColor: "divider",
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {Number.isFinite(diff) ? (
                        <Tooltip
                          title={
                            above
                              ? "Por encima del ideal"
                              : below
                              ? "Por debajo del ideal"
                              : "Igual al ideal"
                          }
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={fmtDiff(diff)}
                            sx={{
                              fontWeight: 700,
                              ...(above
                                ? {
                                    borderColor: "success.main",
                                    color: "success.dark",
                                  }
                                : below
                                ? {
                                    borderColor: "error.main",
                                    color: "error.dark",
                                  }
                                : { opacity: 0.7 }),
                            }}
                          />
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                      <IconButton
                        size="small"
                        title="Ver"
                        onClick={() => handleView(r)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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
    </Paper>
  );
}
