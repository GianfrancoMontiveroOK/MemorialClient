// src/components/AdminSidebar.jsx
import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

// NUEVOS (transacciones/admin)
import SyncAltIcon from "@mui/icons-material/SyncAlt"; // Transacciones (lista)
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // Diario (asientos)
import OutboxIcon from "@mui/icons-material/Outbox"; // Outbox (eventos a ERP)
import PolicyIcon from "@mui/icons-material/Policy"; // Auditoría
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded"; // Arqueos

// 🔹 Icono para Recibos
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export const DRAWER_WIDTH = 240;

/**
 * Mantenemos todas las secciones disponibles aquí.
 * Los contenedores pueden filtrar con `filterKeys` para mostrar sólo algunas.
 */
export const SECTIONS = [
  { key: "clientes", label: "CLIENTES", icon: <PeopleAltIcon /> },

  // 🔹 Recibos (PDF/WhatsApp)
  { key: "recibos", label: "RECIBOS", icon: <PictureAsPdfIcon /> },

  // 🔹 Infra de backoffice
  { key: "transacciones", label: "TRANSACCIONES", icon: <SyncAltIcon /> },
  { key: "diario", label: "DIARIO", icon: <AccountBalanceIcon /> },

  // 🔹 NUEVO: Arqueos (caja por usuario)
  {
    key: "arqueos",
    label: "ARQUEOS",
    icon: <AccountBalanceWalletRoundedIcon />,
  },

  { key: "outbox", label: "OUTBOX", icon: <OutboxIcon /> },
  { key: "auditoria", label: "AUDITORÍA", icon: <PolicyIcon /> },

  { key: "usuarios", label: "USUARIOS", icon: <PersonOutlineIcon /> },
];

/**
 * AdminSidebar
 *
 * Props:
 * - section: string (key activa)
 * - onChange(key): callback al seleccionar
 * - filterKeys?: string[]  -> si se pasa, sólo renderiza las keys incluidas
 * - title?: string         -> título del panel (default: "Admin")
 * - subtitle?: string      -> subtítulo (default: "Panel de control")
 */
export default function AdminSidebar({
  section,
  onChange,
  filterKeys,
  title = "Admin",
  subtitle = "Panel de control",
}) {
  // Si se provee filterKeys, filtramos; si no, todas
  const items = Array.isArray(filterKeys)
    ? SECTIONS.filter((s) => filterKeys.includes(s.key))
    : SECTIONS;

  return (
    <Box sx={{ width: DRAWER_WIDTH, p: 1 }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      <Divider sx={{ mb: 0.5 }} />

      <List dense>
        {items.map((s) => {
          const selected = s.key === section;
          return (
            <ListItemButton
              key={s.key}
              selected={selected}
              onClick={() => onChange?.(s.key)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{s.icon}</ListItemIcon>
              <ListItemText
                primary={s.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
