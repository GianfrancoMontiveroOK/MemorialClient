// src/components/adminPaymentsView/AdminPaymentsView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PaidIcon from "@mui/icons-material/Paid";
import { listAdminOfficePayments } from "../../api/adminPayments";

// Helpers locales para períodos tipo "YYYY-MM"
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const normalizePeriod = (s) => {
  const str = String(s || "").trim();
  return PERIOD_RE.test(str) ? str : null;
};
const comparePeriod = (a, b) => {
  const A = normalizePeriod(a);
  const B = normalizePeriod(b);
  if (!A || !B) return 0;
  return A === B ? 0 : A < B ? -1 : 1;
};

// Periodo actual aproximado (sin TZ fina, suficiente para UI)
const getCurrentPeriod = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(v) {
  if (typeof v !== "number") return "-";
  return v.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

const fmtMoney = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : "—";

/* ============================================================
 *  Helpers de agrupación de deuda IGUAL que en AccountCard
 * ============================================================ */

const periodToNum = (p = "") => Number(String(p).replace("-", "")) || 0; // "2025-12" => 202512
const nowPeriodNum = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return Number(`${d.getFullYear()}${mm}`);
};

/**
 * Agrupa períodos por "period" y recalcula:
 *  - charge
 *  - paid
 *  - balance
 *  - status (open / due / partial / paid / future / credit)
 *
 * Es el MISMO hook que se usa en collectorClientDetail/AccountCard.jsx
 */
function useGroupedDebt(debt) {
  return useMemo(() => {
    if (!Array.isArray(debt)) return [];
    const map = new Map();
    const nowNum = nowPeriodNum();

    for (const p of debt) {
      const key = p?.period;
      if (!key) continue;

      const charge = Number(p?.charge ?? p?.amountDue ?? 0) || 0;
      const paid = Number(p?.paid ?? 0) || 0;
      const balance =
        p?.balance != null
          ? Number(p.balance) || 0
          : Math.round((charge - paid) * 100) / 100;

      const prev = map.get(key) || {
        period: key,
        charge: 0,
        paid: 0,
        balance: 0,
        status: "open",
      };

      prev.charge += charge;
      prev.paid += paid;
      prev.balance += balance;

      // Resolver estado igual que en AccountCard
      let st = p?.status || prev.status;
      const isFutureByDate = periodToNum(key) > nowNum;

      if (st === "future") {
        // Mantener "future" salvo que exista crédito
        if (prev.balance < 0) st = "credit";
      } else {
        if (prev.balance < 0) st = "credit";
        else if (prev.balance > 0 && prev.paid > 0) st = "partial";
        else if (prev.balance > 0 && prev.paid === 0) {
          st = isFutureByDate ? "future" : "due";
        } else if (prev.balance === 0) {
          // Cero no implica "paid" si el período es futuro
          st = isFutureByDate ? "future" : "paid";
        }
      }

      prev.status = st;
      map.set(key, prev);
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => a.period.localeCompare(b.period)); // ascendente YYYY-MM
    return rows;
  }, [debt]);
}

/* ============================================================
 *  Card de períodos de deuda (similar a AccountCard)
 * ============================================================ */

function getStatusChipProps(status) {
  const st = String(status || "").toLowerCase();
  switch (st) {
    case "due":
      return { label: "Vencido", color: "error", variant: "filled" };
    case "partial":
      return { label: "Parcial", color: "warning", variant: "filled" };
    case "paid":
      return { label: "Pagado", color: "success", variant: "outlined" };
    case "future":
      return { label: "Futuro", color: "default", variant: "outlined" };
    case "credit":
      return { label: "Crédito", color: "secondary", variant: "filled" };
    default:
      return { label: status || "—", color: "default", variant: "outlined" };
  }
}

/**
 * AdminDebtAccountCard
 *
 * Muestra el detalle de períodos igual que AccountCard de cobradores,
 * pero embebido en la vista de admin (oficina).
 */
function AdminDebtAccountCard({ groupedDebt, hasDebt }) {
  const hasRows = Array.isArray(groupedDebt) && groupedDebt.length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Detalle de períodos de cuenta (vista global de deuda)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta vista resume, por período, cuánto se cargó, cuánto se pagó y el
            saldo restante, igual que ve el cobrador en su detalle de cliente.
          </Typography>
        </Box>

        {!hasRows ? (
          <Typography variant="body2" color="text.secondary">
            {hasDebt
              ? "No hay períodos detallados para mostrar."
              : "El cliente no presenta deuda en los períodos consultados."}
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 320,
              overflow: "auto",
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Cargo</TableCell>
                  <TableCell align="right">Pagado</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedDebt.map((row) => {
                  const { label, color, variant } = getStatusChipProps(
                    row.status
                  );
                  return (
                    <TableRow key={row.period} hover>
                      <TableCell>
                        <Typography variant="body2">{row.period}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={label}
                          color={color}
                          variant={variant}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {fmtMoney(row.charge)}
                      </TableCell>
                      <TableCell align="right">{fmtMoney(row.paid)}</TableCell>
                      <TableCell align="right">
                        {fmtMoney(row.balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

/* ============================================================
 * Dialog interno para aplicar pago desde oficina
 * ============================================================ */

/**
 * Dialog interno para aplicar pago desde oficina
 * Muy similar a ApplyPaymentDialog de cobradores:
 *  - Tab automático (FIFO) → paga toda la deuda detectada (autoTotal)
 *  - Tab manual → seleccionás períodos y manda breakdown
 * Regla extra:
 *  - Si monthsDue >= 3 → en manual hay que seleccionar al menos 2 períodos.
 *
 * ⛔ Importante:
 *  - debtPeriods ya viene AGRUPADO vía useGroupedDebt (igual que AccountCard).
 */
function AdminApplyPaymentDialog({
  open,
  onClose,
  client,
  debtPeriods,
  monthsDue = 0,
  minPeriodsToCharge = 0, // normalmente 2 cuando monthsDue >= 3
  onConfirmAuto,
  onConfirmManual,
}) {
  const [tab, setTab] = useState("auto");
  const [payLoading, setPayLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTab("auto");
      setError("");
    }
  }, [open]);

  // Construimos filas a partir de los períodos de deuda (YA agrupados)
  useEffect(() => {
    if (!open || !Array.isArray(debtPeriods)) return;

    const r = debtPeriods
      .filter((p) => {
        const bal = Number(p?.balance ?? p?.amountDue ?? 0) || 0;
        const st = String(p?.status || "").toLowerCase();
        // Igual que AccountCard: no considerar futuros para cobro
        return bal > 0 && st !== "future";
      })
      .map((p) => ({
        period: p.period,
        due: Number(p?.balance ?? p?.amountDue ?? 0) || 0,
        selected: false,
      }));

    setRows(r);
  }, [open, debtPeriods]);

  const totalManual = useMemo(
    () =>
      rows
        .filter((r) => r.selected)
        .reduce((acc, r) => acc + Number(r.due || 0), 0),
    [rows]
  );

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows]
  );

  // Total FIFO igual que collector: sumamos balances > 0 y no futuros
  const autoTotal = useMemo(() => {
    if (!Array.isArray(debtPeriods)) return 0;
    return debtPeriods
      .filter((p) => {
        const bal = Number(p?.balance ?? 0) || 0;
        const st = String(p?.status || "").toLowerCase();
        return bal > 0 && st !== "future";
      })
      .reduce((acc, p) => acc + (Number(p.balance) || 0), 0);
  }, [debtPeriods]);

  const updateRow = (period, checked) =>
    setRows((cur) =>
      cur.map((x) => (x.period === period ? { ...x, selected: checked } : x))
    );

  const hasClient = !!client;
  const noPendingRows = rows.length === 0;

  const handleConfirm = async () => {
    if (!hasClient) return;
    setError("");

    try {
      setPayLoading(true);

      if (tab === "auto") {
        // FIFO completo: mandamos estrategia "auto" y total a pagar
        const amount = Number(autoTotal) || 0;
        await onConfirmAuto?.({
          strategy: "auto",
          amount,
        });
      } else {
        // MANUAL por período
        const breakdown = rows
          .filter((r) => r.selected && r.due > 0)
          .map((r) => ({ period: r.period, amount: Number(r.due) }));

        if (!breakdown.length) {
          setError("Seleccioná al menos un período para cobrar.");
          return;
        }

        // Regla: si tiene 3 períodos de atraso → al menos 2 períodos seleccionados
        if (minPeriodsToCharge > 0 && selectedCount < minPeriodsToCharge) {
          setError(
            `Este cliente tiene ${monthsDue} períodos de atraso. Debés seleccionar al menos ${minPeriodsToCharge} períodos para cobrar desde oficina.`
          );
          return;
        }

        const amount = breakdown.reduce(
          (acc, r) => acc + Number(r.amount || 0),
          0
        );

        await onConfirmManual?.({
          strategy: "manual",
          amount,
          breakdown,
        });
      }

      // Si la confirmación no tiró error arriba, cerramos
      onClose?.();
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={payLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={800}>
            Aplicar pago (oficina)
          </Typography>
          {hasClient && (
            <Typography variant="body2" color="text.primary" noWrap>
              {client.nombre} · #{client.idCliente ?? "s/n"}
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(_, newValue) => {
            setTab(newValue);
            setError("");
          }}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          TabIndicatorProps={{
            sx: {
              height: 3,
              borderRadius: 999,
            },
          }}
          sx={{ mb: 2 }}
        >
          <Tab
            value="auto"
            label="Automático (TODO)"
            sx={{
              textTransform: "none",
              fontSize: 13,
              minHeight: 40,
              "&.Mui-selected": {
                bgcolor: "action.selected",
                color: "text.primary",
                borderRadius: 999,
              },
            }}
          />
          <Tab
            value="manual"
            label="Manual (por período)"
            sx={{
              textTransform: "none",
              fontSize: 13,
              minHeight: 40,
              "&.Mui-selected": {
                bgcolor: "action.selected",
                color: "text.primary",
                borderRadius: 999,
              },
            }}
          />
        </Tabs>

        {tab === "auto" ? (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.primary">
              El sistema aplica el pago empezando por la deuda más antigua.
              En oficina, esto normalmente significa cancelar todos los
              períodos con saldo.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography color="text.primary" variant="body2">
                Deuda detectada hasta hoy
              </Typography>
              <Typography fontWeight={800}>
                {fmtMoney(Number(autoTotal) || 0)}
              </Typography>
            </Paper>

            {autoTotal <= 0 && (
              <Typography variant="body2" color="text.primary">
                No se detectan saldos pendientes. Si existe un pago adelantado,
                el sistema lo considerará crédito.
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.primary">
              Seleccioná los períodos a cancelar desde oficina. El total del
              cobro será la suma de los montos seleccionados.
            </Typography>

            {monthsDue >= 3 && (
              <Typography variant="body2" color="warning.main">
                Tiene {monthsDue} períodos de atraso. Según la regla interna, en
                oficina se deben cobrar al menos {minPeriodsToCharge} períodos
                en este caso (o todos con "Automático").
              </Typography>
            )}

            <Stack
              spacing={0.75}
              sx={{ maxHeight: 300, overflow: "auto", pr: 0.5 }}
            >
              {rows.length ? (
                rows.map((row) => (
                  <Paper
                    key={row.period}
                    variant="outlined"
                    sx={{
                      px: 1,
                      py: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={row.selected}
                          onChange={(e) =>
                            updateRow(row.period, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Typography variant="body2">{row.period}</Typography>
                      }
                      sx={{ m: 0, mr: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ minWidth: 140, textAlign: "right" }}
                    >
                      A pagar: {fmtMoney(row.due)}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.primary">
                  No hay períodos con saldo pendiente para aplicar manualmente.
                </Typography>
              )}
            </Stack>

            <Divider />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2">Total seleccionado</Typography>
              <Typography fontWeight={800}>{fmtMoney(totalManual)}</Typography>
            </Stack>
          </Stack>
        )}

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={payLoading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<PaidIcon />}
          onClick={handleConfirm}
          disabled={
            payLoading ||
            !hasClient ||
            (tab === "manual" &&
              (totalManual <= 0 || noPendingRows || rows.length === 0))
          }
        >
          {payLoading ? "Registrando…" : "Confirmar pago"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ============================================================
 * AdminPaymentsView
 * ============================================================ */

/**
 * AdminPaymentsView
 *
 * Props:
 *  - clienteId: _id Mongo del miembro
 *  - idCliente: N° de grupo (int)
 *  - nombre: nombre del cliente (para título)
 *  - debt: resumen de deuda (__debt) o directamente array de períodos
 *  - onCharge: fn opcional que efectivamente llama al backend
 *      (recibe { clienteId, idCliente, nombre, debt, chargeRule, payload })
 */
export default function AdminPaymentsView({
  clienteId,
  idCliente,
  nombre,
  debt,
  onCharge,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page] = useState(1);
  const [pageSize] = useState(50);

  // estado del dialogo de cobro
  const [applyOpen, setApplyOpen] = useState(false);

  const canLoad = Boolean(clienteId);

  const loadPayments = async () => {
    if (!canLoad) return;
    setLoading(true);
    setErr("");
    try {
      const res = await listAdminOfficePayments({
        clientId: clienteId,
        page,
        limit: pageSize,
        sortBy: "postedAt",
        sortDir: "desc",
      });

      const data = res?.data;
      if (data?.ok || data?.okList || Array.isArray(data?.items)) {
        setItems(data.items || []);
      } else {
        setErr("No se pudo cargar el historial de pagos de oficina.");
      }
    } catch (e) {
      console.error("Error al cargar pagos admin:", e);
      setErr("Error al cargar los pagos de oficina.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Normalizamos debt:
  //  - periodsCrudos: array de períodos como viene del backend
  const debtPeriodsRaw = useMemo(() => {
    if (!debt) return [];
    if (Array.isArray(debt)) return debt;
    if (Array.isArray(debt.periods)) return debt.periods;
    return [];
  }, [debt]);

  // AGRUPADO igual que AccountCard (lo que ve el cobrador)
  const groupedDebt = useGroupedDebt(debtPeriodsRaw);

  const monthsDue = useMemo(() => {
    if (!debt) return 0;
    if (typeof debt.monthsDue === "number") return debt.monthsDue;
    if (typeof debt.summary?.monthsDue === "number")
      return debt.summary.monthsDue;
    return 0;
  }, [debt]);

  const totalDueUpToNow = useMemo(() => {
    if (!debt) return null;
    if (typeof debt.totalDueUpToNow === "number") return debt.totalDueUpToNow;
    if (typeof debt.summary?.totalBalanceDue === "number")
      return debt.summary.totalBalanceDue;
    return null;
  }, [debt]);

  const hasDebt = useMemo(() => {
    if (!debt) return false;
    if (typeof debt.hasDebt === "boolean") return debt.hasDebt;
    return monthsDue > 0 || (totalDueUpToNow ?? 0) > 0;
  }, [debt, monthsDue, totalDueUpToNow]);

  // ======== Resumen de estado de período (simple, por pagos de oficina) ========
  const { lastPayment, lastPeriod, currentPeriod } = useMemo(() => {
    if (!items.length) {
      return {
        lastPayment: null,
        lastPeriod: null,
        currentPeriod: getCurrentPeriod(),
      };
    }

    // Tomamos el pago más reciente por postedAt
    const sorted = [...items].sort((a, b) => {
      const da = a.postedAt || a.createdAt || "";
      const db = b.postedAt || b.createdAt || "";
      return da < db ? 1 : da > db ? -1 : 0;
    });
    const lp = sorted[0] || null;

    // Buscamos el período más "nuevo" imputado en la meta de TODOS los pagos
    let maxPeriod = null;
    for (const p of items) {
      const periods = p?.meta?.periodsApplied || [];
      for (const per of periods) {
        const norm = normalizePeriod(per);
        if (!norm) continue;
        if (!maxPeriod || comparePeriod(norm, maxPeriod) > 0) {
          maxPeriod = norm;
        }
      }
    }

    return {
      lastPayment: lp,
      lastPeriod: maxPeriod,
      currentPeriod: getCurrentPeriod(),
    };
  }, [items]);

  const periodStatusLabel = useMemo(() => {
    if (!lastPeriod) {
      return "Sin períodos imputados desde oficina";
    }
    if (comparePeriod(lastPeriod, currentPeriod) >= 0) {
      return `Al día hasta ${lastPeriod}`;
    }
    return `Último período imputado: ${lastPeriod}`;
  }, [lastPeriod, currentPeriod]);

  // ======== Chip de deuda GLOBAL (__debt del backend) ========
  const debtUi = useMemo(() => {
    if (!debt) return null;

    const nowPeriod = debt.nowPeriod || debt.meta?.end || getCurrentPeriod();

    if (!hasDebt) {
      return {
        label: `Al día (sin deuda hasta ${nowPeriod || "-"})`,
        color: "success",
        variant: "outlined",
      };
    }

    const labelBase = "Tiene deuda";
    const montoTxt =
      typeof totalDueUpToNow === "number"
        ? ` · Saldo: ${formatAmount(totalDueUpToNow)}`
        : "";

    const lastDuePeriod =
      debt.lastDuePeriod ||
      (() => {
        // Si no viene del backend, lo calculamos desde los períodos AGRUPADOS
        const rows = (groupedDebt || []).filter((r) => {
          const st = String(r.status || "").toLowerCase();
          return st === "due" || st === "partial";
        });
        if (!rows.length) return null;
        return rows.map((r) => r.period).sort((a, b) => (a < b ? 1 : -1))[0];
      })();

    const periodTxt = lastDuePeriod
      ? ` · Último período con saldo: ${lastDuePeriod}`
      : "";
    return {
      label: `${labelBase}${montoTxt}${periodTxt}`,
      color: "error",
      variant: "filled",
    };
  }, [debt, hasDebt, groupedDebt, totalDueUpToNow]);

  // ======== Regla de cobro desde oficina según meses de atraso ========
  const officeChargeRule = useMemo(() => {
    if (!hasDebt || monthsDue <= 0) {
      return {
        status: "ok",
        monthsDue,
        minPeriodsToCharge: 0,
        message: "",
      };
    }

    if (monthsDue >= 4) {
      return {
        status: "blocked",
        monthsDue,
        minPeriodsToCharge: 0,
        message:
          "El grupo tiene 4 o más períodos de atraso. Según la regla, el plan se da de baja y no debería cobrarse por oficina.",
      };
    }

    if (monthsDue >= 3) {
      return {
        status: "restricted",
        monthsDue,
        minPeriodsToCharge: 2,
        message:
          "Tiene 3 períodos de atraso. Desde oficina se debe cobrar al menos 2 períodos (o todos con Automático).",
      };
    }

    // 1 o 2 períodos de atraso → se puede cobrar normalmente (1 período, FIFO, etc.)
    return {
      status: "ok",
      monthsDue,
      minPeriodsToCharge: 0,
      message: "",
    };
  }, [hasDebt, monthsDue]);

  const chargeTooltip = useMemo(() => {
    if (officeChargeRule.status === "blocked") {
      return officeChargeRule.message || "Cobro bloqueado por regla de atraso.";
    }
    if (officeChargeRule.status === "restricted") {
      return (
        officeChargeRule.message ||
        "Tiene 3 períodos de atraso. Cobrar al menos 2 períodos."
      );
    }
    return "Registrar cobro desde oficina";
  }, [officeChargeRule]);

  const chargeHelperText = useMemo(() => {
    if (officeChargeRule.status === "blocked") {
      return officeChargeRule.message;
    }
    if (officeChargeRule.status === "restricted") {
      return officeChargeRule.message;
    }
    return "";
  }, [officeChargeRule]);

  // ======== Handlers de confirmación del diálogo (llaman onCharge) ========
  const handleConfirmAuto = async ({ strategy, amount }) => {
    if (!onCharge || !clienteId) return;
    const payload = {
      strategy: strategy || "auto",
      amount,
      breakdown: [],
    };
    await onCharge({
      clienteId,
      idCliente,
      nombre,
      debt,
      chargeRule: officeChargeRule,
      payload,
    });
    // refrescamos lista después del cobro
    await loadPayments();
  };

  const handleConfirmManual = async ({ strategy, amount, breakdown }) => {
    if (!onCharge || !clienteId) return;
    const payload = {
      strategy: strategy || "manual",
      amount,
      breakdown,
    };
    await onCharge({
      clienteId,
      idCliente,
      nombre,
      debt,
      chargeRule: officeChargeRule,
      payload,
    });
    await loadPayments();
  };

  return (
    <>
      <Stack spacing={2}>
        {/* Resumen de estado de período + deuda */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Estado de pagos (oficina) y deuda
              </Typography>
              <Typography variant="h6">
                {nombre || "Cliente"}{" "}
                {typeof idCliente !== "undefined" &&
                  idCliente !== null &&
                  `(#${idCliente})`}
              </Typography>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                {/* Estado según imputación de pagos de oficina */}
                <Chip
                  label={periodStatusLabel}
                  color={lastPeriod ? "success" : "default"}
                  size="large"
                />

                {/* Estado global de deuda si viene del backend */}
                {debtUi && (
                  <Chip
                    label={debtUi.label}
                    color={debtUi.color}
                    size="large"
                    variant={debtUi.variant}
                  />
                )}

                {/* Último pago registrado */}
                {lastPayment && (
                  <Chip
                    icon={<ReceiptLongIcon fontSize="small" />}
                    label={`Último pago: ${formatDateTime(
                      lastPayment.postedAt || lastPayment.createdAt
                    )}`}
                    size="large"
                    variant="outlined"
                  />
                )}
              </Stack>

              {lastPayment && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  mt={1}
                  sx={{ fontStyle: "italic" }}
                >
                  Monto último pago: {formatAmount(lastPayment.amount)} ·
                  Método: {lastPayment.method} · Canal: {lastPayment.channel}
                </Typography>
              )}

              {chargeHelperText && (
                <Typography
                  variant="body2"
                  color={
                    officeChargeRule.status === "blocked"
                      ? "error.main"
                      : "warning.main"
                  }
                  mt={1}
                >
                  {chargeHelperText}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* BOTÓN DE COBRAR DESDE OFICINA → abre el dialogo interno */}
              <Tooltip title={chargeTooltip}>
                <span>
                  <Button
                    size="large"
                    variant="brandYellow"
                    startIcon={<PaidRoundedIcon fontSize="small" />}
                    disabled={
                      !clienteId ||
                      loading ||
                      officeChargeRule.status === "blocked"
                    }
                    onClick={() => setApplyOpen(true)}
                  >
                    Cobrar
                  </Button>
                </span>
              </Tooltip>

              {loading && <CircularProgress size={24} />}
              <Tooltip title="Actualizar pagos">
                <span>
                  <IconButton
                    onClick={loadPayments}
                    disabled={loading || !canLoad}
                    size="small"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Card tipo AccountCard con períodos de deuda */}
        <AdminDebtAccountCard groupedDebt={groupedDebt} hasDebt={hasDebt} />

        {err && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {err}
          </Alert>
        )}

        {/* Tabla de pagos */}
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Historial de pagos desde oficina
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cobros registrados por usuarios con rol admin / superAdmin sobre
              este cliente.
            </Typography>
          </Box>

          {loading && !items.length ? (
            <Box
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : !items.length ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No hay pagos de oficina registrados para este cliente.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2, pt: 0, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Períodos imputados</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Recibo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((p) => {
                    const periods = p?.meta?.periodsApplied || [];
                    const receipt = p?.receipt || null;
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
                          {formatDateTime(p.postedAt || p.createdAt)}
                        </TableCell>
                        <TableCell>
                          {periods.length ? (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {periods.map((per) => (
                                <Chip
                                  key={per}
                                  label={per}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatAmount(p.amount)}
                        </TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell>{p.channel}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.status}
                            size="small"
                            color={
                              p.status === "posted"
                                ? "primary"
                                : p.status === "settled"
                                ? "success"
                                : p.status === "reversed"
                                ? "error"
                                : "default"
                            }
                            variant={
                              p.status === "posted" || p.status === "settled"
                                ? "filled"
                                : "outlined"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {receipt && receipt.number ? (
                            <Tooltip
                              title={
                                receipt.pdfUrl
                                  ? "Ver recibo en nueva pestaña"
                                  : "Recibo emitido"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!receipt.pdfUrl}
                                  onClick={() => {
                                    if (receipt.pdfUrl) {
                                      window.open(receipt.pdfUrl, "_blank");
                                    }
                                  }}
                                >
                                  <ReceiptLongIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Stack>

      {/* Dialogo interno tipo ApplyPaymentDialog (usa deuda AGRUPADA igual que cobradores) */}
      <AdminApplyPaymentDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        client={{
          _id: clienteId,
          idCliente,
          nombre,
        }}
        debtPeriods={groupedDebt}
        monthsDue={monthsDue}
        minPeriodsToCharge={officeChargeRule.minPeriodsToCharge}
        onConfirmAuto={handleConfirmAuto}
        onConfirmManual={handleConfirmManual}
      />
    </>
  );
}
