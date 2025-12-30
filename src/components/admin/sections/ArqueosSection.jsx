// src/components/admin/sectionsAdminPanel/ArqueosSection.jsx
import React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
  Pagination,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import PersonPinCircleRoundedIcon from "@mui/icons-material/PersonPinCircleRounded";

import PersonalCajaCard from "./PersonalCajaCard.jsx";
import { useAuth } from "../../../context/AuthContext";
import { listArqueosUsuarios } from "../../../api/arqueos.js";

const ROLE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "superAdmin", label: "SuperAdmin" },
  { value: "admin", label: "Admin" },
  { value: "cobrador", label: "Cobrador" },
  // Si alguna vez querés filtrar globales desde UI:
  // { value: "global", label: "Global (cajas)" },
];

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "—"
    : `${dt.toLocaleDateString("es-AR")} ${dt
        .toLocaleTimeString("es-AR")
        .slice(0, 5)}`;
};

// Suma totales a partir de boxes
function computeTotals(row) {
  const boxes = Array.isArray(row?.boxes) ? row.boxes : [];
  let deb = 0;
  let cred = 0;
  let net = 0;
  let last = null;
  let moves = 0;

  for (const b of boxes) {
    deb += Number(b?.debits || 0);
    cred += Number(b?.credits || 0);
    net += Number(b?.balance || 0);
    moves += Number(b?.paymentsCount || 0);
    const t = b?.lastMovementAt ? new Date(b.lastMovementAt) : null;
    if (t && !Number.isNaN(t.getTime())) {
      if (!last || t > last) last = t;
    }
  }
  if (typeof row?.totalBalance === "number")
    net = Number(row.totalBalance || 0);
  return { deb, cred, net, last, moves };
}

/** Orden lógico que pediste.
 *  0: CAJA_GRANDE (GLOBAL)
 *  1: CAJA_CHICA  (GLOBAL)
 *  2: superAdmin
 *  3: admin
 *  4: cobrador
 *  5: otros
 */
function orderRank(row) {
  const id = String(row?._id || "");
  const role = String(row?.role || "");
  if (id === "GLOBAL:CAJA_GRANDE") return 0;
  if (id === "GLOBAL:CAJA_CHICA") return 1;
  if (role === "superAdmin") return 2;
  if (role === "admin") return 3;
  if (role === "cobrador") return 4;
  return 5;
}

// Detección de fila global
const isGlobalRow = (row) =>
  row?.role === "global" || String(row?._id || "").startsWith("GLOBAL:");

// Chip del rol con icono
function RoleChip({ row }) {
  const id = String(row?._id || "");
  const role = String(row?.role || "");
  if (id === "GLOBAL:CAJA_GRANDE")
    return (
      <Chip
        size="small"
        icon={<DomainRoundedIcon />}
        color="secondary"
        label="CAJA_GRANDE (GLOBAL)"
        variant="outlined"
      />
    );
  if (id === "GLOBAL:CAJA_CHICA")
    return (
      <Chip
        size="small"
        icon={<DomainRoundedIcon />}
        color="secondary"
        label="CAJA_CHICA (GLOBAL)"
        variant="outlined"
      />
    );
  if (role === "superAdmin")
    return (
      <Chip
        size="small"
        icon={<ShieldRoundedIcon />}
        color="success"
        label="superAdmin"
        variant="outlined"
      />
    );
  if (role === "admin")
    return (
      <Chip
        size="small"
        icon={<AdminPanelSettingsRoundedIcon />}
        color="primary"
        label="admin"
        variant="outlined"
      />
    );
  if (role === "cobrador")
    return (
      <Chip
        size="small"
        icon={<PersonPinCircleRoundedIcon />}
        color="default"
        label="cobrador"
        variant="outlined"
      />
    );
  return <Chip size="small" label={role || "—"} />;
}

export default function ArqueosSection({ onOpenCollectorDetail }) {
  const { user } = useAuth() || {};
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0); // 0-based UI
  const [limit, setLimit] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / limit));

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listArqueosUsuarios({
        page: page + 1, // API 1-based
        limit,
        q: q.trim(),
        role: role || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: "totalBalance",
        sortDir: "desc",
      });
      setItems(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
    } catch (e) {
      console.error(e);
      window.alert(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudieron cargar los arqueos"
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, role, dateFrom, dateTo]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onApply = () => {
    setPage(0);
    fetchData();
  };

  const handleOpenDetail = (row) => {
    const user = {
      userId: row?._id,
      name: row?.name || row?.userName || "",
      email: row?.email || "",
      role: row?.role || "",
    };
    onOpenCollectorDetail?.({ user, dateFrom, dateTo });
  };

  // 🔽 Ordenamos localmente para forzar la jerarquía pedida
  const sortedItems = React.useMemo(() => {
    const clone = Array.isArray(items) ? [...items] : [];
    clone.sort((a, b) => {
      const ra = orderRank(a);
      const rb = orderRank(b);
      if (ra !== rb) return ra - rb;

      // Dentro del mismo bloque, ordenamos por saldo neto desc y luego por nombre asc
      const na = Number(a?.totalBalance ?? 0);
      const nb = Number(b?.totalBalance ?? 0);
      if (na !== nb) return nb - na;

      const an = String(a?.name || a?.email || a?._id || "");
      const bn = String(b?.name || b?.email || b?._id || "");
      return an.localeCompare(bn, "es");
    });
    return clone;
  }, [items]);

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
          ARQUEOS
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refrescar
          </Button>
        </Stack>
      </Stack>

      {/* Card personal + global */}
      <PersonalCajaCard
        dateFrom={dateFrom}
        dateTo={dateTo}
        onMoved={fetchData}
      />

      {/* Filtros */}
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 1.5 }}>
        <Stack direction={{ xs: "column", xl: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar (nombre, email, id)…"
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
          <Button variant="contained" onClick={onApply} disabled={loading}>
            Aplicar
          </Button>
        </Stack>
      </Paper>

      {/* Tabla */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Ingresos</TableCell>
              <TableCell align="right">Egresos</TableCell>
              <TableCell align="right">Saldo neto</TableCell>
              <TableCell align="right">Movs.</TableCell>
              <TableCell>Último mov.</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!sortedItems || sortedItems.length === 0) && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    {loading ? "Cargando…" : "Sin resultados"}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {sortedItems.map((r) => {
              const { deb, cred, net, last, moves } = computeTotals(r);
              const mongoId =
                r?._id && /^[a-f0-9]{24}$/i.test(String(r._id))
                  ? String(r._id)
                  : null;

              const global = isGlobalRow(r);

              return (
                <TableRow
                  key={String(r._id || r.name || r.email || Math.random())}
                  sx={
                    global
                      ? {
                          "& td": {
                            bgcolor: (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(0,0,0,0.03)",
                          },
                          "&:hover td": {
                            bgcolor: (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                          },
                        }
                      : undefined
                  }
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={String(r.name || r.userName || "—")}
                      />
                      {!global && (
                        <Typography variant="body2" color="text.secondary">
                          {r.email || "—"}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell title={String(r._id || "—")}>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {mongoId
                        ? `${mongoId.slice(0, 6)}…${mongoId.slice(-4)}`
                        : String(r._id || "—")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <RoleChip row={r} />
                  </TableCell>

                  <TableCell align="right">{fmtMoney(deb)}</TableCell>
                  <TableCell align="right">{fmtMoney(cred)}</TableCell>

                  <TableCell
                    align="right"
                    style={{
                      fontWeight: 800,
                      color: net < 0 ? "#d32f2f" : undefined,
                    }}
                  >
                    {fmtMoney(net)}
                  </TableCell>

                  <TableCell align="right">{Number(moves || 0)}</TableCell>
                  <TableCell>{fmtDate(last)}</TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityRoundedIcon />}
                      onClick={() =>
                        onOpenCollectorDetail?.({
                          user: {
                            userId: r?._id,
                            name: r?.name,
                            email: r?.email,
                            role: r?.role,
                          },
                          dateFrom,
                          dateTo,
                        })
                      }
                      // Habilitamos detalle también para GLOBAL
                      disabled={false}
                      title={
                        global
                          ? "Ver detalle global"
                          : "Ver detalle del usuario"
                      }
                    >
                      Detalle
                    </Button>
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
            count={Math.max(1, totalPages)}
            onChange={(_, p1) => setPage(p1 - 1)}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
