// src/components/AdminSidebar.jsx
import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

// NUEVOS (transacciones/admin)
import SyncAltIcon from "@mui/icons-material/SyncAlt"; // Transacciones (lista)
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // Diario (asientos)
import OutboxIcon from "@mui/icons-material/Outbox"; // Outbox (eventos a ERP)
import PolicyIcon from "@mui/icons-material/Policy"; // Auditoría

// 🔹 Icono para Recibos
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// 🔹 Icono para Arqueos
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";

// 🔹 Icono para Ítems (catálogo / conceptos)
import Inventory2Icon from "@mui/icons-material/Inventory2";

export const DRAWER_WIDTH = 240;

// Nota: mantenemos claves existentes y agregamos nuevas.
// Usá estas keys en tu contenedor para mostrar la vista correspondiente.
export const SECTIONS = [
  { key: "clientes", label: "CLIENTES", icon: <PeopleAltIcon /> },

  // 🔹 Nuevo: ABM de ítems (conceptos / productos / servicios)
  { key: "items", label: "ITEMS", icon: <Inventory2Icon /> },

  // 🔹 Nuevo: Recibos (lista de recibos con PDF/WhatsApp)
  { key: "recibos", label: "RECIBOS", icon: <PictureAsPdfIcon /> },

  // 🔹 Arqueos (cajas por usuario, cortes)
  { key: "arqueos", label: "ARQUEOS", icon: <ContentCutRoundedIcon /> },

  // 🔹 Apoyados por el TransactionsContext y los endpoints admin
  { key: "transacciones", label: "TRANSACCIONES", icon: <SyncAltIcon /> },
  { key: "diario", label: "DIARIO", icon: <AccountBalanceIcon /> },
  { key: "outbox", label: "OUTBOX", icon: <OutboxIcon /> },
  { key: "auditoria", label: "AUDITORÍA", icon: <PolicyIcon /> },

  { key: "usuarios", label: "USUARIOS", icon: <PersonOutlineIcon /> },
  { key: "estadisticas", label: "ESTADÍSTICAS", icon: <InsightsIcon /> },
  { key: "settings", label: "CONFIGURACIÓN", icon: <SettingsOutlinedIcon /> },
];

export default function AdminSidebar({ section, onChange }) {
  return (
    <Box sx={{ width: DRAWER_WIDTH, p: 1 }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          SuperAdmin
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Panel de control
        </Typography>
      </Box>

      <List dense>
        {SECTIONS.map((s) => {
          const selected = s.key === section;
          return (
            <ListItemButton
              key={s.key}
              selected={selected}
              onClick={() => onChange?.(s.key)}
              sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
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
