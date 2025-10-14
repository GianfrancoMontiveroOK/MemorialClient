import React from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export const DRAWER_WIDTH = 240;

export const SECTIONS = [
  { key: "resumen", label: "Resumen", icon: <DashboardIcon /> },
  { key: "clientes", label: "Clientes", icon: <PeopleAltIcon /> },
  { key: "pagos", label: "Pagos", icon: <ReceiptLongIcon /> },
  { key: "usuarios", label: "Usuarios", icon: <PersonOutlineIcon /> },
  { key: "estadisticas", label: "Estadísticas", icon: <InsightsIcon /> },
  // NUEVO:
  { key: "settings", label: "Settings de precios", icon: <SettingsOutlinedIcon /> },
];

export default function AdminSidebar({ section, onChange }) {
  return (
    <Box sx={{ width: DRAWER_WIDTH, p: 1 }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>SuperAdmin</Typography>
        <Typography variant="caption" color="text.secondary">Panel de control</Typography>
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
