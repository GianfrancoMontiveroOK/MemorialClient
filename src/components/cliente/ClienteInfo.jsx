// src/components/ClienteInfo.jsx
import React from "react";
import {
  Grid,
  Box,
  Typography,
  Skeleton,
  Stack,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import { LabelValue, BooleanBadge, fmtDate, fmtMoney } from "../ui";

/* Helpers */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const getCuotaVigente = (it = {}) => {
  if (isNum(it.cuotaVigente)) return it.cuotaVigente;
  if (it.usarCuotaPisada && isNum(it.cuotaPisada))
    return Number(it.cuotaPisada);
  if (isNum(it.cuotaIdeal)) return Number(it.cuotaIdeal);
  if (isNum(it.cuota)) return Number(it.cuota);
  return 0;
};

export default function ClienteInfo({ item, skeleton }) {
  // Modelo nuevo: sin "plan"; ahora hay banderas booleanas (cremacion, parcela)
  const cuota = isNum(item?.cuota) ? Number(item.cuota) : null; // histórico
  const ideal = isNum(item?.cuotaIdeal) ? Number(item.cuotaIdeal) : null;
  const vigente = getCuotaVigente(item);

  const desvioAbs = isNum(cuota) && isNum(ideal) ? cuota - ideal : null;
  const desvioPct =
    isNum(ideal) && ideal > 0 && isNum(desvioAbs)
      ? (desvioAbs / ideal) * 100
      : null;

  return (
    <Grid container spacing={3}>
      {/* Identificación */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Identificación
          </Typography>
          {skeleton ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LabelValue
                  label="N° Cliente"
                  value={item?.idCliente ?? "—"}
                  bold
                />
              </Grid>
              <Grid item xs={6}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {/* Badges de cobertura actuales */}
                  {item?.cremacion ? (
                    <Chip
                      size="small"
                      color="warning"
                      icon={<LocalFireDepartmentOutlinedIcon />}
                      label="Cremación"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      size="small"
                      label="Sin cremación"
                      variant="outlined"
                    />
                  )}
                  {item?.parcela ? (
                    <Chip
                      size="small"
                      color="success"
                      icon={<ParkOutlinedIcon />}
                      label="Parcela"
                      variant="outlined"
                    />
                  ) : (
                    <Chip size="small" label="Sin parcela" variant="outlined" />
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <LabelValue label="Nombre" value={item?.nombre ?? "—"} />
              </Grid>

              {!!item?.nombreTitular && item?.rol !== "TITULAR" && (
                <Grid item xs={12}>
                  <LabelValue
                    label="Titular del grupo"
                    value={item?.nombreTitular}
                  />
                </Grid>
              )}

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
          )}
        </Box>
      </Grid>

      {/* Contacto & Documento */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Contacto & Documento
          </Typography>
          {skeleton ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <Grid container spacing={2}>
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
          )}
        </Box>
      </Grid>

      {/* Precio & Parámetros de cálculo */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Precio & Parámetros
          </Typography>
          {skeleton ? (
            <Skeleton variant="rounded" height={160} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LabelValue
                  label="Cuota cobrada"
                  value={fmtMoney(item?.cuota)}
                  bold
                />
              </Grid>
              <Grid item xs={6}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <LabelValue
                    label="Cuota vigente"
                    value={isNum(vigente) ? fmtMoney(vigente) : "—"}
                    bold
                  />
                  <Tooltip title="Si hay cuota pisada, la vigente respeta ese valor.">
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        item?.usarCuotaPisada && isNum(item?.cuotaPisada)
                          ? "Pisada activa"
                          : "Por reglas"
                      }
                    />
                  </Tooltip>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
              </Grid>

              <Grid item xs={6}>
                <LabelValue
                  label="Cuota ideal"
                  value={isNum(ideal) ? fmtMoney(ideal) : "—"}
                />
              </Grid>
              <Grid item xs={6}>
                {isNum(desvioAbs) ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Desvío ${desvioAbs >= 0 ? "+" : ""}${fmtMoney(
                      desvioAbs
                    )}${isNum(desvioPct) ? ` (${desvioPct.toFixed(1)}%)` : ""}`}
                    color={
                      desvioAbs > 0
                        ? "error"
                        : desvioAbs < 0
                        ? "success"
                        : "default"
                    }
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Grid>

              {/* Parámetros con los que se calcula (si vienen) */}
              <Grid item xs={4}>
                <LabelValue
                  label="Grupo familiar"
                  value={item?.grupoFamiliar ?? "—"}
                />
              </Grid>
              <Grid item xs={4}>
                <LabelValue
                  label="Cremaciones (grupo)"
                  value={item?.cremaciones ?? "—"}
                />
              </Grid>
              <Grid item xs={4}>
                <LabelValue
                  label="Edad máx. póliza"
                  value={item?.edadMaxPoliza ?? "—"}
                />
              </Grid>

              {/* Flags */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <BooleanBadge label="Cremación" value={!!item?.cremacion} />
                  <BooleanBadge label="Parcela" value={!!item?.parcela} />
                  <BooleanBadge label="Emergencia" value={!!item?.emergencia} />
                  <BooleanBadge label="Tarjeta" value={!!item?.tarjeta} />
                  <BooleanBadge label="Factura" value={!!item?.factura} />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <LabelValue
                  label="Cobrador (ID)"
                  value={item?.idCobrador ?? "—"}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Grid>

      {/* Fechas */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Fechas
          </Typography>
          {skeleton ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LabelValue label="Ingreso" value={fmtDate(item?.ingreso)} />
              </Grid>
              <Grid item xs={6}>
                <LabelValue label="Vigencia" value={fmtDate(item?.vigencia)} />
              </Grid>
              <Grid item xs={6}>
                <LabelValue label="Baja" value={fmtDate(item?.baja)} />
              </Grid>
              <Grid item xs={6}>
                <LabelValue
                  label="Fecha aumento"
                  value={fmtDate(item?.fechaAumento)}
                />
              </Grid>
              <Grid item xs={6}>
                <LabelValue
                  label="Fecha nacimiento"
                  value={fmtDate(item?.fechaNac)}
                />
              </Grid>
              <Grid item xs={6}>
                <LabelValue
                  label="Actualizado"
                  value={fmtDate(item?.updatedAt)}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Grid>

      {/* Observaciones */}
      <Grid item xs={12}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notas
          </Typography>
          {skeleton ? (
            <Skeleton variant="rounded" height={80} />
          ) : (
            <LabelValue
              label="Observaciones"
              value={item?.observaciones ?? "—"}
            />
          )}
        </Box>
      </Grid>
    </Grid>
  );
}
