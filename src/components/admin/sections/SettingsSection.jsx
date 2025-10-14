import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import RuleIcon from "@mui/icons-material/Rule";
import CalculateIcon from "@mui/icons-material/Calculate";
import UpdateIcon from "@mui/icons-material/Update";
import SaveIcon from "@mui/icons-material/Save";
import ReplayIcon from "@mui/icons-material/Replay";
import { useSettings } from "../../../context/SettingsContext";

/* ===================== Defaults y helpers ===================== */
const DEFAULT_RULES = {
  base: 16000,
  cremationCoef: 0.125,
  group: { neutralAt: 4, step: 0.25, minMap: { 1: 0.5, 2: 0.75, 3: 1.0 } },
  age: [
    { min: 66, coef: 1.375 },
    { min: 61, coef: 1.25 },
    { min: 51, coef: 1.125 },
  ],
};

const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// normaliza/ordena tiers edad (desc por min)
const normalizeRules = (r) => {
  const clean = {
    base: toNumber(r?.base, DEFAULT_RULES.base),
    cremationCoef: toNumber(r?.cremationCoef, DEFAULT_RULES.cremationCoef),
    group: {
      neutralAt: toNumber(r?.group?.neutralAt, DEFAULT_RULES.group.neutralAt),
      step: toNumber(r?.group?.step, DEFAULT_RULES.group.step),
      minMap: r?.group?.minMap || DEFAULT_RULES.group.minMap,
    },
    age:
      Array.isArray(r?.age) && r.age.length
        ? [...r.age]
        : [...DEFAULT_RULES.age],
  };
  clean.age.sort((a, b) => b.min - a.min);
  clean.age = clean.age.map((t) => ({
    min: toNumber(t.min, 0),
    coef: toNumber(t.coef, 1),
  }));
  return clean;
};

// igualdad “estable” para dirty checking
const stableStr = (obj) => JSON.stringify(obj, Object.keys(obj).sort());

/* =============== Mini engine (preview local) =============== */
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
  // si no hay minMap exacto, aproximamos con “neutralAt/step”
  const neutral = toNumber(group?.neutralAt, 4);
  const step = toNumber(group?.step, 0.25);
  const delta = m - neutral;
  return 1 + delta * step;
};

const ageCoefWith = (edadMax, tiers) => {
  const e = Number(edadMax) || 0;
  const found = (tiers || []).find((t) => e >= (t?.min ?? 0));
  return found?.coef ? Number(found.coef) : 1;
};

const computePreview = (rules, { integrantes, edadMax, cremaciones }) => {
  const base = toNumber(rules.base, DEFAULT_RULES.base);
  const gf = groupFactorWith(integrantes, rules.group);
  const af = ageCoefWith(edadMax, rules.age);
  const crem = Math.max(0, Number(cremaciones) || 0);
  const cremCost =
    base * toNumber(rules.cremationCoef, DEFAULT_RULES.cremationCoef) * crem;
  const subtotal = base * gf * af + cremCost;
  return roundPolicy500(subtotal);
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/* ===================== Componente ===================== */
export default function SettingsSection() {
  const {
    priceRules,
    loading,
    err,
    reload,
    save,
    hasRemote, // ← del contexto (true si vino backend)
    lastLoadedAt, // ← Date | string
    lastSavedAt, // ← Date | string
  } = useSettings();

  // edición local
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [rules, setRules] = React.useState(DEFAULT_RULES);
  const [minMapText, setMinMapText] = React.useState(
    JSON.stringify(DEFAULT_RULES.group.minMap, null, 2)
  );
  const [snack, setSnack] = React.useState({
    open: false,
    type: "success",
    msg: "",
  });

  // preview inputs
  const [preview, setPreview] = React.useState({
    integrantes: 4,
    edadMax: 52,
    cremaciones: 0,
  });

  // sincroniza con contexto
  React.useEffect(() => {
    const clean = normalizeRules(priceRules || DEFAULT_RULES);
    setRules(clean);
    setMinMapText(JSON.stringify(clean.group.minMap, null, 2));
    setError(err || "");
  }, [priceRules, err]);

  const handleChange = (path, value) => {
    setRules((prev) => {
      const next =
        typeof structuredClone === "function"
          ? structuredClone(prev)
          : JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let ctx = next;
      for (let i = 0; i < keys.length - 1; i++) ctx = ctx[keys[i]];
      ctx[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addTier = () => {
    const maxMin = Math.max(0, ...rules.age.map((t) => t.min));
    const newTier = { min: maxMin + 1, coef: 1.0 };
    handleChange(
      "age",
      [newTier, ...rules.age].sort((a, b) => b.min - a.min)
    );
  };

  const removeTier = (idx) => {
    handleChange(
      "age",
      rules.age.filter((_, i) => i !== idx)
    );
  };

  const resetDefaults = () => {
    const clean = normalizeRules(DEFAULT_RULES);
    setRules(clean);
    setMinMapText(JSON.stringify(clean.group.minMap, null, 2));
    setError("");
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      let parsedMinMap = {};
      try {
        parsedMinMap = JSON.parse(minMapText || "{}");
        if (typeof parsedMinMap !== "object" || Array.isArray(parsedMinMap)) {
          throw new Error("minMap debe ser un objeto JSON");
        }
      } catch (e) {
        throw new Error("minMap inválido: " + e.message);
      }

      const payload = {
        priceRules: {
          base: toNumber(rules.base, DEFAULT_RULES.base),
          cremationCoef: toNumber(
            rules.cremationCoef,
            DEFAULT_RULES.cremationCoef
          ),
          group: {
            neutralAt: toNumber(
              rules.group.neutralAt,
              DEFAULT_RULES.group.neutralAt
            ),
            step: toNumber(rules.group.step, DEFAULT_RULES.group.step),
            minMap: parsedMinMap,
          },
          age: rules.age
            .map((t) => ({
              min: toNumber(t.min, 0),
              coef: toNumber(t.coef, 1),
            }))
            .sort((a, b) => b.min - a.min),
        },
      };

      await save(payload);
      await reload();
      setSnack({
        open: true,
        type: "success",
        msg: "Reglas guardadas correctamente",
      });
    } catch (e) {
      const m = e?.message || "No se pudieron guardar las reglas";
      setError(m);
      setSnack({ open: true, type: "error", msg: m });
    } finally {
      setSaving(false);
    }
  };

  // estado visual: backend vs defaults
  const cameFromBackend = !!(hasRemote ?? priceRules);
  const lastLoad = lastLoadedAt ? new Date(lastLoadedAt).toLocaleString() : "—";
  const lastSave = lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "—";

  // validación minMap JSON
  let minMapValid = true;
  try {
    const obj = JSON.parse(minMapText || "{}");
    minMapValid = obj && typeof obj === "object" && !Array.isArray(obj);
  } catch {
    minMapValid = false;
  }

  // dirty checking
  const canonical = normalizeRules(priceRules || DEFAULT_RULES);
  const isDirty =
    stableStr({
      ...rules,
      group: { ...rules.group, minMap: JSON.parse(minMapText || "{}") },
    }) !== stableStr(canonical);

  const previewValue = computePreview(rules, preview);

  return (
    <Box>
      {/* HEADER */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        mb={2}
        flexWrap="wrap"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Settings de precios
          </Typography>
          {cameFromBackend ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="Backend OK"
              color="success"
              size="small"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<CloudOffIcon />}
              label="Usando defaults"
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
          {isDirty && (
            <Chip
              icon={<RuleIcon />}
              label="Cambios sin guardar"
              color="info"
              size="small"
              variant="filled"
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Restaurar defaults">
            <span>
              <IconButton onClick={resetDefaults} disabled={loading || saving}>
                <RestartAltIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Recargar desde backend">
            <span>
              <IconButton onClick={() => reload()} disabled={loading || saving}>
                <ReplayIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Metadatos de sincronización */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Chip
          icon={<UpdateIcon />}
          size="small"
          variant="outlined"
          label={`Última carga: ${lastLoad}`}
        />
        <Chip
          icon={<SaveIcon />}
          size="small"
          variant="outlined"
          label={`Último guardado: ${lastSave}`}
        />
      </Stack>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="20vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {/* Columna izquierda */}
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Base ($)"
                  type="number"
                  fullWidth
                  value={rules.base}
                  onChange={(e) =>
                    handleChange("base", toNumber(e.target.value, rules.base))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Coef. cremación (por integrante)"
                  type="number"
                  fullWidth
                  inputProps={{ step: "0.001" }}
                  value={rules.cremationCoef}
                  onChange={(e) =>
                    handleChange(
                      "cremationCoef",
                      toNumber(e.target.value, rules.cremationCoef)
                    )
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, borderColor: "divider" }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Grupo familiar
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="neutralAt"
                        type="number"
                        fullWidth
                        value={rules.group.neutralAt}
                        onChange={(e) =>
                          handleChange(
                            "group.neutralAt",
                            toNumber(e.target.value, rules.group.neutralAt)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="step"
                        type="number"
                        fullWidth
                        inputProps={{ step: "0.01" }}
                        value={rules.group.step}
                        onChange={(e) =>
                          handleChange(
                            "group.step",
                            toNumber(e.target.value, rules.group.step)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label={`minMap (JSON) ${
                          minMapValid ? "" : " — inválido"
                        }`}
                        fullWidth
                        multiline
                        minRows={4}
                        error={!minMapValid}
                        helperText={
                          !minMapValid
                            ? "Debe ser un objeto JSON válido"
                            : "Mapeo específico por tamaño de grupo (opcional)"
                        }
                        value={minMapText}
                        onChange={(e) => setMinMapText(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, borderColor: "divider" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Tiers por edad</Typography>
                    <Button
                      size="small"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addTier}
                    >
                      Agregar tier
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {rules.age.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No hay tiers. Agregá al menos uno.
                    </Typography>
                  ) : (
                    rules.age.map((t, idx) => (
                      <Grid container spacing={2} key={idx} sx={{ mb: 1 }}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            label="Edad mínima (inclusive)"
                            type="number"
                            fullWidth
                            value={t.min}
                            onChange={(e) => {
                              const arr = [...rules.age];
                              arr[idx] = {
                                ...arr[idx],
                                min: toNumber(e.target.value, t.min),
                              };
                              handleChange(
                                "age",
                                arr.sort((a, b) => b.min - a.min)
                              );
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            label="Coeficiente"
                            type="number"
                            fullWidth
                            inputProps={{ step: "0.001" }}
                            value={t.coef}
                            onChange={(e) => {
                              const arr = [...rules.age];
                              arr[idx] = {
                                ...arr[idx],
                                coef: toNumber(e.target.value, t.coef),
                              };
                              handleChange("age", arr);
                            }}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={2}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Tooltip title="Eliminar">
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => removeTier(idx)}
                                disabled={rules.age.length <= 1}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    ))
                  )}
                </Paper>
              </Grid>

              {error ? (
                <Grid item xs={12}>
                  <Alert severity="error" variant="outlined">
                    {error}
                  </Alert>
                </Grid>
              ) : null}
            </Grid>
          </Grid>

          {/* Columna derecha: Preview / Estado */}
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, borderColor: "divider" }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <CalculateIcon fontSize="small" />
                <Typography variant="subtitle2">
                  Preview (ejemplo rápido)
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    label="Integrantes"
                    type="number"
                    fullWidth
                    value={preview.integrantes}
                    onChange={(e) =>
                      setPreview((p) => ({
                        ...p,
                        integrantes: toNumber(e.target.value, p.integrantes),
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Edad máx."
                    type="number"
                    fullWidth
                    value={preview.edadMax}
                    onChange={(e) =>
                      setPreview((p) => ({
                        ...p,
                        edadMax: toNumber(e.target.value, p.edadMax),
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Cremaciones"
                    type="number"
                    fullWidth
                    value={preview.cremaciones}
                    onChange={(e) =>
                      setPreview((p) => ({
                        ...p,
                        cremaciones: toNumber(e.target.value, p.cremaciones),
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Cuota ideal (redondeo x 500):
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {money.format(previewValue)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, borderColor: "divider", mt: 2 }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <RuleIcon fontSize="small" />
                <Typography variant="subtitle2">Origen / Estado</Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {cameFromBackend ? (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label="Cargado desde backend"
                  />
                ) : (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label="Defaults locales"
                  />
                )}
                {isDirty ? (
                  <Chip
                    size="small"
                    color="info"
                    label="Hay cambios pendientes"
                  />
                ) : (
                  <Chip size="small" variant="outlined" label="Sin cambios" />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Última carga: ${lastLoad}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Último guardado: ${lastSave}`}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Barra de acciones */}
          <Grid item xs={12}>
            <Box
              sx={{
                position: { xs: "static", md: "sticky" },
                bottom: 0,
                bgcolor: "background.paper",
                borderTop: { md: "1px solid", xs: "none" },
                borderColor: "divider",
                py: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                zIndex: 1,
              }}
            >
              <Button
                onClick={() => reload()}
                variant="outlined"
                disabled={loading || saving}
                startIcon={<ReplayIcon />}
              >
                {loading ? "Cargando…" : "Descartar cambios"}
              </Button>
              <Button
                onClick={onSave}
                variant="contained"
                disabled={saving || !minMapValid || !isDirty}
                startIcon={<SaveIcon />}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
