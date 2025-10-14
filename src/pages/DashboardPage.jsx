// src/pages/DashboardHome.jsx
import React from "react";
import {
  useDashboard,
  useAuth,
  ClientsProvider,
  UsersProvider,
  CollectorProvider,
  SettingsProvider, // ← NUEVO
} from "../context";

// Panels
import AdminPanel from "../components/AdminPanel";
import SuperAdminPanel from "../components/SuperAdminPanel";
import CollectorPanel from "../components/CollectorPanel";
// import { createCollectorPayment } from "../api/collector"; // cuando implementes pagos reales

export default function DashboardHome() {
  const { data, loading, error, hasRole } = useDashboard();
  const { user } = useAuth();

  if (loading) return <p>Cargando…</p>;
  if (error) return <p>Error: {String(error)}</p>;
  if (!user) return <p>Cargando usuario…</p>; // defensa suave

  const collectorId = user?.idCobrador ?? null;

  return (
    <div>
      {/* SUPER ADMIN */}
      {hasRole("superAdmin") && (
        <SettingsProvider>
          <ClientsProvider>
            <UsersProvider>
              <SuperAdminPanel data={data} />
            </UsersProvider>
          </ClientsProvider>
        </SettingsProvider>
      )}

      {/* ADMIN */}
      {hasRole("admin") && (
        <ClientsProvider>
          <UsersProvider>
            <AdminPanel data={data} />
          </UsersProvider>
        </ClientsProvider>
      )}

      {/* COBRADOR */}
      {hasRole("cobrador") && (
        <CollectorProvider
          collectorId={collectorId}
          // createPaymentFn={createCollectorPayment}
        >
          <CollectorPanel />
        </CollectorProvider>
      )}
    </div>
  );
}
