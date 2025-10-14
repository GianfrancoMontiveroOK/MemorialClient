import React from "react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PaymentsIcon from "@mui/icons-material/Payments";
import DashboardIcon from "@mui/icons-material/Dashboard";

const DRAWER_WIDTH = 240;

const SECTIONS = [
  { key: "resumen", label: "Resumen", icon: <DashboardIcon /> },
  { key: "clientes", label: "Mis clientes", icon: <PeopleAltIcon /> },
  { key: "cobros", label: "Cobros", icon: <PaymentsIcon /> },
];

export default function CollectorLayout({ section, onChangeSection, children, title = "Cobrador" }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, p: 1 }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Panel de gestión
        </Typography>
      </Box>
      <List dense>
        {SECTIONS.map((s) => {
          const selected = s.key === section;
          return (
            <ListItemButton
              key={s.key}
              selected={selected}
              onClick={() => {
                onChangeSection?.(s.key);
                if (!isMdUp) setMobileOpen(false);
              }}
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

  return (
    <Box sx={{ display: "flex" }}>
      {/* NAV */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }} aria-label="sidebar">
        {/* Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
        {/* Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              mt: `76px`,
            },
          }}
          open
        >
          <Toolbar />
          {drawer}
        </Drawer>
      </Box>

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Top actions (solo mobile) */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", mb: 2 }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            {SECTIONS.find((s) => s.key === section)?.label || "Panel"}
          </Typography>
        </Box>

        {children}
      </Box>
    </Box>
  );
}
