// src/components/ClienteOverviewSmart.jsx
import React, { useMemo } from "react";
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
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
}) {
  // Metrías de precio (SIN cuotaVigente)
  const cobrado = isNum(item?.cuota) ? item.cuota : null;
  const ideal = isNum(item?.cuotaIdeal) ? item.cuotaIdeal : null;
  const desvAbs = cobrado != null && ideal != null ? cobrado - ideal : null;
  const desvPct =
    ideal && ideal > 0 && desvAbs != null ? (desvAbs / ideal) * 100 : null;

  const integrantesCount = useMemo(() => {
    const base = Number(item?.grupoFamiliar) || 1;
    return Math.max(base, 1 + (Array.isArray(family) ? family.length : 0));
  }, [item, family]);

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
            <Chip size="small" label="Activo" color="success" />
          ) : (
            <Chip size="small" label="Baja" />
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

          {item?.idCliente && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              icon={<AccountTreeRoundedIcon />}
              label={`Grupo #${item.idCliente} (${integrantesCount})`}
            />
          )}
        </Stack>

        {/* right: acciones + importe destacado (CUOTA COBRADA) */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          <Chip
            size="medium"
            color="default"
            icon={<PaidRoundedIcon />}
            label={cobrado != null ? fmtMoney(cobrado) : "—"}
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

          <Tooltip title="Eliminar">
            <span>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={onDelete}
                disabled={loading || !item || removing}
              >
                Eliminar
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
        <Chip
          size="small"
          icon={<PersonOutlineIcon />}
          label={`Cobrador: ${item?.idCobrador ?? "—"}`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Edad máx.: ${item?.edadMaxPoliza ?? "—"}`}
          variant="outlined"
        />
        {/* Flags relevantes del nuevo modelo */}
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
        {/* Si seguís guardando pisada, la mostramos informativa (no calculamos “vigente”) */}
        {item?.usarCuotaPisada && (
          <Chip
            size="small"
            label={`Pisada: ${
              isNum(item?.cuotaPisada) ? fmtMoney(item.cuotaPisada) : "—"
            }`}
            color="secondary"
            variant="outlined"
          />
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
        {/* Informativo si hay pisada: NO usamos “vigente” en cálculos */}
        {item?.usarCuotaPisada ? (
          <Chip
            size="small"
            label="Pisada activa"
            color="secondary"
            variant="outlined"
          />
        ) : (
          <Chip size="small" label="Por reglas" variant="outlined" />
        )}
      </Stack>

      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <LabelValue
            label="Cuota cobrada"
            value={cobrado != null ? fmtMoney(cobrado) : "—"}
            bold
          />
        </Grid>
        <Grid item xs={6}>
          <LabelValue
            label="Cuota ideal"
            value={ideal != null ? fmtMoney(ideal) : "—"}
          />
        </Grid>

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
                  desvAbs > 0 ? "Sub-ideal" : desvAbs < 0 ? "Sobre-ideal" : "OK"
                }
                color={
                  desvAbs > 0 ? "error" : desvAbs < 0 ? "success" : "default"
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
            value={item?.edadMaxPoliza ?? "—"}
          />
        </Grid>
        <Grid item xs={4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BooleanBadge label="Cremación" value={!!item?.cremacion} />
            <BooleanBadge label="Parcela" value={!!item?.parcela} />
          </Stack>
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
    </Box>
  );
}
