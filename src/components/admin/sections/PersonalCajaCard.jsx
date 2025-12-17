// src/components/admin/PersonalCajaCard.jsx
import React from "react";
import {
  Box,
  Paper,
  Stack,
  Chip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  InputAdornment,
  IconButton,
} from "@mui/material";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import SouthWestRoundedIcon from "@mui/icons-material/SouthWestRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { alpha } from "@mui/material/styles"; // ✅ FIX
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  getArqueoUsuarioDetalle,
  getArqueoGlobalTotals,
  depositoCajaChica,
  ingresoCajaGrande,
  extraccionCajaGrande,
} from "../../../api/arqueos.js";

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

function BalanceTile({
  icon,
  label,
  value,
  loading,
  color = "default",
  subtitle,
}) {
  return (
    <Paper
      variant="outlined"
      sx={(t) => ({
        p: 1.5,
        borderRadius: 2,
        minWidth: 210,
        flex: "1 1 210px",
        background:
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
        borderColor:
          color === "success"
            ? t.palette.success.main
            : alpha(t.palette.roles.outline, 0.8),
      })}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={(t) => ({
            width: 38,
            height: 38,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            backgroundColor:
              color === "success"
                ? alpha(t.palette.success.main, 0.14)
                : alpha(t.palette.primary.main, 0.12),
            color:
              color === "success"
                ? t.palette.success.main
                : t.palette.primary.main,
          })}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            {label}
          </Typography>
          {subtitle ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", opacity: 0.8 }}
            >
              {subtitle}
            </Typography>
          ) : null}

          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ lineHeight: 1.15, mt: 0.25 }}
          >
            {loading ? "…" : value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function PersonalCajaCard({ dateFrom, dateTo, onMoved }) {
  const { user } = useAuth() || {};
  const myId = user?._id || user?.id || user?.userId;
  const myRole = user?.role || "";

  const [loading, setLoading] = React.useState(false);
  const [saldoPersonal, setSaldoPersonal] = React.useState(0);
  const [saldoGlobal1, setSaldoGlobal1] = React.useState(0); // SA: CAJA_GRANDE | Admin: CAJA_CHICA
  const [saldoGlobal2, setSaldoGlobal2] = React.useState(0); // SA: CAJA_CHICA

  // Modales (solo SA)
  const [openRendir, setOpenRendir] = React.useState(false);
  const [openExtraer, setOpenExtraer] = React.useState(false);
  const [montoRendir, setMontoRendir] = React.useState("");
  const [montoExtraer, setMontoExtraer] = React.useState("");

  // Confirm modal (admin move all)
  const [openConfirmMove, setOpenConfirmMove] = React.useState(false);

  // Snackbar
  const [snack, setSnack] = React.useState({
    open: false,
    severity: "info",
    message: "",
  });
  const showSnack = (severity, message) =>
    setSnack({ open: true, severity, message });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const cfg = React.useMemo(() => {
    if (myRole === "admin") {
      return {
        title: "Mi caja (Admin)",
        personalCode: "CAJA_ADMIN",
        personalLabel: "CAJA_ADMIN",
        globalCodes: ["CAJA_CHICA"],
        globalLabels: ["CAJA_CHICA"],
        isSA: false,
        showAdminMoveBtn: true,
      };
    }
    if (myRole === "superAdmin") {
      return {
        title: "Mis cajas (SuperAdmin)",
        personalCode: "CAJA_SUPERADMIN",
        personalLabel: "CAJA_SUPERADMIN",
        globalCodes: ["CAJA_GRANDE", "CAJA_CHICA"],
        globalLabels: ["CAJA_GRANDE", "CAJA_CHICA"],
        isSA: true,
        showAdminMoveBtn: false,
      };
    }
    return null;
  }, [myRole]);

  const canShow = !!cfg && !!myId;

  const fetchBalances = React.useCallback(async () => {
    if (!canShow) return;
    setLoading(true);
    try {
      const pPersonal = getArqueoUsuarioDetalle({
        userId: myId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        accountCodes: cfg.personalCode,
        page: 1,
        limit: 1,
      });
      const pGlobal1 = getArqueoGlobalTotals({
        accountCodes: cfg.globalCodes[0],
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const pGlobal2 = cfg.globalCodes[1]
        ? getArqueoGlobalTotals({
            accountCodes: cfg.globalCodes[1],
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          })
        : Promise.resolve(null);

      const [rPer, rG1, rG2] = await Promise.all([
        pPersonal,
        pGlobal1,
        pGlobal2,
      ]);

      setSaldoPersonal(Number(rPer?.data?.header?.totals?.balance || 0));
      setSaldoGlobal1(Number(rG1?.data?.totals?.balance || 0));
      setSaldoGlobal2(Number(rG2?.data?.totals?.balance || 0));
    } catch (e) {
      console.error(e);
      showSnack("error", "No se pudieron cargar los saldos.");
    } finally {
      setLoading(false);
    }
  }, [canShow, myId, dateFrom, dateTo, cfg?.personalCode, cfg?.globalCodes]);

  React.useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // ADMIN: mover TODO ADMIN → CHICA (confirm modal)
  const requestMoveAllToChica = () => {
    const amt = Number(saldoPersonal || 0);
    if (amt <= 0) {
      showSnack("warning", "No hay saldo en CAJA_ADMIN para mover.");
      return;
    }
    setOpenConfirmMove(true);
  };

  const confirmMoveAllToChica = async () => {
    setOpenConfirmMove(false);
    try {
      await depositoCajaChica({ adminUserId: myId, currency: "ARS" });
      showSnack("success", "Movimiento realizado: CAJA_ADMIN → CAJA_CHICA.");
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      showSnack(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo mover a caja chica"
      );
    }
  };

  // SA: abrir/cerrar modales
  const openRendirModal = () => {
    setMontoRendir("");
    setOpenRendir(true);
  };
  const openExtraerModal = () => {
    setMontoExtraer("");
    setOpenExtraer(true);
  };
  const closeRendir = () => setOpenRendir(false);
  const closeExtraer = () => setOpenExtraer(false);

  // SA: helpers “Usar todo”
  const usarTodoRendir = () =>
    setMontoRendir(String(Math.max(0, Math.floor(Number(saldoGlobal2 || 0)))));
  const usarTodoExtraer = () =>
    setMontoExtraer(String(Math.max(0, Math.floor(Number(saldoGlobal1 || 0)))));

  // SA: submit rendición CHICA → GRANDE (monto obligatorio)
  const submitRendir = async () => {
    const monto = Number(montoRendir);
    if (!Number.isFinite(monto) || monto <= 0) {
      showSnack("warning", "Ingresá un monto válido mayor a 0.");
      return;
    }
    if (monto > Number(saldoGlobal2 || 0)) {
      showSnack(
        "warning",
        `El monto excede CAJA_CHICA (${fmtMoney(saldoGlobal2)}).`
      );
      return;
    }
    try {
      await ingresoCajaGrande({ amount: monto, currency: "ARS" });
      closeRendir();
      showSnack("success", "Rendición realizada: CHICA → GRANDE.");
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      showSnack(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo rendir a caja grande"
      );
    }
  };

  // SA: submit extracción GRANDE → SUPERADMIN (monto obligatorio)
  const submitExtraer = async () => {
    const monto = Number(montoExtraer);
    if (!Number.isFinite(monto) || monto <= 0) {
      showSnack("warning", "Ingresá un monto válido mayor a 0.");
      return;
    }
    if (monto > Number(saldoGlobal1 || 0)) {
      showSnack(
        "warning",
        `El monto excede CAJA_GRANDE (${fmtMoney(saldoGlobal1)}).`
      );
      return;
    }
    try {
      await extraccionCajaGrande({ amount: monto, currency: "ARS" });
      closeExtraer();
      showSnack("success", "Extracción realizada: GRANDE → Mi caja.");
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      showSnack(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo extraer de caja grande"
      );
    }
  };

  if (!canShow) return null;

  const disabledAdminMove = loading || Number(saldoPersonal) <= 0;
  const disabledRendir = loading || Number(saldoGlobal2) <= 0;
  const disabledExtraer = loading || Number(saldoGlobal1) <= 0;

  return (
    <>
      <Paper
        variant="outlined"
        sx={(t) => ({
          p: 2,
          mb: 1.5,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor:
            t.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
        })}
      >
        {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}

        <Stack spacing={1.5} sx={{ pt: 1.5 }}>
          {/* Header */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.25}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              flexWrap="wrap"
            >
              <LocalAtmRoundedIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={900}>
                {cfg.title}
              </Typography>

              <Chip
                size="small"
                variant="outlined"
                label={
                  myRole === "superAdmin" ? "GLOBAL + PERSONAL" : "PERSONAL"
                }
                sx={{ ml: 0.5, opacity: 0.9 }}
              />
            </Stack>

            {/* Acciones */}
            {cfg.showAdminMoveBtn ? (
              <Tooltip
                title={
                  Number(saldoPersonal) <= 0
                    ? "Sin saldo en CAJA_ADMIN"
                    : `Mover ${fmtMoney(saldoPersonal)} a CAJA_CHICA`
                }
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={<ArrowForwardRoundedIcon />}
                    onClick={requestMoveAllToChica}
                    disabled={disabledAdminMove}
                  >
                    Mover todo a caja chica
                  </Button>
                </span>
              </Tooltip>
            ) : (
              cfg.isSA && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Tooltip title="Rendir un monto desde CAJA_CHICA hacia CAJA_GRANDE">
                    <span>
                      <Button
                        variant="contained"
                        startIcon={<NorthEastRoundedIcon />}
                        onClick={openRendirModal}
                        disabled={disabledRendir}
                      >
                        Rendir CHICA → GRANDE
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip title="Extraer un monto desde CAJA_GRANDE a tu CAJA_SUPERADMIN">
                    <span>
                      <Button
                        variant="outlined"
                        startIcon={<SouthWestRoundedIcon />}
                        onClick={openExtraerModal}
                        disabled={disabledExtraer}
                      >
                        Extraer GRANDE → Mi caja
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              )
            )}
          </Stack>

          <Divider />

          {/* Balances */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <BalanceTile
              icon={<SavingsRoundedIcon />}
              label={cfg.personalLabel}
              subtitle="Personal"
              value={fmtMoney(saldoPersonal)}
              loading={loading}
              color="default"
            />

            <BalanceTile
              icon={<AccountBalanceRoundedIcon />}
              label={`${cfg.globalLabels[0]} (GLOBAL)`}
              subtitle="Caja global"
              value={fmtMoney(saldoGlobal1)}
              loading={loading}
              color="success"
            />

            {cfg.globalCodes[1] ? (
              <BalanceTile
                icon={<AccountBalanceRoundedIcon />}
                label={`${cfg.globalLabels[1]} (GLOBAL)`}
                subtitle="Caja global"
                value={fmtMoney(saldoGlobal2)}
                loading={loading}
                color="success"
              />
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {/* Confirm: Admin move all */}
      <Dialog
        open={openConfirmMove}
        onClose={() => setOpenConfirmMove(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmar movimiento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Se moverán <b>{fmtMoney(saldoPersonal)}</b> desde <b>CAJA_ADMIN</b>{" "}
            a <b>CAJA_CHICA (GLOBAL)</b>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmMove(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<DoneRoundedIcon />}
            onClick={confirmMoveAllToChica}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Rendir CHICA → GRANDE */}
      <Dialog open={openRendir} onClose={closeRendir} fullWidth maxWidth="xs">
        <DialogTitle>Rendir CHICA → GRANDE</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Saldo en CAJA_CHICA (GLOBAL): <b>{fmtMoney(saldoGlobal2)}</b>
            </Typography>

            <TextField
              autoFocus
              type="number"
              label="Monto a rendir"
              value={montoRendir}
              onChange={(e) => setMontoRendir(e.target.value)}
              inputProps={{ min: 0, step: "1" }}
              helperText={`Máximo: ${fmtMoney(saldoGlobal2)}`}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Usar todo">
                      <IconButton
                        onClick={usarTodoRendir}
                        edge="end"
                        size="small"
                      >
                        <DoneRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="caption" color="text.secondary">
              Se acreditará en CAJA_GRANDE (GLOBAL).
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRendir}>Cancelar</Button>
          <Button variant="contained" onClick={submitRendir} disabled={loading}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Extraer GRANDE → SUPERADMIN */}
      <Dialog open={openExtraer} onClose={closeExtraer} fullWidth maxWidth="xs">
        <DialogTitle>Extraer GRANDE → Mi caja</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} mt={0.5}>
            <Typography variant="body2" color="text.secondary">
              Saldo en CAJA_GRANDE (GLOBAL): <b>{fmtMoney(saldoGlobal1)}</b>
            </Typography>

            <TextField
              autoFocus
              type="number"
              label="Monto a extraer"
              value={montoExtraer}
              onChange={(e) => setMontoExtraer(e.target.value)}
              inputProps={{ min: 0, step: "1" }}
              helperText={`Máximo: ${fmtMoney(saldoGlobal1)}`}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Usar todo">
                      <IconButton
                        onClick={usarTodoExtraer}
                        edge="end"
                        size="small"
                      >
                        <DoneRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <Typography variant="caption" color="text.secondary">
              Se acreditará en tu CAJA_SUPERADMIN (personal).
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExtraer}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitExtraer}
            disabled={loading}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
