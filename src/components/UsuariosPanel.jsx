// src/components/UsuariosPanel.jsx
import React from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Pagination,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

const ROLE_OPTIONS = [
  "superAdmin",
  "admin",
  "user",
  "client",
  "cobrador",
  "vendedor",
];

export default function UsuariosPanel({
  users = [],
  loading = false,
  onSearch,
  onSelectUser,
  onChangeRole, // (userId, newRole) => Promise | void
  onAssignCobrador, // (userId, idCobrador|null) => Promise | void
  onAssignVendedor, // (userId, idVendedor|null) => Promise | void
  onChangeCommission, // (userId, porcentajeCobrador|null) => Promise | void
  onChangeCommissionGraceDays, // (userId, days|null) => Promise | void
  onChangeCommissionPenaltyPerDay, // (userId, pct|null) => Promise | void
  page,
  total,
  limit,
  onPageChange,
}) {
  const [byId, setById] = React.useState("");
  const [byEmail, setByEmail] = React.useState("");

  const [roleDraft, setRoleDraft] = React.useState({});
  const [cobradorDraft, setCobradorDraft] = React.useState({});
  const [vendedorDraft, setVendedorDraft] = React.useState({});
  const [commissionDraft, setCommissionDraft] = React.useState({});

  const [graceDraft, setGraceDraft] = React.useState({});
  const [penaltyDraft, setPenaltyDraft] = React.useState({});

  const [editCobrador, setEditCobrador] = React.useState({});
  const [editVendedor, setEditVendedor] = React.useState({});
  const [editCommission, setEditCommission] = React.useState({});
  const [editGrace, setEditGrace] = React.useState({});
  const [editPenalty, setEditPenalty] = React.useState({});

  const [saving, setSaving] = React.useState({});
  const [errOpen, setErrOpen] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState("");

  const showError = (msg) => {
    setErrMsg(msg || "Error realizando la operación.");
    setErrOpen(true);
  };

  const handleSearch = () =>
    onSearch?.({ id: byId.trim(), email: byEmail.trim() });

  const startSave = (k) => setSaving((s) => ({ ...s, [k]: true }));
  const endSave = (k) =>
    setSaving((s) => {
      const c = { ...s };
      delete c[k];
      return c;
    });

  const handleSaveRole = async (u) => {
    const next = roleDraft[u._id] ?? u.role;
    if (!onChangeRole || next === u.role) return;
    const key = `${u._id}-role`;
    try {
      startSave(key);
      await onChangeRole(u._id, next);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  const handleSaveCobrador = async (u) => {
    if (!onAssignCobrador) return;
    const next = (cobradorDraft[u._id] ?? u.idCobrador ?? "").toString().trim();
    const key = `${u._id}-cobrador`;
    try {
      startSave(key);
      await onAssignCobrador(u._id, next || null);
      setEditCobrador((m) => ({ ...m, [u._id]: false }));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  const handleSaveVendedor = async (u) => {
    if (!onAssignVendedor) return;
    const next = (vendedorDraft[u._id] ?? u.idVendedor ?? "").toString().trim();
    const key = `${u._id}-vendedor`;
    try {
      startSave(key);
      await onAssignVendedor(u._id, next || null);
      setEditVendedor((m) => ({ ...m, [u._id]: false }));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  // Guardar comisión %
  const handleSaveCommission = async (u) => {
    if (!onChangeCommission) return;
    const raw = (commissionDraft[u._id] ?? u.porcentajeCobrador ?? "")
      .toString()
      .replace(",", ".")
      .trim();

    const key = `${u._id}-commission`;

    const nextNum =
      raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : NaN;

    if (raw !== "" && !Number.isFinite(nextNum)) {
      showError("El porcentaje debe ser un número válido.");
      return;
    }
    if (Number.isFinite(nextNum) && (nextNum < 0 || nextNum > 100)) {
      showError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    try {
      startSave(key);
      await onChangeCommission(u._id, nextNum);
      setEditCommission((m) => ({ ...m, [u._id]: false }));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  // Guardar días de gracia
  const handleSaveGrace = async (u) => {
    if (!onChangeCommissionGraceDays) return;
    const raw = (graceDraft[u._id] ?? u.commissionGraceDays ?? "")
      .toString()
      .trim();
    const key = `${u._id}-grace`;

    const nextNum =
      raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : NaN;

    if (raw !== "" && !Number.isFinite(nextNum)) {
      showError("Los días de gracia deben ser un número válido.");
      return;
    }
    if (Number.isFinite(nextNum) && (nextNum < 0 || nextNum > 60)) {
      showError("Los días de gracia deben estar entre 0 y 60.");
      return;
    }

    try {
      startSave(key);
      await onChangeCommissionGraceDays(u._id, nextNum);
      setEditGrace((m) => ({ ...m, [u._id]: false }));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  // Guardar penalidad por día
  const handleSavePenalty = async (u) => {
    if (!onChangeCommissionPenaltyPerDay) return;
    const raw = (penaltyDraft[u._id] ?? u.commissionPenaltyPerDay ?? "")
      .toString()
      .replace(",", ".")
      .trim();
    const key = `${u._id}-penalty`;

    const nextNum =
      raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : NaN;

    if (raw !== "" && !Number.isFinite(nextNum)) {
      showError("La penalidad debe ser un número válido.");
      return;
    }
    if (Number.isFinite(nextNum) && (nextNum < 0 || nextNum > 100)) {
      showError("La penalidad debe estar entre 0 y 100.");
      return;
    }

    try {
      startSave(key);
      await onChangeCommissionPenaltyPerDay(u._id, nextNum);
      setEditPenalty((m) => ({ ...m, [u._id]: false }));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      showError(status === 403 ? msg || "No tenés permisos." : msg);
    } finally {
      endSave(key);
    }
  };

  const pageCount = total && limit ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight={700}
        textTransform="uppercase"
        sx={{ mb: 1 }}
      >
        Usuarios
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Gestioná roles, asignaciones y comisiones de tus usuarios.
      </Typography>

      {/* Buscadores */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2.5,
          display: "grid",
          gap: 2,
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small"
            label="Buscar por email"
            value={byEmail}
            onChange={(e) => setByEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ minWidth: 120 }}
          >
            Buscar
          </Button>
        </Stack>

        {(loading || Object.keys(saving).length > 0) && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {loading ? "Buscando…" : "Guardando…"}
            </Typography>
          </Stack>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Resultados
      </Typography>

      {/* Tabla en contenedor scrollable para mobile */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.06)",
          overflowX: "auto",
        }}
      >
        {!users || users.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Sin resultados.
          </Typography>
        ) : (
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "action.hover",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell>Vendedor</TableCell>
                <TableCell>Comisión cobrador</TableCell>
                <TableCell>Días de gracia</TableCell>
                <TableCell>Penalidad por día (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const savingRole = !!saving[`${u._id}-role`];
                const savingCob = !!saving[`${u._id}-cobrador`];
                const savingVen = !!saving[`${u._id}-vendedor`];
                const savingCom = !!saving[`${u._id}-commission`];
                const savingGrace = !!saving[`${u._id}-grace`];
                const savingPenalty = !!saving[`${u._id}-penalty`];

                const isEditingCob = !!editCobrador[u._id];
                const isEditingVen = !!editVendedor[u._id];
                const isEditingCom = !!editCommission[u._id];
                const isEditingGrace = !!editGrace[u._id];
                const isEditingPenalty = !!editPenalty[u._id];

                const hasCobrador = !!u.idCobrador;
                const hasVendedor = !!u.idVendedor;

                const hasCommission =
                  typeof u.porcentajeCobrador === "number" &&
                  !Number.isNaN(u.porcentajeCobrador);

                const hasGrace =
                  typeof u.commissionGraceDays === "number" &&
                  !Number.isNaN(u.commissionGraceDays);

                const hasPenalty =
                  typeof u.commissionPenaltyPerDay === "number" &&
                  !Number.isNaN(u.commissionPenaltyPerDay);

                return (
                  <TableRow
                    key={u._id}
                    hover
                    sx={{
                      "&:nth-of-type(even)": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <TableCell
                      sx={{ cursor: "pointer", maxWidth: 260 }}
                      onClick={() => onSelectUser?.(u)}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          noWrap
                          title={u.name || "Usuario"}
                        >
                          {u.name || "Usuario"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap title={u.email || "—"}>
                        {u.email || "—"}
                      </Typography>
                    </TableCell>

                    {/* Rol */}
                    <TableCell sx={{ minWidth: 170 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Select
                          size="small"
                          value={roleDraft[u._id] ?? u.role ?? "user"}
                          onChange={(e) =>
                            setRoleDraft((s) => ({
                              ...s,
                              [u._id]: e.target.value,
                            }))
                          }
                          sx={{ minWidth: 130 }}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <MenuItem key={r} value={r}>
                              {r}
                            </MenuItem>
                          ))}
                        </Select>
                        <Tooltip title="Guardar rol">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSaveRole(u)}
                              disabled={!onChangeRole || savingRole}
                            >
                              {savingRole ? (
                                <CircularProgress size={18} />
                              ) : (
                                <SaveRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>

                    {/* Cobrador */}
                    <TableCell sx={{ minWidth: 200 }}>
                      {!isEditingCob ? (
                        hasCobrador ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Chip
                              size="small"
                              color="primary"
                              label={`Cobrador: ${u.idCobrador}`}
                            />
                            <Tooltip title="Modificar cobrador">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCobradorDraft((s) => ({
                                      ...s,
                                      [u._id]: u.idCobrador,
                                    }));
                                    setEditCobrador((m) => ({
                                      ...m,
                                      [u._id]: true,
                                    }));
                                  }}
                                  disabled={!onAssignCobrador}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setEditCobrador((m) => ({ ...m, [u._id]: true }))
                            }
                            disabled={!onAssignCobrador}
                          >
                            Asignar
                          </Button>
                        )
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            size="small"
                            placeholder="idCobrador"
                            value={cobradorDraft[u._id] ?? u.idCobrador ?? ""}
                            onChange={(e) =>
                              setCobradorDraft((s) => ({
                                ...s,
                                [u._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCobrador(u);
                              if (e.key === "Escape")
                                setEditCobrador((m) => ({
                                  ...m,
                                  [u._id]: false,
                                }));
                            }}
                            sx={{ maxWidth: 160 }}
                            disabled={savingCob}
                          />
                          <Tooltip title="Guardar cobrador">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleSaveCobrador(u)}
                                disabled={!onAssignCobrador || savingCob}
                              >
                                {savingCob ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SaveRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditCobrador((m) => ({ ...m, [u._id]: false }))
                            }
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>

                    {/* Vendedor */}
                    <TableCell sx={{ minWidth: 200 }}>
                      {!isEditingVen ? (
                        hasVendedor ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Chip
                              size="small"
                              color="secondary"
                              label={`Vendedor: ${u.idVendedor}`}
                            />
                            <Tooltip title="Modificar vendedor">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setVendedorDraft((s) => ({
                                      ...s,
                                      [u._id]: u.idVendedor,
                                    }));
                                    setEditVendedor((m) => ({
                                      ...m,
                                      [u._id]: true,
                                    }));
                                  }}
                                  disabled={!onAssignVendedor}
                                >
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setEditVendedor((m) => ({ ...m, [u._id]: true }))
                            }
                            disabled={!onAssignVendedor}
                          >
                            Asignar
                          </Button>
                        )
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            size="small"
                            placeholder="idVendedor"
                            value={vendedorDraft[u._id] ?? u.idVendedor ?? ""}
                            onChange={(e) =>
                              setVendedorDraft((s) => ({
                                ...s,
                                [u._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveVendedor(u);
                              if (e.key === "Escape")
                                setEditVendedor((m) => ({
                                  ...m,
                                  [u._id]: false,
                                }));
                            }}
                            sx={{ maxWidth: 160 }}
                            disabled={savingVen}
                          />
                          <Tooltip title="Guardar vendedor">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleSaveVendedor(u)}
                                disabled={!onAssignVendedor || savingVen}
                              >
                                {savingVen ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SaveRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditVendedor((m) => ({ ...m, [u._id]: false }))
                            }
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>

                    {/* Comisión cobrador (editable) */}
                    <TableCell sx={{ minWidth: 190 }}>
                      {!isEditingCom ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {hasCommission ? (
                            <Chip
                              size="small"
                              color="success"
                              label={`${u.porcentajeCobrador}%`}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Sin comisión"
                              variant="outlined"
                            />
                          )}
                          <Tooltip title="Editar comisión">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCommissionDraft((s) => ({
                                    ...s,
                                    [u._id]:
                                      u.porcentajeCobrador != null
                                        ? u.porcentajeCobrador
                                        : "",
                                  }));
                                  setEditCommission((m) => ({
                                    ...m,
                                    [u._id]: true,
                                  }));
                                }}
                                disabled={!onChangeCommission}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ maxWidth: 220 }}
                        >
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                            placeholder="Porcentaje"
                            value={
                              commissionDraft[u._id] ??
                              u.porcentajeCobrador ??
                              ""
                            }
                            onChange={(e) =>
                              setCommissionDraft((s) => ({
                                ...s,
                                [u._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCommission(u);
                              if (e.key === "Escape")
                                setEditCommission((m) => ({
                                  ...m,
                                  [u._id]: false,
                                }));
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  %
                                </InputAdornment>
                              ),
                            }}
                            helperText="Vacío = sin comisión"
                            FormHelperTextProps={{
                              sx: { mt: 0, fontSize: 11 },
                            }}
                            autoFocus
                            disabled={savingCom}
                          />
                          <Tooltip title="Guardar comisión">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleSaveCommission(u)}
                                disabled={!onChangeCommission || savingCom}
                              >
                                {savingCom ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SaveRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditCommission((m) => ({
                                ...m,
                                [u._id]: false,
                              }))
                            }
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>

                    {/* Días de gracia */}
                    <TableCell sx={{ minWidth: 160 }}>
                      {!isEditingGrace ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {hasGrace ? (
                            <Chip
                              size="small"
                              label={`${u.commissionGraceDays} días`}
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Usa default"
                              variant="outlined"
                            />
                          )}
                          <Tooltip title="Editar días de gracia">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setGraceDraft((s) => ({
                                    ...s,
                                    [u._id]:
                                      u.commissionGraceDays != null
                                        ? u.commissionGraceDays
                                        : "",
                                  }));
                                  setEditGrace((m) => ({
                                    ...m,
                                    [u._id]: true,
                                  }));
                                }}
                                disabled={!onChangeCommissionGraceDays}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ maxWidth: 220 }}
                        >
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 60, step: 1 }}
                            placeholder="Días"
                            value={
                              graceDraft[u._id] ?? u.commissionGraceDays ?? ""
                            }
                            onChange={(e) =>
                              setGraceDraft((s) => ({
                                ...s,
                                [u._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveGrace(u);
                              if (e.key === "Escape")
                                setEditGrace((m) => ({
                                  ...m,
                                  [u._id]: false,
                                }));
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  días
                                </InputAdornment>
                              ),
                            }}
                            helperText="Vacío = usa días generales"
                            FormHelperTextProps={{
                              sx: { mt: 0, fontSize: 11 },
                            }}
                            autoFocus
                            disabled={savingGrace}
                          />
                          <Tooltip title="Guardar días de gracia">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleSaveGrace(u)}
                                disabled={
                                  !onChangeCommissionGraceDays || savingGrace
                                }
                              >
                                {savingGrace ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SaveRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditGrace((m) => ({ ...m, [u._id]: false }))
                            }
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>

                    {/* Penalidad por día (%) */}
                    <TableCell sx={{ minWidth: 190 }}>
                      {!isEditingPenalty ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {hasPenalty ? (
                            <Chip
                              size="small"
                              label={`${u.commissionPenaltyPerDay}%`}
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Sin penalidad"
                              variant="outlined"
                            />
                          )}
                          <Tooltip title="Editar penalidad diaria">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setPenaltyDraft((s) => ({
                                    ...s,
                                    [u._id]:
                                      u.commissionPenaltyPerDay != null
                                        ? u.commissionPenaltyPerDay
                                        : "",
                                  }));
                                  setEditPenalty((m) => ({
                                    ...m,
                                    [u._id]: true,
                                  }));
                                }}
                                disabled={!onChangeCommissionPenaltyPerDay}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ maxWidth: 230 }}
                        >
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                            placeholder="Penalidad diaria"
                            value={
                              penaltyDraft[u._id] ??
                              u.commissionPenaltyPerDay ??
                              ""
                            }
                            onChange={(e) =>
                              setPenaltyDraft((s) => ({
                                ...s,
                                [u._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePenalty(u);
                              if (e.key === "Escape")
                                setEditPenalty((m) => ({
                                  ...m,
                                  [u._id]: false,
                                }));
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  %/día
                                </InputAdornment>
                              ),
                            }}
                            helperText="Vacío = sin penalidad"
                            FormHelperTextProps={{
                              sx: { mt: 0, fontSize: 11 },
                            }}
                            autoFocus
                            disabled={savingPenalty}
                          />
                          <Tooltip title="Guardar penalidad">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleSavePenalty(u)}
                                disabled={
                                  !onChangeCommissionPenaltyPerDay ||
                                  savingPenalty
                                }
                              >
                                {savingPenalty ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <SaveRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditPenalty((m) => ({ ...m, [u._id]: false }))
                            }
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Paginación opcional */}
      {onPageChange && total && limit ? (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Pagination
            page={page || 1}
            count={pageCount}
            onChange={(_, p) => onPageChange(p)}
          />
        </Stack>
      ) : null}

      {/* Snackbar de errores */}
      <Snackbar
        open={errOpen}
        autoHideDuration={4200}
        onClose={() => setErrOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setErrOpen(false)}
        >
          {errMsg}
        </Alert>
      </Snackbar>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Tip: hacé click en el nombre para abrir edición avanzada (dialog o
        ruta).
      </Typography>
    </Box>
  );
}
