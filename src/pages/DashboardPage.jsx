// src/pages/DashboardPage.jsx
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  useAuth,
  useDashboard,
  SettingsProvider,
  ClientsProvider,
  UsersProvider,
  TransactionsProvider,
  ReceiptsProvider,
  CollectorProvider,
} from "../context";

// Panels (ajustá rutas si tus archivos están en otra carpeta)
import AdminPanel from "../components/AdminPanel";
import SuperAdminPanel from "../components/SuperAdminPanel";
import CollectorPanel from "../components/CollectorPanel";
 
export default function DashboardPage() {
  // Estos vienen dados por los providers globales que ya montás en App.jsx (AuthProvider + DashboardProvider)
  const { user } = useAuth();
  const { data, loading, error, hasRole } = useDashboard();

  if (loading) {
    return (
      <Box p={3} display="flex" alignItems="center" gap={2}>
        <CircularProgress size={22} />
        <Typography variant="body2">Cargando dashboard…</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {String(error)}</Typography>
      </Box>
    );
  }
  if (!user) {
    return (
      <Box p={3}>
        <Typography>Autenticando…</Typography>
      </Box>
    );
  }

  // Contenido por rol (se renderizan los que apliquen)
  const content = (
    <>
      {hasRole("superAdmin") && <SuperAdminPanel data={data} />}
      {hasRole("admin") && <AdminPanel data={data} />}
      {hasRole("cobrador") && <CollectorPanel />}
    </>
  );

  // Si el usuario es cobrador, envolvemos con CollectorProvider
  const maybeWithCollector = hasRole("cobrador") ? (
    <CollectorProvider>{content}</CollectorProvider>
  ) : (
    content
  );

  // Montamos los contextos que usan las secciones del panel (configs, abm clientes, usuarios,
  // transacciones e infraestructura de recibos). Así SuperAdminPanel/AdminPanel/CollectorPanel
  // no necesitan montar providers propios.
  return (
    <SettingsProvider>
      <ClientsProvider>
        <UsersProvider>
          <TransactionsProvider>
            <ReceiptsProvider>{maybeWithCollector}</ReceiptsProvider>
          </TransactionsProvider>
        </UsersProvider>
      </ClientsProvider>
    </SettingsProvider>
  );
}
