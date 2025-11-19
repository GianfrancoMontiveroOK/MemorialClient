// src/components/SuperAdminPanel.jsx
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

// Sidebar
import AdminSidebar, {
  SECTIONS,
  DRAWER_WIDTH,
} from "../components/admin/AdminSidebar";

// Secciones existentes
import ClientesSection from "./admin/sections/ClientesSection";
import UsuariosSection from "./admin/sections/UsuariosSection";
import EstadisticasSection from "./admin/sections/EstadisticasSection";
import SettingsSection from "./admin/sections/SettingsSection";
import TransactionsSection from "./admin/sections/TransactionsSection";
import LedgerSection from "./admin/sections/LedgerSection";
import OutboxSection from "./admin/sections/OutboxSection";
import AuditSection from "./admin/sections/AuditSection";
import ReceiptsSection from "./admin/sections/ReceiptsSection";

// ⬇️ ARQUEOS + DETALLE
import ArqueosSection from "./admin/sections/ArqueosSection";
import CollectorDetailSection from "./admin/sections/CollectorDetailSection"; // <- verifica esta ruta

// ⬇️ NUEVO: ABM de Ítems
import ItemsSection from "./admin/sections/ItemsSection";

// Claves visibles en sidebar
const ALLOWED_KEYS = [
  "clientes",
  "items", // ⬅️ NUEVO
  "transacciones",
  "diario",
  "outbox",
  "recibos",
  "usuarios",
  "auditoria",
  "estadisticas",
  "settings",
  "arqueos",
];

// Claves internas (no aparecen en sidebar)
const INTERNAL_KEYS = ["collector-detail"];

const FIRST_ALLOWED = "clientes";
const sanitizeSection = (key) =>
  ALLOWED_KEYS.includes(key) || INTERNAL_KEYS.includes(key)
    ? key
    : FIRST_ALLOWED;

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
  const [section, setSection] = React.useState(FIRST_ALLOWED);

  // === Estado para drilldown de Arqueos ===
  const [selectedCollector, setSelectedCollector] = React.useState(null);
  const [detailFilters, setDetailFilters] = React.useState({
    dateFrom: "",
    dateTo: "",
  });

  const toggleDrawer = () => setMobileOpen((v) => !v);

  React.useEffect(() => {
    setSection((prev) => sanitizeSection(prev));
  }, []);

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
          Error al cargar datos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {String(error)}
        </Typography>
      </Box>
    );
  }

  const payload = data?.data ? data.data : data || {};
  const resumen = payload?.resumen || {};

  // Label actual (incluye sección interna)
  const currentLabel =
    SECTIONS.find((s) => s.key === section)?.label ||
    (section === "collector-detail" ? "Detalle del cobrador" : "Panel");

  // Handler que recibe ArqueosSection
  const openCollectorDetail = ({ user, dateFrom, dateTo }) => {
    setSelectedCollector(user || null);
    setDetailFilters({
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    });
    setSection("collector-detail");
  };

  const goBackFromDetail = () => {
    setSection("arqueos");
    // si querés limpiar la selección al volver:
    // setSelectedCollector(null);
  };

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
              setSection(sanitizeSection(s));
              setMobileOpen(false);
            }}
            // opcional: si tu Sidebar acepta filtro de claves visibles
            filterKeys={ALLOWED_KEYS}
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
          <AdminSidebar
            section={section}
            onChange={(s) => setSection(sanitizeSection(s))}
            filterKeys={ALLOWED_KEYS}
          />
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
            {currentLabel}
          </Typography>
        </Box>

        {/* Secciones visibles */}
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

        {/* NUEVO: ABM de Ítems */}
        {section === "items" && <ItemsSection />}

        {section === "transacciones" && <TransactionsSection />}
        {section === "diario" && <LedgerSection />}
        {section === "outbox" && <OutboxSection />}
        {section === "auditoria" && <AuditSection />}

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
        {section === "settings" && <SettingsSection />}
        {section === "recibos" && <ReceiptsSection />}

        {/* ARQUEOS listado */}
        {section === "arqueos" && (
          <ArqueosSection onOpenCollectorDetail={openCollectorDetail} />
        )}

        {/* Sección interna (no en sidebar): Detalle de cobrador/admin */}
        {section === "collector-detail" && (
          <CollectorDetailSection
            user={selectedCollector}
            defaultDateFrom={detailFilters.dateFrom}
            defaultDateTo={detailFilters.dateTo}
            onBack={goBackFromDetail}
          />
        )}
      </Box>
    </Box>
  );
}
