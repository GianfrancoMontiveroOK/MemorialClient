// src/components/admin/sections/SettingsSection.jsx
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
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

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
import StorageIcon from "@mui/icons-material/Storage";
import BoltIcon from "@mui/icons-material/Bolt";

import { useSettings } from "../../../context/SettingsContext";

// cards en carpeta settingsSection/
import ClientsDbImportCard from "./settingsSection/ClientsDbImportCard";
import BulkOperationsCard from "./settingsSection/BulkOperationsCard";

// constants compartidas
import {
  DEFAULT_RULES,
  normalizeRules,
  toNumber,
  stableStr,
  computePreview,
  money,
} from "./settingsSection/constants";

/* ===================== TabPanel helper ===================== */
function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ mt: 2 }}>{children}</Box>;
}

/* ===================== Componente ===================== */
export default function SettingsSection() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const {
    priceRules,
    loading,
    err,
    reload,
    save,
    hasRemote,
    lastLoadedAt,
    lastSavedAt,
    importClientsDbXlsx, // ✅ solo esto
  } = useSettings();

  // navegación
  const [tab, setTab] = React.useState(0);

  // ---- edición price rules ----
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

  const pushSnack = React.useCallback((type, msg) => {
    setSnack({ open: true, type, msg });
  }, []);

  // preview inputs
  const [preview, setPreview] = React.useState({
    integrantes: 4,
    edadMax: 52,
    cremaciones: 0,
  });

  // sync contexto -> UI
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

  const removeTier = (idx) =>
    handleChange(
      "age",
      rules.age.filter((_, i) => i !== idx)
    );

  const resetDefaults = () => {
    const clean = normalizeRules(DEFAULT_RULES);
    setRules(clean);
    setMinMapText(JSON.stringify(clean.group.minMap, null, 2));
    setError("");
    pushSnack("info", "Defaults restaurados");
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

      pushSnack("success", "Reglas guardadas correctamente");
    } catch (e) {
      const m = e?.message || "No se pudieron guardar las reglas";
      setError(m);
      pushSnack("error", m);
    } finally {
      setSaving(false);
    }
  };

  // estado visual: backend vs defaults
  const cameFromBackend = !!(hasRemote ?? priceRules);
  const lastLoad = lastLoadedAt ? new Date(lastLoadedAt).toLocaleString() : "—";
  const lastSave = lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "—";

  // minMap JSON validation
  let minMapValid = true;
  let minMapParsed = {};
  try {
    const obj = JSON.parse(minMapText || "{}");
    minMapValid = obj && typeof obj === "object" && !Array.isArray(obj);
    minMapParsed = minMapValid ? obj : {};
  } catch {
    minMapValid = false;
    minMapParsed = {};
  }

  const canonical = normalizeRules(priceRules || DEFAULT_RULES);
  const isDirty = (() => {
    if (!minMapValid) return true;
    const current = {
      ...rules,
      group: { ...rules.group, minMap: minMapParsed },
    };
    const canon = {
      ...canonical,
      group: { ...canonical.group, minMap: canonical.group.minMap },
    };
    return stableStr(current) !== stableStr(canon);
  })();

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
          <Typography variant="h4" fontWeight={800} textTransform="uppercase">
            Settings
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

      {/* Metadatos */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 1 }}
        alignItems="center"
        flexWrap="wrap"
      >
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

      {/* NAV */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant={isMdUp ? "standard" : "scrollable"}
          scrollButtons={isMdUp ? false : "auto"}
        >
          <Tab icon={<RuleIcon />} iconPosition="start" label="Reglas" />
          <Tab
            icon={<StorageIcon />}
            iconPosition="start"
            label="Clientes DB"
          />
          <Tab icon={<BoltIcon />} iconPosition="start" label="Operaciones" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="25vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TAB 0 — Reglas */}
          <TabPanel value={tab} index={0}>
            {/* ... (tu tab reglas igual) ... */}
            {/* (No toqué nada adentro para no romper) */}
          </TabPanel>

          {/* TAB 1 — Import DB */}
          <TabPanel value={tab} index={1}>
            <ClientsDbImportCard importClientsDbXlsx={importClientsDbXlsx} />
          </TabPanel>

          {/* TAB 2 — Operaciones */}
          <TabPanel value={tab} index={2}>
            <BulkOperationsCard onSnack={pushSnack} />
          </TabPanel>
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
