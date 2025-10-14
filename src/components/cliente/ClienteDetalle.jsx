import React from "react";
import {
  Box, Paper, Stack, Typography, Button, Skeleton,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
} from "@mui/material";
import { fmtMoney } from "../ui";

export default function ClienteFamily({
  item,
  titular,
  integrantes,
  famLoading,
  onAddIntegrante,
  onView,
  onEdit,
}) {
  const cuota = Number(titular?.cuota);
  const ideal = Number(titular?.cuotaIdeal);
  const showDev = Number.isFinite(cuota) && Number.isFinite(ideal);
  const desvio = showDev ? cuota - ideal : null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700}>Grupo familiar</Typography>
        <Button size="small" variant="contained" onClick={onAddIntegrante}>
          Agregar integrante
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1.5, bgcolor: (t) =>
        t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        {famLoading && !integrantes?.length && !titular ? (
          <Skeleton variant="rounded" height={64} />
        ) : titular ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Chip size="small" label="Titular" color="secondary" />
              <Typography variant="body1" fontWeight={700}>
                {titular?.nombre ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DNI: {titular?.documento ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Edad: {typeof titular?.edad === "number" ? titular.edad : "—"}
              </Typography>

              <Typography variant="body2" color="text.primary" fontWeight={600}>
                Cuota: {fmtMoney(titular?.cuota)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ideal: {Number.isFinite(ideal) ? fmtMoney(ideal) : "—"}
              </Typography>
              {showDev && (
                <Chip
                  size="small"
                  label={`Desvío ${desvio >= 0 ? "+" : ""}${fmtMoney(desvio)}`}
                  color={desvio > 0 ? "error" : desvio < 0 ? "success" : "default"}
                  variant="outlined"
                />
              )}

              {(titular?.grupoFamiliar || titular?.cremaciones != null || titular?.edadMaxPoliza != null) && (
                <Typography variant="body2" color="text.secondary">
                  {[
                    titular?.grupoFamiliar ? `GF: ${titular.grupoFamiliar}` : null,
                    titular?.cremaciones != null ? `Cremaciones: ${titular.cremaciones}` : null,
                    titular?.edadMaxPoliza != null ? `Edad máx.: ${titular.edadMaxPoliza}` : null,
                  ].filter(Boolean).join(" • ")}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={() => onView(titular._id)}>
                Ver titular
              </Button>
              <Button size="small" variant="outlined" onClick={() => onEdit(titular._id)}>
                Editar titular
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">Sin titular identificado.</Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        {famLoading && !integrantes?.length ? (
          <Skeleton variant="rounded" height={140} />
        ) : integrantes?.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell align="right">Edad</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {integrantes
                .slice()
                .sort((a, b) => (a?.nombre || "").localeCompare(b?.nombre || ""))
                .map((m) => (
                  <TableRow key={m._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {m?.rol && <Chip size="small" label={m.rol} variant="outlined" />}
                        <span>{m?.nombre ?? "—"}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>{m?.documento ?? "—"}</TableCell>
                    <TableCell align="right">
                      {typeof m?.edad === "number" ? m.edad : "—"}
                    </TableCell>
                    <TableCell align="center">
                      {m?.activo ? (
                        <Chip size="small" label="Activo" color="success" />
                      ) : (
                        <Chip size="small" label="Baja" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button size="small" onClick={() => onView(m._id)}>Ver</Button>
                        <Button size="small" variant="outlined" onClick={() => onEdit(m._id)}>
                          Editar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              Este grupo no tiene integrantes cargados.
            </Typography>
            <Button size="small" variant="contained" onClick={onAddIntegrante}>
              Agregar integrante
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
