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
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";

import { useAuth } from "../../../context/AuthContext";
import {
  listArqueosUsuarios,
  getArqueoUsuarioDetalle,
  depositoCajaChica,
  getArqueoGlobalTotals,
} from "../../../api/arqueos";

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

/** ─────────────────────────────────────────────────────────────
 *  Tarjeta de “Caja Personal” (encima de los filtros)
 *  - Para admins: muestra CAJA_ADMIN y CAJA_CHICA + botón “Mover todo a caja chica”
 *  - Mueve SIEMPRE el 100% del saldo de CAJA_ADMIN → CAJA_CHICA
 *  ───────────────────────────────────────────────────────────── */
function AdminPersonalCajaCard({ dateFrom, dateTo, onMoved }) {
  const { user } = useAuth() || {};
  const myId = user?._id || user?.id || user?.userId;
  const myRole = user?.role || "";

  const [loading, setLoading] = React.useState(false);
  const [saldoAdmin, setSaldoAdmin] = React.useState(0);
  const [saldoChicaGlobal, setSaldoChicaGlobal] = React.useState(0);
  const [note, setNote] = React.useState("");

  const canShow = myRole === "admin" && !!myId;

  const fetchBalances = React.useCallback(async () => {
    if (!canShow) return;
    setLoading(true);
    try {
      // Personal: CAJA_ADMIN (ligada a userId)
      const pPersonal = getArqueoUsuarioDetalle({
        userId: myId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        accountCodes: "CAJA_ADMIN",
        page: 1,
        limit: 1,
      });

      // Global: CAJA_CHICA (sin userId)
      const pGlobal = getArqueoGlobalTotals({
        accountCodes: "CAJA_CHICA",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const [rPer, rGlob] = await Promise.all([pPersonal, pGlobal]);

      setSaldoAdmin(Number(rPer?.data?.header?.totals?.balance || 0));
      // Soporta dos posibles formas: { totals: {...} } o { totals: { CAJA_CHICA: {...} } }
      const tg = rGlob?.data?.totals;
      const balanceGlobal =
        typeof tg?.balance === "number"
          ? tg.balance
          : Number(tg?.CAJA_CHICA?.balance || 0);

      setSaldoChicaGlobal(Number(balanceGlobal || 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [canShow, myId, dateFrom, dateTo]);

  React.useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const moveAllToCajaChica = async () => {
    const amt = Number(saldoAdmin || 0);
    if (amt <= 0) {
      window.alert("No hay saldo en CAJA_ADMIN para mover.");
      return;
    }
    const ok = window.confirm(
      `Se moverán ${fmtMoney(
        amt
      )} desde CAJA_ADMIN a CAJA_CHICA (global). ¿Confirmar?`
    );
    if (!ok) return;

    try {
      await depositoCajaChica({
        adminUserId: myId,
        amount: amt,
        currency: "ARS",
        note,
      });
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      window.alert(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo mover a caja chica"
      );
    }
  };

  if (!canShow) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        bgcolor: (t) =>
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <LocalAtmRoundedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={800}>
            Mi caja (Admin)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* CAJA_ADMIN (personal) */}
          <Chip
            icon={<SavingsRoundedIcon />}
            color="default"
            variant="outlined"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  CAJA_ADMIN
                </Typography>
                <Typography variant="body2" fontWeight={800}>
                  {loading ? "…" : fmtMoney(saldoAdmin)}
                </Typography>
              </Stack>
            }
          />
          {/* CAJA_CHICA (GLOBAL) */}
          <Chip
            icon={<AccountBalanceRoundedIcon />}
            color="success"
            variant="outlined"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  CAJA_CHICA (GLOBAL)
                </Typography>
                <Typography variant="body2" fontWeight={800}>
                  {loading ? "…" : fmtMoney(saldoChicaGlobal)}
                </Typography>
              </Stack>
            }
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<ArrowForwardRoundedIcon />}
            onClick={moveAllToCajaChica}
            disabled={loading || Number(saldoAdmin) <= 0}
            title={
              Number(saldoAdmin) <= 0
                ? "Sin saldo en CAJA_ADMIN"
                : `Mover ${fmtMoney(saldoAdmin)} a CAJA_CHICA`
            }
          >
            Mover todo a caja chica
          </Button>
        </Stack>
      </Stack>

      <Box mt={1.25}>
        <TextField
          fullWidth
          size="small"
          label="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: cierre de caja diaria"
        />
      </Box>
    </Paper>
  );
}

export default function ArqueosSection({ onOpenCollectorDetail }) {
  const { user } = useAuth() || {};
  const viewerRole = user?.role || "";

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

      {/* ── Caja personal (admins) ───────────────────────────────── */}
      <AdminPersonalCajaCard
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
                <TableRow key={String(r._id || r.userId || r.userName)}>
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
                      {String(r._id || r.userId || "—")}
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
