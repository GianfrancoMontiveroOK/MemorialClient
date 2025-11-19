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
} from "@mui/material";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

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
    } finally {
      setLoading(false);
    }
  }, [canShow, myId, dateFrom, dateTo, cfg?.personalCode, cfg?.globalCodes]);

  React.useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // ADMIN: mover TODO ADMIN → CHICA
  const onMoveAllToChica = async () => {
    const amt = Number(saldoPersonal || 0);
    if (amt <= 0) {
      window.alert("No hay saldo en CAJA_ADMIN para mover.");
      return;
    }
    if (
      !window.confirm(
        `Se moverán ${fmtMoney(
          amt
        )} desde CAJA_ADMIN a CAJA_CHICA (GLOBAL). ¿Confirmar?`
      )
    )
      return;

    try {
      await depositoCajaChica({ adminUserId: myId, currency: "ARS" });
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
      window.alert("Ingresá un monto válido mayor a 0.");
      return;
    }
    if (monto > Number(saldoGlobal2 || 0)) {
      const fmtMax = fmtMoney(saldoGlobal2);
      window.alert(
        `El monto excede el saldo disponible en CAJA_CHICA (${fmtMax}).`
      );
      return;
    }
    try {
      await ingresoCajaGrande({ amount: monto, currency: "ARS" });
      closeRendir();
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      window.alert(
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
      window.alert("Ingresá un monto válido mayor a 0.");
      return;
    }
    if (monto > Number(saldoGlobal1 || 0)) {
      const fmtMax = fmtMoney(saldoGlobal1);
      window.alert(
        `El monto excede el saldo disponible en CAJA_GRANDE (${fmtMax}).`
      );
      return;
    }
    try {
      await extraccionCajaGrande({ amount: monto, currency: "ARS" });
      closeExtraer();
      await fetchBalances();
      onMoved?.();
    } catch (e) {
      console.error(e);
      window.alert(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo extraer de caja grande"
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
            {cfg.title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Personal */}
          <Chip
            icon={<SavingsRoundedIcon />}
            color="default"
            variant="outlined"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {cfg.personalLabel}
                </Typography>
                <Typography variant="body2" fontWeight={800}>
                  {loading ? "…" : fmtMoney(saldoPersonal)}
                </Typography>
              </Stack>
            }
          />

          {/* Global 1 */}
          <Chip
            icon={<AccountBalanceRoundedIcon />}
            color="success"
            variant="outlined"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {cfg.globalLabels[0]} (GLOBAL)
                </Typography>
                <Typography variant="body2" fontWeight={800}>
                  {loading ? "…" : fmtMoney(saldoGlobal1)}
                </Typography>
              </Stack>
            }
          />

          {/* Global 2 (solo SA) */}
          {cfg.globalCodes[1] && (
            <Chip
              icon={<AccountBalanceRoundedIcon />}
              color="success"
              variant="outlined"
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {cfg.globalLabels[1]} (GLOBAL)
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {loading ? "…" : fmtMoney(saldoGlobal2)}
                  </Typography>
                </Stack>
              }
            />
          )}
        </Stack>

        {/* Acciones */}
        {cfg.showAdminMoveBtn ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<ArrowForwardRoundedIcon />}
              onClick={onMoveAllToChica}
              disabled={loading || Number(saldoPersonal) <= 0}
              title={
                Number(saldoPersonal) <= 0
                  ? "Sin saldo en CAJA_ADMIN"
                  : `Mover ${fmtMoney(saldoPersonal)} a CAJA_CHICA`
              }
            >
              Mover todo a caja chica
            </Button>
          </Stack>
        ) : (
          cfg.isSA && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={openRendirModal}
                disabled={loading || Number(saldoGlobal2) <= 0}
                title="Rendir un monto desde CAJA_CHICA hacia CAJA_GRANDE"
              >
                Rendir CHICA → GRANDE
              </Button>
              <Button
                variant="outlined"
                onClick={openExtraerModal}
                disabled={loading || Number(saldoGlobal1) <= 0}
                title="Extraer un monto desde CAJA_GRANDE a tu CAJA_SUPERADMIN"
              >
                Extraer GRANDE → Mi caja
              </Button>
            </Stack>
          )
        )}
      </Stack>

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
            />
            <Button onClick={usarTodoRendir} size="small">
              Usar todo
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRendir}>Cancelar</Button>
          <Button variant="contained" onClick={submitRendir}>
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
            />
            <Button onClick={usarTodoExtraer} size="small">
              Usar todo
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExtraer}>Cancelar</Button>
          <Button variant="contained" onClick={submitExtraer}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
