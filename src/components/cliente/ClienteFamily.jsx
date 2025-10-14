// src/components/ClienteFamily.jsx
import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Skeleton,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Tooltip,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { fmtMoney } from "../ui";

/* Small helpers */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const dash = (v) => v ?? "—";

/* Safer cuota vigente fallback (si el backend no la trae ya calculada) */
const getCuotaVigente = (it = {}) => {
  if (isNum(it.cuotaVigente)) return it.cuotaVigente;
  if (it.usarCuotaPisada && isNum(it.cuotaPisada))
    return Number(it.cuotaPisada);
  if (isNum(it.cuotaIdeal)) return Number(it.cuotaIdeal);
  if (isNum(it.cuota)) return Number(it.cuota);
  return 0;
};

export default function ClienteFamily({
  item, // opcional
  titular,
  integrantes,
  famLoading,
  onAddIntegrante,
  onView,
  onEdit,
}) {
  const onViewSafe = onView || (() => {});
  const onEditSafe = onEdit || (() => {});
  const fam = Array.isArray(integrantes) ? integrantes : [];

  // Métricas del grupo
  const edades = [
    ...(isNum(titular?.edad) ? [titular.edad] : []),
    ...fam.map((m) => (isNum(m?.edad) ? m.edad : null)).filter(isNum),
  ];
  const edadMax = edades.length ? Math.max(...edades) : null;

  const groupSize =
    isNum(titular?.grupoFamiliar) && titular.grupoFamiliar > 0
      ? titular.grupoFamiliar
      : (titular ? 1 : 0) + fam.length;

  // Con el modelo nuevo, cremación es boolean por persona.
  const cremCount = isNum(titular?.cremaciones)
    ? titular.cremaciones // si viene contado a nivel grupo, priorizamos
    : (titular?.cremacion ? 1 : 0) +
      fam.reduce((a, m) => a + (m?.cremacion ? 1 : 0), 0);

  // Pricing (titular)
  const cuota = isNum(titular?.cuota) ? Number(titular.cuota) : null; // histórico
  const ideal = isNum(titular?.cuotaIdeal) ? Number(titular.cuotaIdeal) : null;
  const vigente = titular ? getCuotaVigente(titular) : null;

  const showDev = isNum(cuota) && isNum(ideal);
  const desvio = showDev ? cuota - ideal : null; // + => se cobra menos que ideal

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
        gap={1}
        flexWrap="wrap"
      >
        <Typography variant="subtitle1" fontWeight={800}>
          Grupo familiar
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={onAddIntegrante}
          disableElevation
        >
          Agregar integrante
        </Button>
      </Stack>

      {/* Titular card */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 1.5,
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
        }}
      >
        {famLoading && !titular && !fam.length ? (
          <Skeleton variant="rounded" height={68} />
        ) : titular ? (
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            {/* left */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                icon={<PersonOutlineIcon />}
                label="Titular"
                color="secondary"
                variant="filled"
              />
              <Typography variant="body1" fontWeight={800}>
                {dash(titular?.nombre)}
              </Typography>
              <Chip
                size="small"
                icon={<BadgeOutlinedIcon />}
                label={`DNI: ${dash(titular?.documento)}`}
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<CalendarMonthOutlinedIcon />}
                label={`Edad: ${isNum(titular?.edad) ? titular.edad : "—"}`}
                variant="outlined"
              />
              {titular?.cremacion ? (
                <Chip
                  size="small"
                  color="warning"
                  icon={<LocalFireDepartmentOutlinedIcon />}
                  label="Cremación"
                  variant="outlined"
                />
              ) : null}
              {titular?.parcela ? (
                <Chip
                  size="small"
                  color="success"
                  icon={<ParkOutlinedIcon />}
                  label="Parcela"
                  variant="outlined"
                />
              ) : null}

              {/* Metrics */}
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
              <Typography variant="body2" fontWeight={700}>
                Cobrado: {isNum(cuota) ? fmtMoney(cuota) : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ideal: {isNum(ideal) ? fmtMoney(ideal) : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vigente: {isNum(vigente) ? fmtMoney(vigente) : "—"}
              </Typography>
              {showDev ? (
                <Chip
                  size="small"
                  label={`Desvío ${desvio >= 0 ? "+" : ""}${fmtMoney(
                    Math.abs(desvio)
                  )}`}
                  color={
                    desvio > 0 ? "error" : desvio < 0 ? "success" : "default"
                  }
                  variant="outlined"
                />
              ) : null}

              {/* Group quick facts */}
              {groupSize || cremCount || edadMax ? (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
                  <Tooltip title="Miembros totales del grupo">
                    <Chip size="small" label={`GF: ${groupSize || "—"}`} />
                  </Tooltip>
                  <Tooltip title="Cantidad de integrantes con cremación">
                    <Chip
                      size="small"
                      icon={<LocalFireDepartmentOutlinedIcon />}
                      label={cremCount || 0}
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title="Edad máxima en póliza">
                    <Chip
                      size="small"
                      label={`Edad máx.: ${edadMax ?? "—"}`}
                      variant="outlined"
                    />
                  </Tooltip>
                </>
              ) : null}
            </Stack>

            {/* right */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => onViewSafe(titular._id)}
              >
                Ver titular
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => onEditSafe(titular._id)}
              >
                Editar titular
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Sin titular identificado.</Typography>
        )}
      </Paper>

      {/* Integrantes table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {famLoading && !fam.length ? (
          <Skeleton variant="rounded" height={160} />
        ) : fam.length ? (
          <TableContainer>
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
                {fam
                  .slice()
                  .sort((a, b) =>
                    (a?.nombre || "").localeCompare(b?.nombre || "")
                  )
                  .map((m) => (
                    <TableRow key={m._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {m?.rol ? (
                            <Chip
                              size="small"
                              label={m.rol}
                              variant="outlined"
                            />
                          ) : null}
                          <span>{dash(m?.nombre)}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>{dash(m?.documento)}</TableCell>
                      <TableCell align="center">
                        {m?.cremacion ? (
                          <Chip
                            size="small"
                            icon={<LocalFireDepartmentOutlinedIcon />}
                            label="Sí"
                            color="warning"
                            variant="outlined"
                          />
                        ) : (
                          <Chip size="small" label="No" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {m?.parcela ? (
                          <Chip
                            size="small"
                            icon={<ParkOutlinedIcon />}
                            label="Sí"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip size="small" label="No" variant="outlined" />
                        )}
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
                          justifyContent="flex-end"
                          spacing={1}
                        >
                          <Button
                            size="small"
                            startIcon={<VisibilityOutlinedIcon />}
                            onClick={() => onViewSafe(m._id)}
                          >
                            Ver
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => onEditSafe(m._id)}
                          >
                            Editar
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="body2" color="text.secondary">
                Este grupo no tiene integrantes cargados.
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={onAddIntegrante}
              >
                Agregar integrante
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
