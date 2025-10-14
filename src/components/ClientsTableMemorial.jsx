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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useNavigate } from "react-router-dom";
import { useClients } from "../context/ClientsContext";

export default function ClientsTableMemorial() {
  const navigate = useNavigate();

  // Contexto
  const { list, items, total, loading, err, deleteOne } = useClients();

  // Estado de tabla (server-side)
  const [page, setPage] = useState(0); // UI 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDir, setSortDir] = useState("asc"); // "asc" = más viejos primero
  const [sortBy] = useState("createdAt");

  // 🔎 Buscador
  const [searchText, setSearchText] = useState("");
  const [activeQuery, setActiveQuery] = useState({
    q: "",
    byIdCliente: undefined,
  }); // lo que está aplicado actualmente
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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
      if (typeof n !== "number") return "—";
      const sign = n > 0 ? "+" : "";
      return `${sign}${money.format(n)}`;
    },
    [money]
  );

  // Helpers para parsear entrada y decidir filtro
  const parseSearch = useCallback((raw) => {
    const v = String(raw || "").trim();
    // id:123  |  #123  |  123
    const idMatch =
      /^id\s*:\s*(\d+)$/.exec(v.toLowerCase()) ||
      /^#\s*(\d+)$/.exec(v) ||
      /^(\d+)$/.exec(v);
    if (idMatch) {
      return { q: "", byIdCliente: Number(idMatch[1]) };
    }
    // texto -> q
    return { q: v, byIdCliente: undefined };
  }, []);

  const pageForApi = useMemo(() => page + 1, [page]);
  const rows = Array.isArray(items) ? items : [];

  const getIdForRoute = (r) => r?._id ?? r?.idCliente ?? r?.id;
  const getRowKey = (r) =>
    r?._id ?? `${r?.idCliente ?? "row"}-${r?.documento ?? Math.random()}`;

  // Carga (listado)
  const load = useCallback(async () => {
    const params = {
      page: pageForApi, // backend 1-based
      limit: rowsPerPage,
      sortBy,
      sortDir,
    };
    if (activeQuery.byIdCliente !== undefined) {
      params.byIdCliente = activeQuery.byIdCliente;
      params.q = ""; // aseguramos no mezclar en backend
    } else {
      params.q = activeQuery.q || "";
    }
    await list(params);
  }, [list, pageForApi, rowsPerPage, sortBy, sortDir, activeQuery]);

  // Inicial + cambios de paginación/orden/filtro aplicado
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

  // Debounce de input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseSearch(searchText);
      // si cambia el filtro efectivo, aplicamos y volvemos a pag 1
      const changed =
        parsed.q !== activeQuery.q ||
        parsed.byIdCliente !== activeQuery.byIdCliente;
      if (changed) {
        setActiveQuery(parsed);
        setPage(0);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, parseSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Paginación
  const handleChangePage = (_evt, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (evt) => {
    const v = parseInt(evt.target.value, 10);
    setRowsPerPage(v);
    setPage(0); // volver a la primera
  };

  // Orden asc/desc
  const handleToggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(0);
  };

  // Acciones por fila
  const handleView = (r) => navigate(`/app/clientes/${getIdForRoute(r)}`);
  const handleEdit = (r) =>
    navigate(`/app/clientes/${getIdForRoute(r)}/editar`);

  const handleDelete = async (r) => {
    const label = r?.nombre
      ? `${r.nombre} (#${r.idCliente ?? "s/n"})`
      : `#${r.idCliente ?? "s/n"}`;
    if (
      !window.confirm(
        `¿Eliminar cliente ${label}? Esta acción no se puede deshacer.`
      )
    )
      return;

    try {
      await deleteOne(getIdForRoute(r));

      // si borramos el último de la página y no quedan más, retroceder una página
      const newCount = (total || 0) - 1;
      const lastPageIndex = Math.max(0, Math.ceil(newCount / rowsPerPage) - 1);
      setPage((p) => (p > lastPageIndex ? lastPageIndex : p));

      // refrescar
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const sortLabel =
    sortDir === "asc" ? "Más viejos primero" : "Más nuevos primero";

  // Atajos de teclado: Ctrl/Cmd+K para enfocar search
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
        // aplicar al instante (sin esperar debounce)
        const parsed = parseSearch(searchText);
        const changed =
          parsed.q !== activeQuery.q ||
          parsed.byIdCliente !== activeQuery.byIdCliente;
        if (changed) {
          setActiveQuery(parsed);
          setPage(0);
        } else {
          load(); // forzar refresh
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeQuery, load, parseSearch, searchText]);

  const clearSearch = () => {
    setSearchText("");
    setActiveQuery({ q: "", byIdCliente: undefined });
    setPage(0);
  };

  const hasFilter =
    (activeQuery.q && activeQuery.q.length > 0) ||
    activeQuery.byIdCliente !== undefined;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Toolbar sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Clientes {loading ? "…" : `· ${total ?? 0}`}
        </Typography>

        {/* 🔎 Buscador */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <TextField
            inputRef={searchRef}
            size="small"
            fullWidth
            placeholder="Buscar por nombre o N° cliente… (Ctrl/Cmd+K)"
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
          {/* Chips de filtro aplicado */}
          {hasFilter && (
            <Box mt={0.5}>
              {activeQuery.byIdCliente !== undefined ? (
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
                  label={`Nombre: “${activeQuery.q}”`}
                  onDelete={clearSearch}
                  sx={{ mr: 0.5 }}
                />
              ) : null}
            </Box>
          )}
        </Box>

        {/* Botón toggle de orden */}
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
              <TableCell>Dirección</TableCell>
              <TableCell>Cobrador</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Cuota</TableCell>
              <TableCell align="right">Dif. Ideal</TableCell>
              <TableCell align="center">Integrantes</TableCell>
              <TableCell>Ingreso</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      Cargando…
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Box py={3}>
                    <Typography variant="body2" color="text.secondary">
                      {err ? `Error: ${err}` : "Sin resultados"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow hover key={getRowKey(r)}>
                  <TableCell>{r.idCliente ?? "—"}</TableCell>
                  <TableCell>{r.nombre ?? "—"}</TableCell>
                  <TableCell>{r.domicilio ?? "—"}</TableCell>
                  <TableCell>{r.idCobrador ?? "—"}</TableCell>
                  <TableCell>{r.activo ? "Activo" : "Baja"}</TableCell>

                  {/* Cuota (histórica) */}
                  <TableCell align="right">
                    {typeof r.cuota === "number" ? money.format(r.cuota) : "—"}
                  </TableCell>

                  {/* Diferencia Ideal vs Cobro (backend: difIdealVsCobro) */}
                  <TableCell align="right">
                    {typeof r.difIdealVsCobro === "number" ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={fmtDiff(r.difIdealVsCobro)}
                        sx={{
                          fontWeight: 700,
                          ...(r.difIdealVsCobro > 0
                            ? {
                                borderColor: "warning.main",
                                color: "warning.dark",
                              }
                            : r.difIdealVsCobro < 0
                            ? {
                                borderColor: "success.main",
                                color: "success.dark",
                              }
                            : {}),
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {/* Integrantes del grupo (backend: integrantesCount) */}
                  <TableCell align="center">
                    {Number.isFinite(r.integrantesCount)
                      ? r.integrantesCount
                      : "—"}
                  </TableCell>

                  {/* Ingreso */}
                  <TableCell>
                    {r.ingreso
                      ? new Date(r.ingreso).toLocaleDateString("es-AR")
                      : "—"}
                  </TableCell>

                  {/* Acciones */}
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
                      title="Editar"
                      onClick={() => handleEdit(r)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Eliminar"
                      onClick={() => handleDelete(r)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
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
