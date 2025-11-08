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
        "success"
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
            <Chip label="Activo" color="success" />
          ) : (
            <Chip label="Baja" />
          )}

          {item?.rol && (
            <Chip
              icon={<BadgeRoundedIcon />}
              label={item.rol}
              variant="contained"
              color="primary"
            />
          )}

          {item?.tipoFactura && item.tipoFactura !== "none" && (
            <Chip
              icon={<ReceiptLongRoundedIcon />}
              label={`Factura ${item.tipoFactura}`}
              variant="outlined"
            />
          )}

          {item?.idCliente && (
            <Chip
              color="primary"
              variant="outlined"
              icon={<AccountTreeRoundedIcon />}
              label={`Grupo #${item.idCliente} (${integrantesCount})`}
            />
          )}
        </Stack>

        {/* right: Cuota VIGENTE + Acciones */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
        >
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

          <Tooltip title="Editar">
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
    </Paper>
  );

  /* ------------------------------ Summary strip ---------------------------- */
  const Summary = (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        mb: 2,
        bgcolor: (t) =>
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
      }}
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {/* Modo de cobro claro */}
        <Chip
          size="small"
          color={usarIdeal ? "success" : "default"}
          variant={usarIdeal ? "filled" : "outlined"}
          label={
            usarIdeal ? "USANDO IDEAL (reglas)" : "USANDO HISTÓRICA (manual)"
          }
        />
        <Chip
          size="small"
          icon={<PersonOutlineIcon />}
          label={`Cobrador: ${item?.idCobrador ?? "—"}`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Edad máx.: ${displayItem?.edadMaxPoliza ?? "—"}`}
          variant="outlined"
        />
        {item?.cremacion && (
          <Chip
            size="small"
            icon={<LocalFireDepartmentOutlinedIcon />}
            label="Cremación"
            color="warning"
            variant="outlined"
          />
        )}
        {item?.parcela && (
          <Chip
            size="small"
            icon={<ParkOutlinedIcon />}
            label="Parcela"
            color="success"
            variant="outlined"
          />
        )}
        {item?.emergencia && (
          <Chip
            size="small"
            label="Emergencia"
            color="warning"
            variant="outlined"
          />
        )}
        {item?.tarjeta && (
          <Chip size="small" label="Tarjeta" color="info" variant="outlined" />
        )}
      </Stack>
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
              <TableCell align="right">Acciones</TableCell>
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
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button
                        size="small"
                        onClick={() => onViewMember?.(m._id)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onEditMember?.(m._id)}
                      >
                        Editar
                      </Button>
                    </Stack>
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

  /* ------------------------------- Pricing card ---------------------------- */
  const PricingCard = (
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
          Precio
        </Typography>

        {/* Modo de cobro (administrativo) */}
        <Chip
          size="small"
          color={usarIdeal ? "success" : "default"}
          variant={usarIdeal ? "filled" : "outlined"}
          label={
            usarIdeal ? "USANDO IDEAL (reglas)" : "USANDO HISTÓRICA (manual)"
          }
        />
      </Stack>

      <Grid container spacing={1.5}>
        {/* Vigente al frente */}
        <Grid item xs={12}>
          <LabelValue
            label="Cuota vigente (aplicada)"
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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <LabelValue
              label="Cuota ideal (reglas)"
              value={ideal != null ? fmtMoney(ideal) : "—"}
            />
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
                  Recalcular
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Grid>

        {/* Traza simple */}
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

        <Grid item xs={4}>
          <LabelValue label="Integrantes" value={integrantesCount} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue
            label="Edad máx. póliza"
            value={displayItem?.edadMaxPoliza ?? "—"}
          />
        </Grid>
        <Grid item xs={4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BooleanBadge label="Cremación" value={!!item?.cremacion} />
            <BooleanBadge label="Parcela" value={!!item?.parcela} />
          </Stack>
        </Grid>

        {/* Fechas útiles para auditoría */}
        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Vigencia" value={fmtDate(item?.vigencia)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="F. aumento" value={fmtDate(item?.fechaAumento)} />
        </Grid>
        <Grid item xs={4}>
          <LabelValue label="Actualizado" value={fmtDate(item?.updatedAt)} />
        </Grid>
      </Grid>
    </Paper>
  );

  /* --------------------------- Info compact cards -------------------------- */
  const IdentificacionCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <InfoOutlinedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Identificación
        </Typography>
      </Stack>
      <Grid container spacing={1.5}>
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
      </Grid>
    </Paper>
  );

  const ContactoCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <BadgeRoundedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Contacto & Documento
        </Typography>
      </Stack>
      <Grid container spacing={1.5}>
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
      </Grid>
    </Paper>
  );

  const FechasNotasCard = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <EventNoteRoundedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Fechas & Notas
        </Typography>
      </Stack>
      <Grid container spacing={1.5}>
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

  /* --------------------------------- Render -------------------------------- */
  return (
    <Box>
      {Header}
      {Summary}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          {FamilyCard}
        </Grid>
        <Grid item xs={12} md={5}>
          {PricingCard}
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          {IdentificacionCard}
        </Grid>
        <Grid item xs={12} md={6}>
          {ContactoCard}
        </Grid>
        <Grid item xs={12}>
          {FechasNotasCard}
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
