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
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { listArqueosUsuarios } from "../../../api/arqueos";

const ROLE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "superAdmin", label: "SuperAdmin" },
  { value: "admin", label: "Admin" },
  { value: "cobrador", label: "Cobrador" },
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

// Suma totales a partir de boxes [{ currency, debits, credits, balance, lastMovementAt, paymentsCount }]
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

  if (typeof row?.totalBalance === "number") {
    net = Number(row.totalBalance || 0);
  }

  return { deb, cred, net, last, moves };
}

export default function ArqueosSection({ onOpenCollectorDetail }) {
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
      alert(
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
          Arqueos (caja por usuario)
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
            select
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {ROLE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
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
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    {loading ? "Cargando…" : "Sin resultados"}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {items.map((r) => {
              const { deb, cred, net, last, moves } = computeTotals(r);
              return (
                <TableRow key={String(r.userId || r.userName)}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={String(r.name || r.userName || "—")}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {r.email || "—"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {String(r.userId || "—")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.role || "—"} />
                  </TableCell>
                  <TableCell align="right">{fmtMoney(deb)}</TableCell>
                  <TableCell align="right">{fmtMoney(cred)}</TableCell>
                  <TableCell align="right" style={{ fontWeight: 700 }}>
                    {fmtMoney(net)}
                  </TableCell>
                  <TableCell align="right">{Number(moves || 0)}</TableCell>
                  <TableCell>{fmtDate(last)}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityRoundedIcon />}
                      onClick={() => handleOpenDetail(r)}
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
            count={totalPages}
            onChange={(_, p1) => setPage(p1 - 1)}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
