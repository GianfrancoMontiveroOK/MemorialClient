// src/components/cliente-form/Familiares.jsx
import React, { useEffect, useMemo } from "react";
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
  Switch,
  FormControlLabel,
} from "@mui/material";

/* ===== Helpers compactos (mismos criterios que Basics) ===== */
const onlyDigits = (s = "") => String(s).replace(/\D+/g, "");
const upperTrim = (s = "") => String(s).trim().toUpperCase();
const toDateInput = (d) => {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
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
const normalizePhone = (s = "") => {
  const d = onlyDigits(s);
  if (!d) return "";
  if (d.startsWith("54")) return `+${d.replace(/^54/, "54 9 ")}`;
  return `+${d}`;
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const isValidDate = (v) => {
  if (!v) return false;
  const t = new Date(String(v)).getTime();
  return !Number.isNaN(t);
};

export default function Familiares({
  isEdit, // nuevo vs edición
  values,
  DOC_TIPOS,
  PROVINCIAS,
  SEXO_OPTS,
  pushIntegrante,
  updateIntegrante,
  removeIntegrante,
  onSummaryChange, // usado solo en "nuevo" para Pricing
}) {
  // ===== Meta local de grupo (para Precio en "nuevo") =====
  const integrantes = Array.isArray(values?.integrantes)
    ? values.integrantes
    : [];

  const integrantesCount = 1 + integrantes.length; // titular + familiares
  const cremacionesCount =
    (values?.cremacion ? 1 : 0) +
    integrantes.filter((m) => !!m?.cremacion).length;

  const edades = useMemo(() => {
    const titularEdad =
      values?.edad !== "" && values?.edad != null
        ? Number(values.edad)
        : calcAge(values?.fechaNac);
    const famEdades = integrantes.map((m) =>
      m?.edad !== "" && m?.edad != null ? Number(m.edad) : calcAge(m?.fechaNac)
    );
    return [titularEdad, ...famEdades].filter((n) => Number.isFinite(n));
  }, [values?.edad, values?.fechaNac, integrantes]);

  const edadMax = edades.length ? Math.max(...edades) : 0;

  useEffect(() => {
    if (!isEdit) {
      onSummaryChange?.({ integrantesCount, cremacionesCount, edadMax });
    }
  }, [isEdit, onSummaryChange, integrantesCount, cremacionesCount, edadMax]);

  // Normalizadores onBlur por integrante
  const blur = (idx, field, v) => updateIntegrante(idx, field, v);
  const onBlurNombre = (idx, v) => blur(idx, "nombre", upperTrim(v));
  const onBlurDocumento = (idx, v, docTipo) =>
    blur(
      idx,
      "documento",
      ["DNI", "CUIT", "CUIL"].includes(docTipo)
        ? onlyDigits(v)
        : String(v).trim()
    );
  const onBlurTelefono = (idx, v) => blur(idx, "telefono", normalizePhone(v));
  const onBlurCiudad = (idx, v) => blur(idx, "ciudad", upperTrim(v));
  const onBlurDomicilio = (idx, v) => blur(idx, "domicilio", upperTrim(v));
  const onBlurProvincia = (idx, v) =>
    blur(idx, "provincia", v?.trim() ? v : "Mendoza");

  const isInactiveMember = (m) => m?.activo === false || isValidDate(m?.baja);
  const isMemberActive = (m) => !isInactiveMember(m);

  const toggleActivo = (idx, checked) => {
    // checked === true => activo
    if (checked) {
      updateIntegrante(idx, "activo", true);
      updateIntegrante(idx, "baja", null);
    } else {
      updateIntegrante(idx, "activo", false);
      // si ya tenía baja, la respetamos, si no, hoy
      updateIntegrante(
        idx,
        "baja",
        toDateInput(integrantes[idx]?.baja) || todayISO()
      );
    }
  };

  // ✅ Validación mínima por integrante activo: nombre + fechaNac
  const memberRequired = useMemo(() => {
    const byIdx = integrantes.map((m) => {
      const active = isMemberActive(m);

      const nombreOk = String(m?.nombre || "").trim().length > 0;
      const fechaOk = isValidDate(m?.fechaNac);

      const missingNombre = active && !nombreOk;
      const missingFecha = active && !fechaOk;

      return { active, missingNombre, missingFecha };
    });

    const hasErrors = byIdx.some((r) => r.missingNombre || r.missingFecha);

    // para mostrar un resumen más claro
    const errItems = byIdx
      .map((r, idx) => {
        if (!r.active) return null;
        const miss = [];
        if (r.missingNombre) miss.push("Nombre");
        if (r.missingFecha) miss.push("Fecha nac.");
        return miss.length
          ? `Integrante #${idx + 1}: ${miss.join(" y ")}`
          : null;
      })
      .filter(Boolean);

    return { byIdx, hasErrors, errItems };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrantes]);

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Typography variant="h6" fontWeight={700}>
          Integrantes del grupo (opcional)
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {memberRequired.hasErrors ? (
          <Alert severity="error">
            Hay integrantes <b>activos</b> incompletos. Mínimo obligatorio:
            <b> Nombre</b> y <b>Fecha de nacimiento</b>.
            {memberRequired.errItems.length ? (
              <>
                <br />
                {memberRequired.errItems.join(" · ")}
              </>
            ) : null}
          </Alert>
        ) : null}

        {integrantes.map((m, idx) => {
          const key = m._id || m._tempId || idx;
          const active = isMemberActive(m);

          const req = memberRequired.byIdx[idx] || {
            active,
            missingNombre: false,
            missingFecha: false,
          };

          return (
            <Paper
              key={key}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                opacity: active ? 1 : 0.65,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Integrante #{idx + 1}
                  </Typography>

                  {/* ✅ Switch Activo / Baja */}
                  <FormControlLabel
                    sx={{ ml: 0 }}
                    control={
                      <Switch
                        checked={active}
                        onChange={(e) => toggleActivo(idx, e.target.checked)}
                      />
                    }
                    label={active ? "Activo" : "Baja"}
                  />
                </Stack>

                {active && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      updateIntegrante(idx, "activo", false);
                      updateIntegrante(idx, "baja", todayISO());
                    }}
                  >
                    Dar de baja
                  </Button>
                )}
              </Stack>

              <Grid container spacing={2} justifyContent="center">
                {/* Identificación */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre *"
                    value={m.nombre || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "nombre", e.target.value)
                    }
                    onBlur={(e) => onBlurNombre(idx, e.target.value)}
                    fullWidth
                    disabled={!active}
                    error={req.missingNombre}
                    helperText={req.missingNombre ? "Obligatorio" : " "}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    select
                    label="Tipo doc."
                    value={m.docTipo || "DNI"}
                    onChange={(e) =>
                      updateIntegrante(idx, "docTipo", e.target.value)
                    }
                    fullWidth
                    disabled={!active}
                  >
                    {DOC_TIPOS.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    label="Documento"
                    value={m.documento || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "documento", e.target.value)
                    }
                    onBlur={(e) =>
                      onBlurDocumento(idx, e.target.value, m.docTipo || "DNI")
                    }
                    fullWidth
                    disabled={!active}
                  />
                </Grid>

                {/* Datos personales */}
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Fecha de nacimiento *"
                    type="date"
                    value={toDateInput(m.fechaNac)}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateIntegrante(idx, "fechaNac", val);
                      updateIntegrante(idx, "edad", calcAge(val));
                    }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={!active}
                    error={req.missingFecha}
                    helperText={req.missingFecha ? "Obligatorio" : " "}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Edad (auto)"
                    type="number"
                    value={m.edad ?? ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    helperText="Se calcula automáticamente"
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    select
                    label="Sexo"
                    value={m.sexo || "X"}
                    onChange={(e) =>
                      updateIntegrante(idx, "sexo", e.target.value)
                    }
                    fullWidth
                    disabled={!active}
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
                    label="CUIL"
                    value={m.cuil || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "cuil", e.target.value)
                    }
                    fullWidth
                    placeholder="27-XXXXXXXX-X"
                    disabled={!active}
                  />
                </Grid>

                {/* Contacto & Dirección */}
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Teléfono"
                    value={m.telefono || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "telefono", e.target.value)
                    }
                    onBlur={(e) => onBlurTelefono(idx, e.target.value)}
                    fullWidth
                    placeholder="+54 9 ..."
                    disabled={!active}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Domicilio"
                    value={m.domicilio || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "domicilio", e.target.value)
                    }
                    onBlur={(e) => onBlurDomicilio(idx, e.target.value)}
                    fullWidth
                    disabled={!active}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    label="Ciudad"
                    value={m.ciudad || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "ciudad", e.target.value)
                    }
                    onBlur={(e) => onBlurCiudad(idx, e.target.value)}
                    fullWidth
                    disabled={!active}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    select
                    label="Provincia"
                    value={m.provincia || "Mendoza"}
                    onChange={(e) =>
                      updateIntegrante(idx, "provincia", e.target.value)
                    }
                    onBlur={(e) => onBlurProvincia(idx, e.target.value)}
                    fullWidth
                    disabled={!active}
                  >
                    {PROVINCIAS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="CP"
                    value={m.cp || ""}
                    onChange={(e) =>
                      updateIntegrante(idx, "cp", e.target.value)
                    }
                    fullWidth
                    disabled={!active}
                  />
                </Grid>

                {/* Flags del integrante */}
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(m.cremacion)}
                        onChange={(e) =>
                          updateIntegrante(idx, "cremacion", e.target.checked)
                        }
                        disabled={!active}
                      />
                    }
                    label="Cremación"
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(m.parcela)}
                        onChange={(e) =>
                          updateIntegrante(idx, "parcela", e.target.checked)
                        }
                        disabled={!active}
                      />
                    }
                    label="Parcela"
                  />
                </Grid>

                {/* Observaciones */}
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
                    disabled={!active}
                  />
                </Grid>

                {/* (Opcional) mostrar baja cuando está inactivo */}
                {!active ? (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mt: 0.5 }}>
                      Este integrante está en <b>baja</b>
                      {toDateInput(m.baja) ? (
                        <>
                          {" "}
                          desde <b>{toDateInput(m.baja)}</b>
                        </>
                      ) : null}
                      . Podés reactivarlo con el switch.
                    </Alert>
                  </Grid>
                ) : null}
              </Grid>
            </Paper>
          );
        })}

        <Button
          variant="brandYellow"
          onClick={() => {
            // ✅ defaults para el nuevo familiar
            pushIntegrante({
              activo: true,
              baja: null,
              docTipo: "DNI",
              sexo: "X",
              provincia: "Mendoza",
              cremacion: false,
              parcela: false,
            });
          }}
        >
          + Agregar familiar
        </Button>

        <Alert severity="info">
          Los familiares se crean como registros independientes que{" "}
          <b>comparten el mismo N° de cliente</b>. La <b>cuota ideal</b> del
          grupo se recalcula automáticamente al guardar.
          <br />
          Ahora podés <b>dar de baja/reactivar</b> a cada integrante con su
          switch (sin eliminar el grupo).
        </Alert>
      </Stack>
    </>
  );
}
