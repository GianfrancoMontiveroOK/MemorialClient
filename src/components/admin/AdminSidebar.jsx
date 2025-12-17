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
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import OutboxIcon from "@mui/icons-material/Outbox";
import PolicyIcon from "@mui/icons-material/Policy";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import Inventory2Icon from "@mui/icons-material/Inventory2";

export const DRAWER_WIDTH = 240;

export const SECTIONS = [
  { key: "clientes", label: "CLIENTES", icon: <PeopleAltIcon /> },
  { key: "items", label: "ITEMS", icon: <Inventory2Icon /> },
  { key: "recibos", label: "RECIBOS", icon: <PictureAsPdfIcon /> },
  { key: "arqueos", label: "ARQUEOS", icon: <ContentCutRoundedIcon /> },
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
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >

      <Box sx={{ px: 2, pb: 1.5 }}>
        <Typography variant="h6" fontWeight={800}>
         SuperAdmin
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Panel de control
        </Typography>
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      <List
        dense
        sx={{
          px: 1,
          pb: 1,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {SECTIONS.map((s) => {
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
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{s.icon}</ListItemIcon>
              <ListItemText
                primary={s.label}
                primaryTypographyProps={{
                  fontWeight: selected ? 800 : 600,
                  letterSpacing: 0.3,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
