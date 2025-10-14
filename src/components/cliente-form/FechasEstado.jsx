// src/components/cliente-form/FechasEstado.jsx
import React from "react";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

export default function FechasEstado({ values, onChange }) {
  return (
    <>
      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Fechas
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Ingreso"
            type="date"
            value={values.ingreso}
            onChange={onChange("ingreso")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Vigencia"
            type="date"
            value={values.vigencia}
            onChange={onChange("vigencia")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Baja"
            type="date"
            value={values.baja}
            onChange={onChange("baja")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Fecha aumento"
            type="date"
            value={values.fechaAumento}
            onChange={onChange("fechaAumento")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Estado & Preferencias
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox checked={values.activo} onChange={onChange("activo")} />
            }
            label="Activo"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.emergencia}
                onChange={onChange("emergencia")}
              />
            }
            label="Emergencia"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.tarjeta}
                onChange={onChange("tarjeta")}
              />
            }
            label="Tarjeta"
          />
        </Grid>
      </Grid>
    </>
  );
}
