// src/components/admin/sectionsAdminPanel/CollectorDetailSection.jsx
import * as React from "react";
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Divider,
  Stack,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

import {
  CollectorDetailLayout,
  BoxFilters,
  Kpi,
  CashTable,
  PaymentsTable,
  ClientsFilters,
  ClientsTable,
  CollectorCommissionSection,
  fmtMoney,
  sumTotals,
} from "../../arqueoSections";

import {
  getArqueoUsuarioDetalle,
  crearArqueoUsuario,
  listArqueoUsuarioClientes,
  downloadArqueoUsuarioClientesCSV,
} from "../../../api/arqueos";

/* ===================== Debounce helper ===================== */
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function CollectorDetailSection({
  user, // { userId, name, email, role, porcentajeCobrador? }
  defaultDateFrom = "",
  defaultDateTo = "",
  onBack,
}) {
  const userId = user?.userId;
  const userIdOk =
    userId !== undefined && userId !== null && String(userId) !== "";

  const [tab, setTab] = React.useState("caja"); // caja | pagos | clientes

  // filtros (caja/pagos)
  const [dateFrom, setDateFrom] = React.useState(defaultDateFrom);
  const [dateTo, setDateTo] = React.useState(defaultDateTo);
  const [sideFilter, setSideFilter] = React.useState("");
  const [accountCodes, setAccountCodes] = React.useState("");

  // caja
  const [cashLoading, setCashLoading] = React.useState(false);
  const [cashTotals, setCashTotals] = React.useState({
    debits: 0,
    credits: 0,
    balance: 0,
  });
  const [cashTotalsFromApi, setCashTotalsFromApi] = React.useState(false);
  const [cashItems, setCashItems] = React.useState([]);
  const [cashTotal, setCashTotal] = React.useState(0);
  const [cashPage, setCashPage] = React.useState(0);
  const [cashLimit, setCashLimit] = React.useState(10);

  // pagos
  const [payLoading, setPayLoading] = React.useState(false);
  const [payItems, setPayItems] = React.useState([]);
  const [payTotal, setPayTotal] = React.useState(0);
  const [payPage, setPayPage] = React.useState(0);
  const [payLimit, setPayLimit] = React.useState(10);

  // clientes
  const [cliLoading, setCliLoading] = React.useState(false);
  const [cliItems, setCliItems] = React.useState([]);
  const [cliTotal, setCliTotal] = React.useState(0);
  const [cliPage, setCliPage] = React.useState(0);
  const [cliLimit, setCliLimit] = React.useState(10);
  const [cliQ, setCliQ] = React.useState("");
  const [cliSortBy, setCliSortBy] = React.useState("createdAt");
  const [cliSortDir, setCliSortDir] = React.useState("desc");

  // ✅ debounce (evita request por tecla)
  const debouncedCliQ = useDebouncedValue(cliQ, 350);

  // feedback general
  const [toast, setToast] = React.useState({
    open: false,
    msg: "",
    sev: "success",
  });

  // modal arqueo
  const [arqueoOpen, setArqueoOpen] = React.useState(false);
  const [arqueoNote, setArqueoNote] = React.useState("");
  const [arqueoSubmitting, setArqueoSubmitting] = React.useState(false);

  const totalCashPages = Math.max(
    1,
    Math.ceil((Number(cashTotal) || 0) / cashLimit)
  );
  const totalPayPages = Math.max(
    1,
    Math.ceil((Number(payTotal) || 0) / payLimit)
  );
  const totalCliPages = Math.max(
    1,
    Math.ceil((Number(cliTotal) || 0) / cliLimit)
  );

  const reloadCash = React.useCallback(async () => {
    if (!userIdOk) return;
    setCashLoading(true);
    try {
      const res = await getArqueoUsuarioDetalle({
        userId,
        page: cashPage + 1,
        limit: cashLimit,
        sortBy: "postedAt",
        sortDir: "desc",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        side: sideFilter || undefined,
        accountCodes: accountCodes || undefined,
      });

      const data = res?.data || {};
      const items = data?.items || [];
      const totalsApi = data?.totals;
      const totals = totalsApi || sumTotals(items);

      setCashTotalsFromApi(Boolean(totalsApi));

      setCashTotals({
        debits: Number(totals.debits || 0),
        credits: Number(totals.credits || 0),
        balance: Number(totals.balance || 0),
      });
      setCashItems(items);
      setCashTotal(Number(data?.total || items.length || 0));
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar la caja del cobrador",
        sev: "error",
      });
    } finally {
      setCashLoading(false);
    }
  }, [
    userIdOk,
    userId,
    cashPage,
    cashLimit,
    dateFrom,
    dateTo,
    sideFilter,
    accountCodes,
  ]);

  const reloadPayments = React.useCallback(async () => {
    if (!userIdOk) return;
    setPayLoading(true);
    try {
      const res = await getArqueoUsuarioDetalle({
        userId,
        page: payPage + 1,
        limit: payLimit,
        sortBy: "postedAt",
        sortDir: "desc",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        side: "debit",
        accountCodes: accountCodes || undefined,
      });
      const data = res?.data || {};
      setPayItems(data?.items || []);
      setPayTotal(Number(data?.total || 0));
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar el listado de pagos",
        sev: "error",
      });
    } finally {
      setPayLoading(false);
    }
  }, [userIdOk, userId, payPage, payLimit, dateFrom, dateTo, accountCodes]);

  const reloadClients = React.useCallback(async () => {
    if (!userIdOk) return;
    setCliLoading(true);
    try {
      const res = await listArqueoUsuarioClientes({
        userId,
        page: cliPage + 1,
        limit: cliLimit,
        q: debouncedCliQ || undefined, // ✅ debounce acá
        sortBy: cliSortBy,
        sortDir: cliSortDir,
      });
      const data = res?.data || {};
      setCliItems(data?.items || []);
      setCliTotal(Number(data?.total || 0));
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar el listado de clientes",
        sev: "error",
      });
    } finally {
      setCliLoading(false);
    }
  }, [
    userIdOk,
    userId,
    cliPage,
    cliLimit,
    debouncedCliQ,
    cliSortBy,
    cliSortDir,
  ]);

  // ✅ al escribir búsqueda, resetea página (pero NO fuerza request inmediato)
  React.useEffect(() => {
    if (tab !== "clientes") return;
    setCliPage(0);
  }, [cliQ, tab]);

  // ── Exportar TODOS los clientes (FULL) desde backend
  const exportAllClientsCSV = React.useCallback(async () => {
    if (!userIdOk) return;
    try {
      await downloadArqueoUsuarioClientesCSV({
        userId,
        q: cliQ || "",
        sortBy: cliSortBy,
        sortDir: cliSortDir,
        full: true,
        fileName: `clientes_cobrador_${userId}_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
      });
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo exportar el CSV de clientes",
        sev: "error",
      });
    }
  }, [userIdOk, userId, cliQ, cliSortBy, cliSortDir]);

  // primer disparo (cuando ya hay userIdOk)
  React.useEffect(() => {
    if (!userIdOk) return;
    if (tab === "caja") reloadCash();
    else if (tab === "pagos") reloadPayments();
    else reloadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdOk]);

  // recargas por cambios (✅ usa debouncedCliQ, NO cliQ)
  React.useEffect(() => {
    if (!userIdOk) return;
    if (tab === "caja") reloadCash();
    if (tab === "pagos") reloadPayments();
    if (tab === "clientes") reloadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    dateFrom,
    dateTo,
    sideFilter,
    accountCodes,
    cashPage,
    cashLimit,
    payPage,
    payLimit,
    cliPage,
    cliLimit,
    debouncedCliQ, // ✅ clave
    cliSortBy,
    cliSortDir,
  ]);

  const applyFilters = () => {
    setCashPage(0);
    setPayPage(0);
    if (tab === "caja") reloadCash();
    if (tab === "pagos") reloadPayments();
  };

  // Export local SOLO para caja/pagos
  const exportLocalCSV = () => {
    const rows =
      tab === "caja"
        ? [
            ["Tipo", "Concepto", "Monto", "Fecha", "Cuenta", "Lado"],
            ...cashItems.map((i) => [
              i.type || i.side || "",
              i.concept || i.memo || i.description || "—",
              i.amount ?? 0,
              i.postedAt || i.at || "",
              i.accountCode || "",
              i.side || i.type || "",
            ]),
          ]
        : [
            ["Ref/Recibo", "Cliente", "Método", "Monto", "Fecha", "Cuenta"],
            ...payItems.map((p) => [
              p.receiptId || p.ref || "—",
              p.clientName
                ? `${p.clientId || ""} - ${p.clientName}`.trim()
                : p.clientId || "—",
              p.method || p.paymentMethod || "—",
              p.amount ?? 0,
              p.postedAt || p.at || "",
              p.accountCode || "",
            ]),
          ];

    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "caja" ? `caja_${userId}.csv` : `pagos_${userId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onExportTop = () => {
    if (tab === "clientes") return exportAllClientsCSV();
    return exportLocalCSV();
  };

  const anyLoading = cashLoading || payLoading || cliLoading;

  // Abrir modal
  const onArquearCaja = () => {
    if (!userIdOk) return;
    if (tab === "caja") reloadCash();
    setArqueoNote("");
    setArqueoOpen(true);
  };

  const submitArqueo = async () => {
    if (!userIdOk) return;
    if (arqueoSubmitting) return;

    setArqueoSubmitting(true);
    try {
      await crearArqueoUsuario({
        userId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        note: (arqueoNote || "").trim(),
      });
      setToast({
        open: true,
        msg: "Arqueo realizado correctamente.",
        sev: "success",
      });
      setArqueoOpen(false);
      await reloadCash();
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo realizar el arqueo",
        sev: "error",
      });
    } finally {
      setArqueoSubmitting(false);
    }
  };

  const periodLabel = React.useCallback(() => {
    const from = (dateFrom || "").trim();
    const to = (dateTo || "").trim();
    if (!from && !to) return "Sin filtro de fechas";
    if (from && to) return `${from} → ${to}`;
    if (from) return `Desde ${from}`;
    return `Hasta ${to}`;
  }, [dateFrom, dateTo]);

  return (
    <>
      <CollectorDetailLayout
        user={user}
        tab={tab}
        setTab={setTab}
        anyLoading={anyLoading}
        onBack={onBack}
        onRefresh={() => {
          if (tab === "caja") reloadCash();
          else if (tab === "pagos") reloadPayments();
          else reloadClients();
        }}
        onExport={onExportTop}
        onArquearCaja={onArquearCaja}
        toast={toast}
        setToast={setToast}
      >
        {/* Filtros + KPIs + Tab content */}
        {tab !== "clientes" && (
          <Box mb={1.25}>
            <BoxFilters
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              sideFilter={sideFilter}
              setSideFilter={setSideFilter}
              accountCodes={accountCodes}
              setAccountCodes={setAccountCodes}
              onApply={applyFilters}
            />
          </Box>
        )}

        {tab === "caja" && (
          <>
            <CollectorCommissionSection
              user={user}
              dateFrom={dateFrom || undefined}
              dateTo={dateTo || undefined}
              disabled={anyLoading || !userIdOk}
              onAfterPay={reloadCash}
              setToast={setToast}
            />

            <Grid container spacing={1.25} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={4}>
                <Kpi
                  icon={<AccountBalanceWalletRoundedIcon color="primary" />}
                  label="Ingresos"
                  value={fmtMoney(cashTotals.debits)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Kpi
                  icon={<AccountBalanceWalletRoundedIcon color="action" />}
                  label="Egresos"
                  value={fmtMoney(cashTotals.credits)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Kpi
                  icon={<PaymentsRoundedIcon color="success" />}
                  label="Saldo"
                  value={fmtMoney(cashTotals.balance)}
                />
              </Grid>
            </Grid>

            <CashTable
              items={cashItems}
              total={cashTotal}
              page={cashPage}
              setPage={setCashPage}
              limit={cashLimit}
              setLimit={setCashLimit}
              loading={cashLoading}
              totalPages={totalCashPages}
              onReload={reloadCash}
            />
          </>
        )}

        {tab === "pagos" && (
          <PaymentsTable
            items={payItems}
            total={payTotal}
            page={payPage}
            setPage={setPayPage}
            limit={payLimit}
            setLimit={setPayLimit}
            loading={payLoading}
            totalPages={totalPayPages}
            onReload={reloadPayments}
          />
        )}

        {tab === "clientes" && (
          <>
            <ClientsFilters
              q={cliQ}
              setQ={setCliQ}
              sortBy={cliSortBy}
              setSortBy={setCliSortBy}
              sortDir={cliSortDir}
              setSortDir={setCliSortDir}
              onApply={() => {
                setCliPage(0);
                reloadClients();
              }}
              disabled={cliLoading}
            />
            <ClientsTable
              items={cliItems}
              total={cliTotal}
              page={cliPage}
              setPage={setCliPage}
              limit={cliLimit}
              setLimit={setCliLimit}
              loading={cliLoading}
              totalPages={totalCliPages}
              onReload={reloadClients}
              onExportCSV={exportAllClientsCSV}
              exportFileName={`clientes_cobrador_${userId}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`}
            />
          </>
        )}
      </CollectorDetailLayout>

      {/* ===================== MODAL ARQUEO ===================== */}
      <Dialog
        open={arqueoOpen}
        onClose={() => {
          if (arqueoSubmitting) return;
          setArqueoOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Arqueo de caja</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                Cobrador:
              </Typography>
              <Chip
                size="small"
                label={
                  user?.name
                    ? `${user?.name} (${userId})`
                    : `ID cobrador: ${userId}`
                }
              />
              <Chip size="small" variant="outlined" label={periodLabel()} />
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
              Resumen según filtros actuales
            </Typography>

            <Grid container spacing={1}>
              <Grid item xs={12} sm={4}>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Ingresos
                  </Typography>
                  <Typography variant="h6">
                    {fmtMoney(cashTotals.debits)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Egresos
                  </Typography>
                  <Typography variant="h6">
                    {fmtMoney(cashTotals.credits)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    Saldo (a contabilizar)
                  </Typography>
                  <Typography variant="h6">
                    {fmtMoney(cashTotals.balance)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            <Alert severity={cashTotalsFromApi ? "info" : "warning"}>
              {cashTotalsFromApi
                ? "Estos totales vienen del backend (incluyen todo el rango filtrado)."
                : "Estos totales se calcularon desde los ítems cargados en pantalla (pueden no representar el total real si hay paginación)."}
            </Alert>

            <TextField
              label="Nota (opcional)"
              placeholder="Ej: Arqueo fin de turno, faltante de cambio, etc."
              value={arqueoNote}
              onChange={(e) => setArqueoNote(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={arqueoSubmitting}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => setArqueoOpen(false)}
            disabled={arqueoSubmitting}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={submitArqueo}
            disabled={arqueoSubmitting || anyLoading || !userIdOk}
            startIcon={
              arqueoSubmitting ? <CircularProgress size={18} /> : undefined
            }
          >
            Confirmar arqueo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
