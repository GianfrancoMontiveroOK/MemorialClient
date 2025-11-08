// src/components/admin/sectionsAdminPanel/ClientsTable.jsx
import * as React from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Stack,
  TextField,
  MenuItem,
  Pagination,
  Box,
  Button,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { fmtMoney, fmtDateTime, StatusChip } from "./utils";

/**
 * Props:
 * - items, total, page, setPage, limit, setLimit, loading, totalPages, onReload
 * - onExportCSV?: función opcional para exportar TODO (full=1 en backend)
 *   Si no se provee, exporta solo los items visibles.
 * - exportFileName?: nombre opcional del archivo CSV local
 */
export default function ClientsTable({
  items,
  total,
  page,
  setPage,
  limit,
  setLimit,
  loading,
  totalPages,
  onReload,
  onExportCSV, // ⬅️ opcional: export masivo
  exportFileName, // ⬅️ opcional: nombre de archivo local
}) {
  const exportLocalCSV = React.useCallback(() => {
    const rows = [
      [
        "ID Cliente",
        "Nombre",
        "Domicilio",
        "Ciudad",
        "Teléfono",
        "Cuota vigente",
        "Estado (current)",
        "Meses en mora",
        "Integrantes",
        "Actualizado",
      ],
      ...(Array.isArray(items) ? items : []).map((c) => [
        c.idCliente ?? "",
        c.nombre ?? "",
        c.domicilio ?? "",
        c.ciudad ?? "",
        c.telefono ?? "",
        Number(c.cuotaVigente || 0),
        c?.billing?.current === true
          ? "al_dia"
          : c?.billing?.current === false
          ? "en_mora"
          : "",
        Number(c?.billing?.arrearsCount ?? 0),
        Number(c.integrantesCount || 0),
        c.updatedAtMax || c.updatedAt || c.createdAt
          ? new Date(c.updatedAtMax || c.updatedAt || c.createdAt).toISOString()
          : "",
      ]),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name =
      exportFileName ||
      `clientes_cobrador_p${page + 1}_l${limit}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [items, page, limit, exportFileName]);

  const handleExport = () => {
    if (typeof onExportCSV === "function") {
      onExportCSV(); // export masivo (full=1)
    } else {
      exportLocalCSV(); // export de lo visible
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      {/* Toolbar superior */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ p: 1.25, pb: 0 }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {Number(total || 0).toLocaleString("es-AR")} clientes
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={onReload}
            disabled={loading}
          >
            Refrescar
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleExport}
            // antes: disabled={loading || !(items && items.length)}
            disabled={loading || (!onExportCSV && !(items && items.length))}
          >
            Exportar CSV
          </Button>
        </Stack>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Domicilio</TableCell>
            <TableCell>Ciudad</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell align="right">Cuota vigente</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Integrantes</TableCell>
            <TableCell>Actualizado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!items || items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Box py={3} textAlign="center" color="text.secondary">
                  {loading ? "Cargando…" : "Sin clientes"}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => (
              <TableRow key={`${c.idCliente}-${c._id}`}>
                <TableCell>{c.idCliente ?? "—"}</TableCell>
                <TableCell>{c.nombre ?? "—"}</TableCell>
                <TableCell>{c.domicilio ?? "—"}</TableCell>
                <TableCell>{c.ciudad ?? "—"}</TableCell>
                <TableCell>{c.telefono ?? "—"}</TableCell>
                <TableCell align="right">
                  {fmtMoney(c.cuotaVigente || 0)}
                </TableCell>
                <TableCell>
                  <StatusChip
                    current={c.billing?.current}
                    arrearsCount={c.billing?.arrearsCount}
                  />
                </TableCell>
                <TableCell align="right">
                  {Number(c.integrantesCount || 0)}
                </TableCell>
                <TableCell>
                  {fmtDateTime(c.updatedAtMax || c.updatedAt || c.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Divider />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ p: 1.25 }}
      >
        <TextField
          label="Filas"
          size="small"
          select
          value={limit}
          onChange={(e) => {
            const v = Number(e.target.value) || 10;
            setLimit(v);
            setPage(0);
            onReload?.();
          }}
          sx={{ width: 110 }}
          disabled={loading}
        >
          {[10, 25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>

        <Pagination
          color="primary"
          page={page + 1}
          count={totalPages}
          onChange={(_, p1) => {
            setPage(p1 - 1);
            setTimeout(() => onReload?.(), 0);
          }}
        />
      </Stack>
    </Paper>
  );
}
