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
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const ROLE_OPTIONS = [
  "superAdmin",
  "admin",
  "user",
  "client",
  "cobrador",
  "vendedor",
];

export default function UsuariosPanel({
  // === existentes ===
  users = [],
  loading = false,
  onSearch,
  onSelectUser,

  // === nuevos opcionales (si no los pasás, no se rompen) ===
  onChangeRole, // (userId, newRole) => Promise | void
  onAssignCobrador, // (userId, idCobrador) => Promise | void
  onAssignVendedor, // (userId, idVendedor) => Promise | void

  // paginación opcional
  page,
  total,
  limit,
  onPageChange, // (newPage) => void
}) {
  const [byId, setById] = React.useState("");
  const [byEmail, setByEmail] = React.useState("");

  // estados locales de edición por fila
  const [roleDraft, setRoleDraft] = React.useState({}); // { userId: "admin" }
  const [cobradorDraft, setCobradorDraft] = React.useState({}); // { userId: "123" }
  const [vendedorDraft, setVendedorDraft] = React.useState({}); // { userId: "456" }

  // toggles de edición (solo mostrar input cuando se edita)
  const [editCobrador, setEditCobrador] = React.useState({}); // { userId: true }
  const [editVendedor, setEditVendedor] = React.useState({}); // { userId: true }

  const [saving, setSaving] = React.useState({}); // { key(userId-field): true }

  const handleSearch = () => {
    onSearch?.({ id: byId.trim(), email: byEmail.trim() });
  };

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
      setEditCobrador((m) => ({ ...m, [u._id]: false })); // cerrar edición al guardar
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
      setEditVendedor((m) => ({ ...m, [u._id]: false })); // cerrar edición al guardar
    } finally {
      endSave(key);
    }
  };

  const pageCount = total && limit ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <Box>
          <Typography variant="h4" fontWeight={700} textTransform= "uppercase">
        Usuarios
      </Typography>

      {/* Buscadores */}
      <Paper
        elevation={1}
        sx={{ p: 2, borderRadius: 2, mb: 2, display: "grid", gap: 2 }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small"
            label="Buscar por ID"
            value={byId}
            onChange={(e) => setById(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <TextField
            size="small"
            label="Buscar por email"
            value={byEmail}
            onChange={(e) => setByEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button variant="contained" onClick={handleSearch}>
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

      {/* Tabla de resultados */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 2, border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {!users || users.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Sin resultados.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell>Vendedor</TableCell>
                <TableCell>Verificado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const savingRole = !!saving[`${u._id}-role`];
                const savingCob = !!saving[`${u._id}-cobrador`];
                const savingVen = !!saving[`${u._id}-vendedor`];

                const isEditingCob = !!editCobrador[u._id];
                const isEditingVen = !!editVendedor[u._id];

                const hasCobrador = !!u.idCobrador;
                const hasVendedor = !!u.idVendedor;

                return (
                  <TableRow key={u._id} hover>
                    <TableCell
                      sx={{ cursor: "pointer", maxWidth: 260 }}
                      onClick={() => onSelectUser?.(u)}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EditRoundedIcon fontSize="small" />
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
                          sx={{ minWidth: 120 }}
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

                    {/* ===== Cobrador ===== */}
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
                            sx={{ maxWidth: 160 }}
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
                          <Button
                            size="small"
                            onClick={() =>
                              setEditCobrador((m) => ({
                                ...m,
                                [u._id]: false,
                              }))
                            }
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      )}
                    </TableCell>

                    {/* ===== Vendedor ===== */}
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
                            sx={{ maxWidth: 160 }}
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
                          <Button
                            size="small"
                            onClick={() =>
                              setEditVendedor((m) => ({
                                ...m,
                                [u._id]: false,
                              }))
                            }
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      )}
                    </TableCell>

                    <TableCell>
                      {u.emailVerified ? (
                        <Chip size="small" label="Verificado" color="success" />
                      ) : (
                        <Chip size="small" label="No verificado" />
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onSelectUser?.(u)}
                      >
                        Editar
                      </Button>
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

      {/* Separador visual */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Tip: hacé click en el nombre para abrir edición avanzada (dialog o
        ruta).
      </Typography>
    </Box>
  );
}
