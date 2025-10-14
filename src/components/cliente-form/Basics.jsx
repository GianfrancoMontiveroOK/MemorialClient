// src/components/cliente-form/Basics.jsx
import React from "react";
import {
  Typography,
  Divider,
  Grid,
  TextField,
  MenuItem,
  Alert,
} from "@mui/material";

export default function Basics({
  isEdit,
  values,
  onChange,
  DOC_TIPOS,
  PROVINCIAS,
  SEXO_OPTS,
}) {
  return (
    <>
      <Typography variant="h6" fontWeight={700} mt={1} mb={1}>
        Identificación
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        {isEdit && (
          <Grid item xs={12} md={3}>
            <TextField
              label="N° Cliente"
              value={values.idCliente}
              onChange={onChange("idCliente")}
              type="number"
              fullWidth
              required
              helperText="ID interno del sistema (numérico)"
            />
          </Grid>
        )}

        <Grid item xs={12} md={isEdit ? 5 : 6}>
          <TextField
            label="Nombre"
            value={values.nombre}
            onChange={onChange("nombre")}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} md={isEdit ? 4 : 6}>
          <TextField
            label="Domicilio"
            value={values.domicilio}
            onChange={onChange("domicilio")}
            fullWidth
          />
        </Grid>

        {!isEdit && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 1 }}>
              El N° de cliente se asignará automáticamente al crear el registro.
            </Alert>
          </Grid>
        )}
      </Grid>

      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Contacto
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            label="Ciudad"
            value={values.ciudad}
            onChange={onChange("ciudad")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Provincia"
            value={
              values.provincia && values.provincia.trim()
                ? values.provincia
                : "Mendoza"
            }
            onChange={onChange("provincia")}
            fullWidth
          >
            {PROVINCIAS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="CP"
            value={values.cp}
            onChange={onChange("cp")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Teléfono"
            value={values.telefono}
            onChange={onChange("telefono")}
            fullWidth
            placeholder="+54 9 ..."
          />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Documento
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Tipo doc."
            value={values.docTipo}
            onChange={onChange("docTipo")}
            fullWidth
          >
            {DOC_TIPOS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Documento"
            value={values.documento}
            onChange={onChange("documento")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Fecha de nacimiento"
            type="date"
            value={values.fechaNac}
            onChange={onChange("fechaNac")}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Edad (auto)"
            type="number"
            value={values.edad}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText="Se calcula desde la fecha de nacimiento"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="CUIL"
            value={values.cuil}
            onChange={onChange("cuil")}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Sexo"
            value={values.sexo || "X"}
            onChange={onChange("sexo")}
            fullWidth
          >
            {SEXO_OPTS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </>
  );
}
