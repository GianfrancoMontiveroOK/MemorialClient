// src/components/admin/sectionsAdminPanel/CollectorDetailSection.jsx
import * as React from "react";
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Button,
  Alert,
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
  fmtMoney,
  sumTotals,
} from "../../arqueoSections";

import {
  getArqueoUsuarioDetalle,
  crearArqueoUsuario,
  listArqueoUsuarioClientes,
  downloadArqueoUsuarioClientesCSV,
  pagarComisionCobrador,
  // ⬇️ NUEVO: resumen de comisión (admin)
  getCollectorCommissionSummaryAdmin,
} from "../../../api/arqueos";

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

  // feedback general
  const [toast, setToast] = React.useState({
    open: false,
    msg: "",
    sev: "success",
  });

  // ───────────── Comisiones: estado del modal ─────────────
  const [commissionDialogOpen, setCommissionDialogOpen] = React.useState(false);
  const [commissionLoading, setCommissionLoading] = React.useState(false);
  const [commissionSummaryLoading, setCommissionSummaryLoading] =
    React.useState(false);
  const [commissionSummary, setCommissionSummary] = React.useState(null);

  const collectorPercent = React.useMemo(() => {
    if (user?.porcentajeCobrador != null) {
      const n = Number(user.porcentajeCobrador);
      return Number.isFinite(n) ? n : 0;
    }
    if (user?.commissionPercent != null) {
      const n = Number(user.commissionPercent);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }, [user]);

  // Fallback de sugerencia vieja (debitos * %), por si todavía no hay resumen
  const suggestedCommissionFallback = React.useMemo(() => {
    if (!collectorPercent || !Number.isFinite(collectorPercent)) return null;
    const base = Number(cashTotals.debits || 0);
    if (!base) return null;
    return (base * collectorPercent) / 100;
  }, [collectorPercent, cashTotals.debits]);

  // Derivados del summary
  const pendingCommission = React.useMemo(() => {
    if (!commissionSummary) return 0;
    const raw = commissionSummary?.commissions?.amounts?.pendingCommission ?? 0;
    return Number(raw) || 0;
  }, [commissionSummary]);

  const expectedCommission = React.useMemo(() => {
    if (!commissionSummary) return 0;
    const raw =
      commissionSummary?.commissions?.amounts?.expectedCommission ?? 0;
    return Number(raw) || 0;
  }, [commissionSummary]);

  const totalCommissionNoPenalty = React.useMemo(() => {
    if (!commissionSummary) return 0;
    const raw =
      commissionSummary?.commissions?.amounts?.totalCommissionNoPenalty ?? 0;
    return Number(raw) || 0;
  }, [commissionSummary]);

  const totalCommissionEffective = React.useMemo(() => {
    if (!commissionSummary) return 0;
    const raw = commissionSummary?.commissions?.amounts?.totalCommission ?? 0;
    return Number(raw) || 0;
  }, [commissionSummary]);

  const alreadyPaidCommission = React.useMemo(() => {
    if (!commissionSummary) return 0;
    const raw = commissionSummary?.commissions?.amounts?.alreadyPaid ?? 0;
    return Number(raw) || 0;
  }, [commissionSummary]);

  const collectorBalanceFromSummary = React.useMemo(() => {
    if (!commissionSummary) return null;
    const raw = commissionSummary?.balance?.collectorBalance ?? null;
    return raw;
  }, [commissionSummary]);

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
        q: cliQ || undefined,
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
  }, [userIdOk, userId, cliPage, cliLimit, cliQ, cliSortBy, cliSortDir]);

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
        filename: `clientes_cobrador_${userId}_${new Date()
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

  // primer disparo
  React.useEffect(() => {
    if (!userIdOk) return;
    if (tab === "caja") reloadCash();
    else if (tab === "pagos") reloadPayments();
    else reloadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdOk]);

  // recargas por cambios
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
    cliQ,
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

  const onArquearCaja = async () => {
    if (!userIdOk) return;
    const note = window.prompt("Nota opcional para el arqueo:", "") || "";
    try {
      await crearArqueoUsuario({
        userId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        note,
      });
      setToast({
        open: true,
        msg: "Arqueo realizado correctamente.",
        sev: "success",
      });
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
    }
  };

  const anyLoading = cashLoading || payLoading || cliLoading;

  // ───────────── Handler pagar comisión ─────────────
  const handleOpenCommissionDialog = async () => {
    if (!userIdOk) return;
    setCommissionSummary(null);
    setCommissionDialogOpen(true);
    try {
      setCommissionSummaryLoading(true);
      const res = await getCollectorCommissionSummaryAdmin({
        userId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const data = res?.data?.data || null;
      setCommissionSummary(data || null);
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar el resumen de comisión del cobrador.",
        sev: "error",
      });
    } finally {
      setCommissionSummaryLoading(false);
    }
  };

  const handleCloseCommissionDialog = () => {
    if (commissionLoading || commissionSummaryLoading) return;
    setCommissionDialogOpen(false);
  };

  const handleConfirmCommission = async () => {
    if (!userIdOk) return;
    const amountNum = Number(pendingCommission);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setToast({
        open: true,
        msg: "No hay comisión pendiente para pagar en este rango.",
        sev: "warning",
      });
      return;
    }

    try {
      setCommissionLoading(true);
      const res = await pagarComisionCobrador({
        userId,
        amount: amountNum,
        note: `Pago automático de comisión (rango ${dateFrom || "inicio"} ${
          dateTo ? "a " + dateTo : ""
        })`,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (
        res?.status === 200 ||
        res?.status === 201 ||
        res?.data?.ok === true
      ) {
        setToast({
          open: true,
          msg: "Comisión pagada correctamente desde CAJA_ADMIN.",
          sev: "success",
        });
        setCommissionDialogOpen(false);
        await reloadCash();
      } else {
        setToast({
          open: true,
          msg:
            res?.data?.message ||
            "No se pudo registrar el pago de comisión del cobrador.",
          sev: "error",
        });
      }
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        msg:
          e?.response?.data?.message ||
          e?.message ||
          "Error al pagar la comisión del cobrador.",
        sev: "error",
      });
    } finally {
      setCommissionLoading(false);
    }
  };

  return (
    <>
      <CollectorDetailLayout
        user={user}
        tab={tab}
        setTab={setTab}
        anyLoading={anyLoading || commissionLoading || commissionSummaryLoading}
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
              disabled={anyLoading}
            />
          </Box>
        )}

        {tab === "caja" && (
          <>
            {/* Botón para pagar comisión desde CAJA_ADMIN */}
            <Box
              mb={1}
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={1}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenCommissionDialog}
                disabled={anyLoading || !userIdOk}
                startIcon={<PaymentsRoundedIcon />}
              >
                Pagar comisión
              </Button>
            </Box>

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

      {/* ───────────── Modal de pago de comisión ───────────── */}
      <Dialog
        open={commissionDialogOpen}
        onClose={handleCloseCommissionDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Pagar comisión al cobrador</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {user?.name ? `Cobrador: ${user.name}` : "Cobrador"}
              {collectorPercent ? ` · Comisión base: ${collectorPercent}%` : ""}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Saldo en mano (filtro actual):{" "}
              {fmtMoney(
                collectorBalanceFromSummary != null
                  ? collectorBalanceFromSummary
                  : cashTotals.balance || 0
              )}
            </Typography>

            {commissionSummaryLoading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">
                  Calculando comisión del período...
                </Typography>
              </Stack>
            )}

            {!commissionSummaryLoading && commissionSummary && (
              <>
                <Alert severity="info" variant="outlined">
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Comisión ideal (si cobrara todo en término):{" "}
                      <strong>{fmtMoney(expectedCommission)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Comisión por pagos del período (sin castigo):{" "}
                      <strong>{fmtMoney(totalCommissionNoPenalty)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Comisión efectiva hoy (con penalidad por demora):{" "}
                      <strong>{fmtMoney(totalCommissionEffective)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Ya pagado como comisión:{" "}
                      <strong>{fmtMoney(alreadyPaidCommission)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      <strong>
                        Comisión pendiente a pagar ahora:{" "}
                        {fmtMoney(pendingCommission)}
                      </strong>
                    </Typography>
                  </Stack>
                </Alert>
              </>
            )}

            {!commissionSummaryLoading &&
              !commissionSummary &&
              suggestedCommissionFallback != null && (
                <Alert severity="info" variant="outlined">
                  No se pudo cargar el resumen detallado. Sugerencia rápida
                  (ingresos * %):{" "}
                  <strong>{fmtMoney(suggestedCommissionFallback)}</strong>
                </Alert>
              )}

            <TextField
              label="Nota (opcional)"
              multiline
              minRows={2}
              fullWidth
              disabled={commissionLoading || commissionSummaryLoading}
              value={commissionSummary?.commissions?.config?.noteOverride ?? ""}
              onChange={() => {
                /* si querés una nota editable, podés agregar estado aparte;
                   por ahora dejamos fija o vacía para no complicar */
              }}
              placeholder="Ej: Comisión mensual cobrador zona centro..."
              sx={{ display: "none" }} // oculto por ahora (no pedir nada)
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseCommissionDialog}
            disabled={commissionLoading || commissionSummaryLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCommission}
            disabled={
              commissionLoading ||
              commissionSummaryLoading ||
              !userIdOk ||
              pendingCommission <= 0
            }
            startIcon={
              commissionLoading ? (
                <CircularProgress size={16} />
              ) : (
                <PaymentsRoundedIcon />
              )
            }
          >
            {pendingCommission > 0
              ? `Pagar ${fmtMoney(pendingCommission)}`
              : "Sin comisión pendiente"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
