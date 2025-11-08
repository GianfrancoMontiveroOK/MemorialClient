// src/components/cliente-form/ProductoYPrecio.jsx
import React from "react";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  Tooltip,
  InputAdornment,
  FormControlLabel,
  Switch,
  Checkbox,
  MenuItem,
  Chip,
  Box,
  Stack,
} from "@mui/material";
import { useSettings } from "../../context/SettingsContext";

/* ===== Helpers ===== */
const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const calcAge = (dateStr) => {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return Math.max(a, 0);
};

const roundPolicy500 = (x) => {
  if (!Number.isFinite(x)) return 0;
  const mod = x % 500;
  const down = x - mod;
  const up = down + 500;
  return mod >= 250 ? up : down;
};

const groupFactorWith = (n, group) => {
  const m = Math.max(1, Number(n) || 1);
  const map = group?.minMap || {};
  if (m in map) return toNumber(map[m], 1);
  const neutral = toNumber(group?.neutralAt, 4);
  const step = toNumber(group?.step, 0.25);
  const delta = m - neutral;
  return 1 + delta * step;
};

const ageCoefWith = (edadMax, tiers) => {
  const e = Number(edadMax) || 0;
  const sorted = (tiers || [])
    .slice()
    .sort((a, b) => (b?.min ?? 0) - (a?.min ?? 0));
  const hit = sorted.find((t) => e >= (t?.min ?? 0));
  return toNumber(hit?.coef, 1);
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/* ===== Helpers de conteo local (solo “nuevo” o fallback) ===== */
const isPlaceholder = (m = {}) => {
  const nombre = String(m?.nombre ?? "").trim();
  const hasEdad =
    m?.edad !== "" && m?.edad != null && Number.isFinite(Number(m?.edad));
  const hasFecha = !!calcAge(m?.fechaNac);
  return !nombre && !hasEdad && !hasFecha;
};

function deriveGroupFromLocal(values) {
  // titular
  const titularEdad =
    values.edad !== "" && values.edad != null
      ? Number(values.edad)
      : calcAge(values.fechaNac);

  // integrantes válidos (no placeholders)
  const arr = Array.isArray(values.integrantes) ? values.integrantes : [];
  const integrantesOk = arr.filter((m) => !isPlaceholder(m));

  // conteos
  const integrantesCount = 1 + integrantesOk.length; // titular + integrantes
  const cremacionesCount =
    (values.cremacion ? 1 : 0) +
    integrantesOk.filter((m) => !!m.cremacion).length;

  // edad máx
  const edadesInt = integrantesOk.map((m) =>
    m.edad !== "" && m.edad != null ? Number(m.edad) : calcAge(m.fechaNac)
  );
  const all = [
    Number.isFinite(titularEdad) ? titularEdad : 0,
    ...edadesInt.map((n) => (Number.isFinite(n) ? n : 0)),
  ];
  const edadMax = all.length ? Math.max(...all) : 0;

  return { integrantesCount, cremacionesCount, edadMax };
}

/* ======= Componente ======= */
export default function ProductoYPrecio({
  values,
  onChange,
  TIPO_FACTURA,
  serverGroupInfo, // { integrantesCount, cremacionesCount, edadMax } cuando EDICIÓN
}) {
  const settings = useSettings();
  const priceRules = settings?.priceRules;

  // --- Resolver fuente de verdad para el grupo ---
  const hasServerInfo =
    serverGroupInfo &&
    (Number.isFinite(serverGroupInfo.integrantesCount) ||
      Number.isFinite(serverGroupInfo.cremacionesCount) ||
      Number.isFinite(serverGroupInfo.edadMax));

  const localDerived = React.useMemo(
    () => deriveGroupFromLocal(values),
    [values]
  );

  // Si hay serverGroupInfo (EDICIÓN) lo usamos; si no, usamos local (NUEVO / fallback)
  const integrantesCount = toNumber(
    hasServerInfo
      ? serverGroupInfo.integrantesCount
      : localDerived.integrantesCount,
    1
  );
  const cremacionesCount = toNumber(
    hasServerInfo
      ? serverGroupInfo.cremacionesCount
      : localDerived.cremacionesCount,
    values.cremacion ? 1 : 0
  );
  const edadMax = toNumber(
    hasServerInfo ? serverGroupInfo.edadMax : localDerived.edadMax,
    0
  );

  // Preview según priceRules (no persiste)
  const cuotaIdealPreview = React.useMemo(() => {
    if (!priceRules) return 0;
    const base = toNumber(priceRules.base, 16000);
    const gf = groupFactorWith(integrantesCount, priceRules.group);
    const af = ageCoefWith(edadMax, priceRules.age);
    const cremCoef = toNumber(priceRules.cremationCoef, 0.125);
    const cremCost = base * cremCoef * Math.max(0, cremacionesCount || 0);
    const subtotal = base * gf * af + cremCost;
    return roundPolicy500(subtotal);
  }, [priceRules, integrantesCount, edadMax, cremacionesCount]);

  const usarCuotaIdeal = Boolean(values.usarCuotaIdeal);
  const cuotaHistorica = Number(values.cuota ?? 0);
  const cuotaPisada = Number(values.cuotaPisada ?? values.cuota ?? 0);
  const cuotaDefaultCobro = usarCuotaIdeal ? cuotaIdealPreview : cuotaPisada;

  const facturaOpts =
    Array.isArray(TIPO_FACTURA) && TIPO_FACTURA.length
      ? TIPO_FACTURA
      : ["A", "B", "C", "none"];

  return (
    <>
      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Precio & Cobranzas
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Resumen de grupo */}
      <Box
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: "action.hover",
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Chip color="primary" label={`Integrantes: ${integrantesCount}`} />
        <Chip color="secondary" label={`Con cremación: ${cremacionesCount}`} />
        <Chip color="warning" label={`Edad máx.: ${edadMax || 0}`} />
        {!hasServerInfo && (
          <Chip
            variant="outlined"
            label="(conteo local)"
            sx={{ ml: 0.5 }}
            size="small"
          />
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Política de cobro */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={usarCuotaIdeal}
                onChange={onChange("usarCuotaIdeal")}
              />
            }
            label="Cobrar por defecto la cuota ideal"
          />
        </Grid>

        {/* Monto por defecto para Cobro (lectura) */}
        <Grid item xs={12} md={4}>
          <Tooltip title="Es el monto que verá el cobrador por defecto al cobrar">
            <TextField
              label="Monto por defecto para COBRO"
              value={money.format(cuotaDefaultCobro)}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText={
                usarCuotaIdeal
                  ? "Usando cuota ideal (precio teórico actual)"
                  : "Usando cuota histórica/pisada (monto estable)"
              }
            />
          </Tooltip>
        </Grid>

        {/* Vista de la cuota ideal */}
        <Grid item xs={12} md={4}>
          <Tooltip title="Calculada según reglas (Settings → Pricing) y redondeada por 500">
            <TextField
              label="Cuota ideal (auto)"
              value={money.format(cuotaIdealPreview)}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="No editable; vista previa en vivo"
            />
          </Tooltip>
        </Grid>

        {/* Diferencia vs. histórica (informativa) */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", alignItems: "center" }}
        >
          {cuotaHistorica > 0 && (
            <Chip
              label={`Δ vs. histórica: ${money.format(
                cuotaIdealPreview - cuotaHistorica
              )}`}
              size= "small"
              variant="outlined"
            />
          )}
        </Grid>

        {/* Si NO cobramos por ideal, permitimos editar la histórica */}
        {!usarCuotaIdeal && (
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <TextField
                label="Cuota histórica (editable)"
                type="number"
                value={values.cuota ?? ""}
                onChange={onChange("cuota")}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText="Este valor no cambia con las reglas; lo ajustás vos"
              />
            </Stack>
          </Grid>
        )}

        {/* ===== Flags y cobranzas ===== */}
        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.parcela)}
                onChange={onChange("parcela")}
              />
            }
            label="Parcela"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.cremacion)}
                onChange={onChange("cremacion")}
              />
            }
            label="Cremación (titular)"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.factura)}
                onChange={onChange("factura")}
              />
            }
            label="Emite factura"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Tipo de factura"
            value={values.tipoFactura || "none"}
            onChange={onChange("tipoFactura")}
            fullWidth
            helperText="A, B, C o none"
          >
            {(Array.isArray(TIPO_FACTURA) && TIPO_FACTURA.length
              ? TIPO_FACTURA
              : ["A", "B", "C", "none"]
            ).map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            label="Cobrador (ID)"
            type="number"
            value={values.idCobrador ?? ""}
            onChange={onChange("idCobrador")}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Observaciones"
            value={values.observaciones || ""}
            onChange={onChange("observaciones")}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
      </Grid>
    </>
  );
}
