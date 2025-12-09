// src/components/ClienteOverviewSmart.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

import { repriceGroup } from "../api/adminPricing";
import { fmtMoney, fmtDate, BooleanBadge, LabelValue } from "./ui";

/* ---------- helpers ---------- */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

export default function ClienteOverviewSmart({
  item, // titular actual (doc principal)
  family = [], // integrantes (excluye titular)
  loading = false,
  removing = false,

  onBack,
  onEdit,
  onDelete,

  onAddIntegrante,
  onViewMember,
  onEditMember,

  // opcional: refrescar luego de reprice
  onRefresh,
}) {
  // UI local
  const [repriceLoading, setRepriceLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", sev: "info" });
  const [localPatch, setLocalPatch] = useState(null); // para reflejar cambios post-reprice

  const showToast = (msg, sev = "info") => setToast({ open: true, msg, sev });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  // Item mostrado (original + patch local post-reprice)
  const displayItem = { ...(item || {}), ...(localPatch || {}) };

  const usarIdeal = !!displayItem?.usarCuotaIdeal;
  const cobrado = isNum(displayItem?.cuota) ? displayItem.cuota : null; // histórica
  const ideal = isNum(displayItem?.cuotaIdeal) ? displayItem.cuotaIdeal : null;

  // Cuál es la cuota VIGENTE (la que realmente se cobra hoy)
  const vigente = usarIdeal ? ideal : cobrado;

  const desvAbs = vigente != null && ideal != null ? vigente - ideal : null; // vigente - ideal
  const desvPct =
    ideal && ideal > 0 && desvAbs != null ? (desvAbs / ideal) * 100 : null;

  const integrantesCount = useMemo(() => {
    const base = Number(item?.grupoFamiliar) || 1;
    return Math.max(base, 1 + (Array.isArray(family) ? family.length : 0));
  }, [item, family]);

  // ⚖️ Info de deuda simple (para el chip de “Al día / Debe”)
  // Esperamos algo tipo:
  //   item.__debt = {
  //     status: "up_to_date" | "in_arrears" | "al_dia" | "en_mora" | ...,
  //     balance: number (puede venir como string),
  //     // opcionales: saldo, amount, monto...
  //   }
  const debtInfo =
    (displayItem && displayItem.__debt) || (item && item.__debt) || null;

  let debtLabel = "Estado de deuda: sin datos";
  let debtColor = "default";
  let debtVariant = "outlined";

  if (debtInfo) {
    const status = String(debtInfo.status || "").toLowerCase();

    const hasBalanceField =
      typeof debtInfo.balance !== "undefined" ||
      typeof debtInfo.saldo !== "undefined" ||
      typeof debtInfo.amount !== "undefined" ||
      typeof debtInfo.monto !== "undefined";

    const balanceRaw =
      debtInfo.balance ??
      debtInfo.saldo ??
      debtInfo.amount ??
      debtInfo.monto ??
      null;

    const balance =
      typeof balanceRaw === "number"
        ? balanceRaw
        : balanceRaw != null && !Number.isNaN(Number(balanceRaw))
        ? Number(balanceRaw)
        : null;

    // 1) Si viene status explícito, manda status
    if (status) {
      if (["up_to_date", "al_dia", "ok"].includes(status)) {
        debtLabel = "Al día";
        debtColor = "success";
        debtVariant = "filled";
      } else if (
        ["in_arrears", "en_mora", "debe", "con_deuda"].includes(status)
      ) {
        if (balance != null && balance > 0) {
          debtLabel = `Debe ${fmtMoney(balance)}`;
        } else {
          debtLabel = "Con deuda";
        }
        debtColor = "error";
        debtVariant = "filled";
      } else {
        // status raro → no inventamos nada; usamos balance si existe
        if (hasBalanceField && balance != null) {
          if (balance > 0) {
            debtLabel = `Debe ${fmtMoney(balance)}`;
            debtColor = "error";
            debtVariant = "filled";
          } else {
            debtLabel = "Al día";
            debtColor = "success";
            debtVariant = "filled";
          }
        } else {
          debtLabel = "Estado de deuda: sin datos";
          debtColor = "default";
          debtVariant = "outlined";
        }
      }
    }
    // 2) Sin status pero con balance interpretable
    else if (hasBalanceField && balance != null) {
      if (balance > 0) {
        debtLabel = `Debe ${fmtMoney(balance)}`;
        debtColor = "error";
        debtVariant = "filled";
      } else {
        debtLabel = "Al día";
        debtColor = "success";
        debtVariant = "filled";
      }
    }
    // 3) Hay __debt pero sin nada usable → seguimos diciendo "sin datos" (no inventamos "al día")
    else {
      debtLabel = "Estado de deuda: sin datos";
      debtColor = "default";
      debtVariant = "outlined";
    }
  }

  async function handleReprice() {
    if (!item?.idCliente) {
      showToast("Falta idCliente para recalcular.", "warning");
      return;
    }
    try {
      setRepriceLoading(true);
      const { data } = await repriceGroup(item.idCliente);
      if (data?.ok) {
        setLocalPatch((prev) => ({
          ...(prev || {}),
          cuotaIdeal: isNum(data?.cuotaIdeal)
            ? data.cuotaIdeal
            : prev?.cuotaIdeal ?? item?.cuotaIdeal,
          edadMaxPoliza: isNum(data?.edadMax)
            ? data.edadMax
            : prev?.edadMaxPoliza ?? item?.edadMaxPoliza,
        }));
      }
      showToast(
        data?.ok
          ? `Cuota ideal recalculada: ${
              isNum(data?.cuotaIdeal) ? fmtMoney(data.cuotaIdeal) : "—"
            }`
          : "Recálculo completado",
        data?.ok ? "success" : "info"
      );
      onRefresh?.();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo recalcular la cuota ideal";
      showToast(msg, "error");
    } finally {
      setRepriceLoading(false);
    }
  }

  /* -------------------------------- Header -------------------------------- */
  const Header = (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        {/* left: título + estados */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          minWidth={0}
          flexWrap="wrap"
        >
          <Tooltip title="Volver">
            <IconButton size="small" onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="h5" fontWeight={800} noWrap sx={{ mr: 1 }}>
            {loading ? <Skeleton width={220} /> : item?.nombre || "Cliente"}
          </Typography>

          {item?.activo ? (
            <Chip label="Activo" color="success" size="small" />
          ) : (
            <Chip label="Baja" size="small" />
          )}

          {item?.idCliente && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              icon={<AccountTreeRoundedIcon />}
              label={`Grupo #${item.idCliente} (${integrantesCount})`}
            />
          )}

          {item?.rol && (
            <Chip
              size="small"
              icon={<BadgeRoundedIcon />}
              label={item.rol}
              variant="outlined"
            />
          )}

          {item?.tipoFactura && item.tipoFactura !== "none" && (
            <Chip
              size="small"
              icon={<ReceiptLongRoundedIcon />}
              label={`Factura ${item.tipoFactura}`}
              variant="outlined"
            />
          )}
        </Stack>

        {/* right: Cuota VIGENTE + Estado deuda + Acciones */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          {/* Cuota vigente */}
          <Chip
            size="medium"
            color={usarIdeal ? "success" : "default"}
            icon={<PaidRoundedIcon />}
            label={
              vigente != null
                ? `Cuota vigente: ${fmtMoney(vigente)}`
                : "Cuota vigente: —"
            }
            sx={{
              fontWeight: 800,
              "& .MuiChip-label": { px: 1 },
              border: "1px solid",
              borderColor: "divider",
            }}
          />

          {/* Estado de deuda (solo chip, sin botón de cobrar) */}
          <Chip
            size="medium"
            color={debtColor}
            variant={debtVariant}
            label={debtLabel}
          />

          <Tooltip title="Editar ficha del cliente">
            <span>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
                disabled={loading || !item}
              >
                Editar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Subtira muy simple: modo de cobro + cobrador */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        mt={1}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          size="small"
          color={usarIdeal ? "success" : "default"}
          variant={usarIdeal ? "filled" : "outlined"}
          label={
            usarIdeal ? "Usando cuota ideal (reglas)" : "Usando cuota manual"
          }
        />
        <Chip
          size="small"
          icon={<PersonOutlineIcon />}
          label={`Cobrador: ${item?.idCobrador ?? "—"}`}
          variant="outlined"
        />
      </Stack>
    </Paper>
  );

  /* --------------------------- Resumen económico --------------------------- */
  const ResumenEconomicoCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          Resumen económico
        </Typography>

        <Tooltip title="Recalcular cuota ideal del grupo">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                repriceLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <ReplayRoundedIcon />
                )
              }
              onClick={handleReprice}
              disabled={loading || repriceLoading || !item?.idCliente}
            >
              Recalcular ideal
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Grid container spacing={1.5}>
        {/* Bloque principal de cuotas */}
        <Grid item xs={12}>
          <LabelValue
            label="Cuota vigente (se cobra hoy)"
            value={vigente != null ? fmtMoney(vigente) : "—"}
            bold
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <LabelValue
            label="Cuota manual (histórica)"
            value={cobrado != null ? fmtMoney(cobrado) : "—"}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <LabelValue
            label="Cuota ideal (reglas)"
            value={ideal != null ? fmtMoney(ideal) : "—"}
          />
        </Grid>

        {/* Desvío */}
        <Grid item xs={12}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <LabelValue
              label="Desvío vs ideal"
              value={
                desvAbs != null
                  ? `${desvAbs >= 0 ? "+" : ""}${fmtMoney(desvAbs)}${
                      desvPct != null ? ` (${desvPct.toFixed(1)}%)` : ""
                    }`
                  : "—"
              }
            />
            {desvAbs != null && (
              <Chip
                size="small"
                label={
                  desvAbs > 0
                    ? "Por encima del ideal"
                    : desvAbs < 0
                    ? "Por debajo del ideal"
                    : "Igual al ideal"
                }
                color={
                  desvAbs > 0 ? "success" : desvAbs < 0 ? "error" : "default"
                }
                variant="outlined"
              />
            )}
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        {/* Condiciones del plan */}
        <Grid item xs={6}>
          <LabelValue label="Integrantes del grupo" value={integrantesCount} />
        </Grid>
        <Grid item xs={6}>
          <LabelValue
            label="Edad máx. póliza"
            value={displayItem?.edadMaxPoliza ?? "—"}
          />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <BooleanBadge label="Cremación" value={!!item?.cremacion} />
            <BooleanBadge label="Parcela" value={!!item?.parcela} />
            {item?.emergencia && (
              <Chip size="small" label="Emergencia" color="warning" />
            )}
            {item?.tarjeta && (
              <Chip size="small" label="Tarjeta" color="info" />
            )}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  /* ------------------------------- Ficha titular --------------------------- */
  const FichaTitularCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <InfoOutlinedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Ficha del titular
        </Typography>
      </Stack>

      <Grid container spacing={1.5}>
        {/* Identificación básica */}
        <Grid item xs={6}>
          <LabelValue label="N° Cliente" value={item?.idCliente ?? "—"} bold />
        </Grid>
        <Grid item xs={6}>
          <LabelValue
            label="Titular del grupo"
            value={item?.nombreTitular ?? "—"}
          />
        </Grid>

        <Grid item xs={12}>
          <LabelValue label="Nombre" value={item?.nombre ?? "—"} />
        </Grid>

        {/* Contacto + documento */}
        <Grid item xs={6}>
          <LabelValue label="Teléfono" value={item?.telefono ?? "—"} />
        </Grid>
        <Grid item xs={6}>
          <LabelValue label="CUIL" value={item?.cuil ?? "—"} />
        </Grid>

        <Grid item xs={6}>
          <LabelValue label="Tipo doc." value={item?.docTipo ?? "—"} />
        </Grid>
        <Grid item xs={6}>
          <LabelValue label="Documento" value={item?.documento ?? "—"} />
        </Grid>

        <Grid item xs={6}>
          <LabelValue label="Sexo" value={item?.sexo ?? "—"} />
        </Grid>
        <Grid item xs={6}>
          <LabelValue label="Edad" value={item?.edad ?? "—"} />
        </Grid>

        {/* Domicilio */}
        <Grid item xs={12}>
          <LabelValue label="Domicilio" value={item?.domicilio ?? "—"} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Ciudad" value={item?.ciudad ?? "—"} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Provincia" value={item?.provincia ?? "—"} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="CP" value={item?.cp ?? "—"} />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        {/* Fechas clave */}
        <Grid item xs={4}>
          <LabelValue label="Ingreso" value={fmtDate(item?.ingreso)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Vigencia" value={fmtDate(item?.vigencia)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Baja" value={fmtDate(item?.baja)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="F. aumento" value={fmtDate(item?.fechaAumento)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="F. nacimiento" value={fmtDate(item?.fechaNac)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Actualizado" value={fmtDate(item?.updatedAt)} />
        </Grid>

        <Grid item xs={12}>
          <LabelValue
            label="Observaciones"
            value={item?.observaciones ?? "—"}
          />
        </Grid>
      </Grid>
    </Paper>
  );

  /* ------------------------------- Family card ----------------------------- */
  const FamilyCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        mb={1}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          Grupo familiar
        </Typography>
        <Button size="small" variant="contained" onClick={onAddIntegrante}>
          Agregar integrante
        </Button>
      </Stack>

      {loading && !family?.length ? (
        <Skeleton variant="rounded" height={140} />
      ) : family?.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell align="center">Cremación</TableCell>
              <TableCell align="center">Parcela</TableCell>
              <TableCell align="right">Edad</TableCell>
              <TableCell align="center">Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {family
              .slice()
              .sort((a, b) => (a?.nombre || "").localeCompare(b?.nombre || ""))
              .map((m) => (
                <TableRow key={m._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {m?.rol && (
                        <Chip size="small" label={m.rol} variant="outlined" />
                      )}
                      <span>{m?.nombre ?? "—"}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>{m?.documento ?? "—"}</TableCell>
                  <TableCell align="center">
                    <BooleanBadge small value={!!m?.cremacion} />
                  </TableCell>
                  <TableCell align="center">
                    <BooleanBadge small value={!!m?.parcela} />
                  </TableCell>
                  <TableCell align="right">
                    {isNum(m?.edad) ? m.edad : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {m?.activo ? (
                      <Chip size="small" label="Activo" color="success" />
                    ) : (
                      <Chip size="small" label="Baja" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      ) : (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="body2" color="text.secondary">
            Este grupo no tiene integrantes cargados.
          </Typography>
          <Button size="small" variant="contained" onClick={onAddIntegrante}>
            Agregar integrante
          </Button>
        </Stack>
      )}
    </Paper>
  );

  /* --------------------------------- Render -------------------------------- */
  return (
    <Box>
      {Header}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {ResumenEconomicoCard}
        </Grid>
        <Grid item xs={12} md={6}>
          {FichaTitularCard}
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          {FamilyCard}
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
