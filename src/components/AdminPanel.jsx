// src/components/AdminPanel.jsx
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
import { useDashboard } from "../context/DashboardContext";
import { useUsers } from "../context/UsersContext";

// Sidebar y constantes
import AdminSidebar, {
  SECTIONS,
  DRAWER_WIDTH,
} from "./admin/AdminSidebarPanel";

// Secciones habilitadas para Admin (ruta sectionsAdminPanel)
import ResumenSection from "./admin/sectionsAdminPanel/ResumenSection";
import ClientesSection from "./admin/sectionsAdminPanel/ClientesSection";
import EstadisticasSection from "./admin/sectionsAdminPanel/EstadisticasSection";
import TransactionsSection from "./admin/sectionsAdminPanel/TransactionsSection";
import LedgerSection from "./admin/sectionsAdminPanel/LedgerSection";
import OutboxSection from "./admin/sectionsAdminPanel/OutboxSection";
import ReceiptsSection from "./admin/sectionsAdminPanel/ReceiptsSection";
import UsuariosSection from "./admin/sectionsAdminPanel/UsuariosSection";
import AuditSection from "./admin/sectionsAdminPanel/AuditSection";
import ArqueosSection from "./admin/sectionsAdminPanel/ArqueosSection";
import CollectorDetailSection from "./admin/sectionsAdminPanel/CollectorDetailSection"; // ⬅️ detalle interno

// ===== Claves visibles en sidebar =====
const ALLOWED_KEYS = [
  "clientes",
  "transacciones",
  "diario",
  "outbox",
  "recibos",
  "usuarios",
  "auditoria",
  "estadisticas",
  "arqueos",
];

// ===== Claves internas (no aparecen en sidebar) =====
const INTERNAL_KEYS = ["collector-detail"];

const FIRST_ALLOWED = ALLOWED_KEYS[0];
const sanitizeSection = (key) =>
  ALLOWED_KEYS.includes(key) || INTERNAL_KEYS.includes(key)
    ? key
    : FIRST_ALLOWED;

export default function AdminPanel() {
  const { data, loading: loadingDashboard, error } = useDashboard();
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

  // estado para detalle de cobrador
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

  const sidebarProps = {
    section,
    onChange: (s) => setSection(sanitizeSection(s)),
    filterKeys: ALLOWED_KEYS, // solo visibles
    title: "Admin",
    subtitle: "Panel de control",
  };

  const currentLabel =
    SECTIONS.find((s) => s.key === section)?.label ||
    (section === "collector-detail" ? "Detalle del cobrador" : "Panel");

  // handler que recibe ArqueosSection
  const openCollectorDetail = ({ user, dateFrom, dateTo }) => {
    setSelectedCollector(user);
    setDetailFilters({ dateFrom: dateFrom || "", dateTo: dateTo || "" });
    setSection("collector-detail");
  };

  const goBackFromDetail = () => {
    setSection("arqueos");
    // opcional: limpiar selección
    // setSelectedCollector(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* NAV */}
      <Box
        component="nav"
        sx={{
          width: { xs: 0, md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
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
          <AdminSidebar {...sidebarProps} />
        </Drawer>

        {/* Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              mt: `76px`,
            },
          }}
          open
        >
          <Toolbar />
          <AdminSidebar {...sidebarProps} />
        </Drawer>
      </Box>

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: {
            xs: "100%",
            md: `calc(100% - ${DRAWER_WIDTH}px)`,
          },
        }}
      >
        {/* Top (mobile) */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} noWrap>
            {currentLabel}
          </Typography>
        </Box>

        {/* Secciones visibles */}
        {section === "resumen" && <ResumenSection resumen={resumen} />}

        {section === "clientes" && (
          <ClientesSection
            onView={(row) => navigate(`/app/clientes/${row._id}`)}
            onEdit={(row) => navigate(`/app/clientes/${row._id}/editar`)}
            onAssign={(row) => navigate(`/app/clientes/${row._id}/asignar`)}
          />
        )}

        {section === "transacciones" && <TransactionsSection />}
        {section === "diario" && <LedgerSection />}
        {section === "outbox" && <OutboxSection />}
        {section === "recibos" && <ReceiptsSection />}

        {section === "usuarios" && (
          <UsuariosSection
            users={items}
            loading={loadingUsers}
            page={page}
            total={total}
            limit={limit}
            onPageChange={(p) => fetchUsers({ page: p })}
            onSearch={({ id, email, q }) =>
              fetchUsers({ page: 1, id, email, q: q ?? "" })
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

        {section === "auditoria" && <AuditSection />}
        {section === "estadisticas" && <EstadisticasSection />}

        {section === "arqueos" && (
          <ArqueosSection onOpenCollectorDetail={openCollectorDetail} />
        )}

        {/* Sección interna (no en sidebar) */}
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
