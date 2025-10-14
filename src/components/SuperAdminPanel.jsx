import React from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Toolbar,
  Drawer,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UsersContext";
import { useDashboard } from "../context/DashboardContext";

import AdminSidebar, { SECTIONS, DRAWER_WIDTH } from "./admin/AdminSidebar";

// Secciones
import ResumenSection from "./admin/sections/ResumenSection";
import ClientesSection from "./admin/sections/ClientesSection";
import PagosSection from "./admin/sections/PagosSection";
import UsuariosSection from "./admin/sections/UsuariosSection";
import EstadisticasSection from "./admin/sections/EstadisticasSection";
// NUEVO: Settings en página
import SettingsSection from "./admin/sections/SettingsSection";

export default function SuperAdminPanel() {
  const {
    data,
    loading: loadingDashboard,
    error,
    refresh,
    fetchClients,
    deleteClient,
  } = useDashboard();
  const {
    items,
    total,
    page,
    limit,
    loading: loadingUsers,
    fetchUsers,
    changeRole,
    assignCobrador,
    assignVendedor,
    setSelected,
  } = useUsers();

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [section, setSection] = React.useState("clientes");

  const toggleDrawer = () => setMobileOpen((v) => !v);

  if (loadingDashboard) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="40vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="error" gutterBottom>
          {" "}
          Error al cargar datos{" "}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {String(error)}
        </Typography>
      </Box>
    );
  }

  const payload = data?.data ? data.data : data || {};
  const resumen = payload?.resumen || {};
  const recientes = payload?.recientes || {};
  const ultimosPagos = Array.isArray(recientes?.ultimosPagos)
    ? recientes.ultimosPagos
    : [];
  const ultimosUsuarios = Array.isArray(recientes?.ultimosUsuarios)
    ? recientes.ultimosUsuarios
    : [];

  return (
    <Box sx={{ display: "flex" }}>
      {/* NAV */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar />
          <AdminSidebar
            section={section}
            onChange={(s) => {
              setSection(s);
              setMobileOpen(false);
            }}
          />
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
          <AdminSidebar section={section} onChange={setSection} />
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
        {/* Top (mobile) */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            mb: 2,
          }}
        >
          <IconButton onClick={toggleDrawer} sx={{ mr: 1 }}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>
            {SECTIONS.find((s) => s.key === section)?.label || "Panel"}
          </Typography>
        </Box>

       

        {/* Secciones */}
        {section === "resumen" && (
          <ResumenSection
            resumen={resumen}
            ultimosPagos={ultimosPagos}
            ultimosUsuarios={ultimosUsuarios}
          />
        )}

        {section === "clientes" && (
          <ClientesSection
            fetchClients={fetchClients}
            onView={(row) => navigate(`/app/clientes/${row._id}`)}
            onEdit={(row) => navigate(`/app/clientes/${row._id}/editar`)}
            onAssign={(row) => navigate(`/app/clientes/${row._id}/asignar`)}
            onDelete={async (row) => {
              if (!window.confirm(`Eliminar cliente ${row.name}?`)) return;
              try {
                await deleteClient(row._id);
                alert("Cliente eliminado. Refrescá la tabla.");
              } catch (e) {
                const msg =
                  e?.response?.data?.message ||
                  e?.message ||
                  "No se pudo eliminar";
                alert(msg);
              }
            }}
          />
        )}

        {section === "pagos" && <PagosSection />}

        {section === "usuarios" && (
          <UsuariosSection
            users={items}
            loading={loadingUsers}
            page={page}
            total={total}
            limit={limit}
            onPageChange={(p) => fetchUsers({ page: p })}
            onSearch={({ id, email }) =>
              fetchUsers({ page: 1, id, email, q: "" })
            }
            onSelectUser={(u) => setSelected(u)}
            onChangeRole={(id, role) => changeRole(id, role)}
            onAssignCobrador={(id, idCobrador) =>
              assignCobrador(id, idCobrador)
            }
            onAssignVendedor={(id, idVendedor) =>
              assignVendedor(id, idVendedor)
            }
          />
        )}

        {section === "estadisticas" && <EstadisticasSection />}

        {/* NUEVO: Settings como sección */}
        {section === "settings" && <SettingsSection />}
      </Box>
    </Box>
  );
}
