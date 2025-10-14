// src/components/cliente-form/PlanPrecio.jsx
import React from "react";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  Tooltip,
  InputAdornment,
  Stack,
  Switch,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from "@mui/material";

export default function PlanPrecio({
  values,
  onChange,
  cuotaPreview,
  cremVsGrupoError,
  overrideCuota,
  setOverrideCuota,
  TIPO_FACTURA,
}) {
  return (
    <>
      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Plan & Precio
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Grupo familiar"
            type="number"
            value={values.grupoFamiliar}
            onChange={onChange("grupoFamiliar")}
            fullWidth
            inputProps={{ min: 1 }}
            helperText="Cantidad total de integrantes"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Cremaciones"
            type="number"
            value={values.cremaciones}
            onChange={onChange("cremaciones")}
            fullWidth
            inputProps={{ min: 0 }}
            helperText="Integrantes con cremación"
            error={cremVsGrupoError}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Tooltip title="Mayor edad entre titular e integrantes">
            <TextField
              label="Edad máx. póliza (auto)"
              type="number"
              value={values.edadMaxPoliza}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="Auto según mayor edad del grupo"
            />
          </Tooltip>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Cuota (auto)"
            value={cuotaPreview}
            fullWidth
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            helperText="Calculada automáticamente según reglas"
          />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={overrideCuota}
                  onChange={(e) => setOverrideCuota(e.target.checked)}
                />
              }
              label="Sobrescribir cuota manualmente"
            />
            <TextField
              label="Cuota (manual)"
              type="number"
              value={values.cuota}
              onChange={onChange("cuota")}
              fullWidth
              disabled={!overrideCuota}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            label="Plan"
            value={values.plan}
            onChange={onChange("plan")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values.parcela)}
                onChange={onChange("parcela")}
              />
            }
            label="Parcela asignada"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Cobrador (ID)"
            type="number"
            value={values.idCobrador}
            onChange={onChange("idCobrador")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Checkbox
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
            value={values.tipoFactura || "C"}
            onChange={onChange("tipoFactura")}
            fullWidth
            helperText="A, B o C"
          >
            {TIPO_FACTURA.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Observaciones"
            value={values.observaciones}
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
