// src/components/cliente-form/Familiares.jsx
import React from "react";
import {
  Typography,
  Divider,
  Stack,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
} from "@mui/material";

export default function Familiares({
  values,
  DOC_TIPOS,
  PROVINCIAS,
  SEXO_OPTS,
  pushIntegrante,
  updateIntegrante,
  removeIntegrante,
  toDateInput,
}) {
  return (
    <>
      <Typography variant="h6" fontWeight={700} mt={3} mb={1}>
        Familiares del grupo (opcional)
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {values.integrantes.map((m, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Integrante #{idx + 1}
              </Typography>
              <Button
                size="small"
                color="error"
                onClick={() => removeIntegrante(idx)}
              >
                Quitar
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  value={m.nombre}
                  onChange={(e) =>
                    updateIntegrante(idx, "nombre", e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Tipo doc."
                  value={m.docTipo || "DNI"}
                  onChange={(e) =>
                    updateIntegrante(idx, "docTipo", e.target.value)
                  }
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
                  value={m.documento || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "documento", e.target.value)
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  value={toDateInput(m.fechaNac)}
                  onChange={(e) =>
                    updateIntegrante(idx, "fechaNac", e.target.value)
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Edad (auto)"
                  type="number"
                  value={m.edad || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  helperText="Se calcula desde la fecha de nacimiento"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Sexo"
                  value={m.sexo || "X"}
                  onChange={(e) =>
                    updateIntegrante(idx, "sexo", e.target.value)
                  }
                  fullWidth
                >
                  {SEXO_OPTS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  label="Teléfono"
                  value={m.telefono || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "telefono", e.target.value)
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Domicilio"
                  value={m.domicilio || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "domicilio", e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Ciudad"
                  value={m.ciudad || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "ciudad", e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Provincia"
                  value={m.provincia || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "provincia", e.target.value)
                  }
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
                  value={m.cp || ""}
                  onChange={(e) => updateIntegrante(idx, "cp", e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={m.observaciones || ""}
                  onChange={(e) =>
                    updateIntegrante(idx, "observaciones", e.target.value)
                  }
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}

        <Button variant="brandYellow" onClick={pushIntegrante}>
          + Agregar familiar
        </Button>
        <Alert severity="info">
          Los familiares se crearán como registros independientes que{" "}
          <b>comparten el mismo N° de cliente</b>.
        </Alert>
      </Stack>
    </>
  );
}
