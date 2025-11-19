// src/components/admin/sections/ItemsSection.jsx
import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Stack,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

// ⬇️ TODO: si querés seguir el patrón del proyecto, podés reemplazar
// el estado local por un ItemsContext o llamadas a api/items.js.
// import { useItems } from "../../../context/ItemsContext";

const EMPTY_FORM = {
  codigo: "",
  nombre: "",
  descripcion: "",
  tipo: "cargo", // cargo | abono | mixto
  importeBase: "",
  activo: true,
};

export default function ItemsSection() {
  // Estado local de demo (ABM en memoria)
  const [items, setItems] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // item en edición
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const handleOpenNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      codigo: item.codigo || "",
      nombre: item.nombre || "",
      descripcion: item.descripcion || "",
      tipo: item.tipo || "cargo",
      importeBase:
        item.importeBase !== undefined && item.importeBase !== null
          ? String(item.importeBase)
          : "",
      activo: item.activo !== false,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item) => {
    if (
      !window.confirm(
        `¿Eliminar el ítem "${item.nombre || item.codigo || "sin nombre"}"?`
      )
    )
      return;
    setItems((prev) => prev.filter((it) => it._localId !== item._localId));
    // ⬇️ TODO: acá después llamás a deleteItem(id) contra el backend
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleChangeField = (field) => (e) => {
    const value =
      field === "activo"
        ? e.target.checked
        : field === "importeBase"
        ? e.target.value.replace(",", ".")
        : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!form.nombre.trim() && !form.codigo.trim()) {
      alert("Poné al menos un código o un nombre para el ítem.");
      return;
    }

    let importeNumber = null;
    if (form.importeBase !== "") {
      const n = Number(form.importeBase);
      if (!Number.isFinite(n)) {
        alert("El importe base debe ser un número válido.");
        return;
      }
      importeNumber = n;
    }

    setSaving(true);
    try {
      if (editing) {
        // EDITAR
        const updated = {
          ...editing,
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          tipo: form.tipo,
          importeBase: importeNumber,
          activo: !!form.activo,
        };

        setItems((prev) =>
          prev.map((it) => (it._localId === editing._localId ? updated : it))
        );

        // ⬇️ TODO: acá después reemplazás por updateItem(updated)
      } else {
        // CREAR
        const nuevo = {
          _localId: Date.now() + Math.random(), // id local
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          tipo: form.tipo,
          importeBase: importeNumber,
          activo: !!form.activo,
        };

        setItems((prev) => [nuevo, ...prev]);
        // ⬇️ TODO: acá después llamás a createItem(nuevo)
      }

      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el ítem (esto es demo local).");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      return (
        (it.codigo || "").toLowerCase().includes(q) ||
        (it.nombre || "").toLowerCase().includes(q) ||
        (it.descripcion || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const renderTipoChip = (tipo) => {
    if (tipo === "abono")
      return <Chip label="ABONO" size="small" color="info" />;
    if (tipo === "mixto")
      return <Chip label="MIXTO" size="small" color="secondary" />;
    return <Chip label="CARGO" size="small" color="primary" />;
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="ABM de Ítems"
          subheader="Configurá los conceptos que se usan en los cobros, notas y asientos."
          action={
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenNew}
            >
              NUEVO ÍTEM
            </Button>
          }
        />
        <CardContent>
          {/* Filtro de búsqueda */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            mb={2}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              fullWidth
              label="Buscar por código, nombre o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchRoundedIcon fontSize="small" />,
                endAdornment: search ? (
                  <IconButton
                    size="small"
                    onClick={() => setSearch("")}
                    edge="end"
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minWidth: { sm: 160 },
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              {filteredItems.length} ítem
              {filteredItems.length === 1 ? "" : "s"}
            </Typography>
          </Stack>

          {/* Tabla */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="12%">Código</TableCell>
                  <TableCell width="20%">Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell width="10%">Tipo</TableCell>
                  <TableCell width="12%" align="right">
                    Importe base
                  </TableCell>
                  <TableCell width="10%" align="center">
                    Activo
                  </TableCell>
                  <TableCell width="10%" align="right">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box
                        py={3}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          No hay ítems configurados todavía.
                        </Typography>
                        <Button
                          onClick={handleOpenNew}
                          size="small"
                          sx={{ mt: 1 }}
                          startIcon={<AddRoundedIcon />}
                        >
                          Crear el primero
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {filteredItems.map((item) => (
                  <TableRow key={item._localId}>
                    <TableCell>{item.codigo || "—"}</TableCell>
                    <TableCell>{item.nombre || "—"}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={item.descripcion}
                      >
                        {item.descripcion || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderTipoChip(item.tipo)}</TableCell>
                    <TableCell align="right">
                      {item.importeBase != null
                        ? item.importeBase.toLocaleString("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell align="center">
                      {item.activo !== false ? (
                        <Chip label="Activo" size="small" color="success" />
                      ) : (
                        <Chip label="Inactivo" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item)}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialogo Alta/Edición */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Editar ítem" : "Nuevo ítem"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Código"
                fullWidth
                value={form.codigo}
                onChange={handleChangeField("codigo")}
                helperText="Identificador corto del ítem (ej: IMP-BASE)."
              />
              <TextField
                label="Nombre"
                fullWidth
                value={form.nombre}
                onChange={handleChangeField("nombre")}
                helperText="Nombre descriptivo del concepto."
              />
            </Stack>

            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={2}
              value={form.descripcion}
              onChange={handleChangeField("descripcion")}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Tipo"
                fullWidth
                value={form.tipo}
                onChange={handleChangeField("tipo")}
                helperText="Cómo impacta por defecto en los asientos."
              >
                <MenuItem value="cargo">Cargo (débito)</MenuItem>
                <MenuItem value="abono">Abono (crédito)</MenuItem>
                <MenuItem value="mixto">Mixto / variable</MenuItem>
              </TextField>

              <TextField
                label="Importe base"
                fullWidth
                value={form.importeBase}
                onChange={handleChangeField("importeBase")}
                placeholder="Ej: 15000"
                helperText="Opcional. Se puede dejar en blanco."
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={form.activo}
                  onChange={handleChangeField("activo")}
                />
              }
              label="Ítem activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {editing ? "Guardar cambios" : "Crear ítem"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
