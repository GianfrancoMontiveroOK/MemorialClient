// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";

// Providers globales mínimos (quedan global Auth + Dashboard)
import {
  AuthProvider,
  DashboardProvider,
  SettingsProvider,
  ClientsProvider,
  CollectorProvider, // ⬅️ lo vamos a usar en CollectorScope
} from "./context";

// Layout / guard
import Navbar from "./components/Navbar";
import ProtectedRoute from "./ProtectedRoute";

// Rutas públicas
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";

// Rutas privadas
import DashboardPage from "./pages/DashboardPage";

// ABM clientes
import ClienteForm from "./components/ClienteForm";
import ClientsTableMemorial from "./components/ClientsTableMemorial";
import ClienteDetalle from "./pages/ClienteDetalle";

// Collector
import CollectorClientsTable from "./components/CollectorClientsTable";
import CollectorClientDetail from "./pages/CollectorClientDetail";

const theme = getTheme("light");

// ⬇️ Scope específico para las pantallas de cobrador
// Envuelve todas las rutas hijas con CollectorProvider.
function CollectorScope() {
  return (
    <CollectorProvider>
      <Outlet />
    </CollectorProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <HashRouter>
            <Navbar />

            <Routes>
              {/* ===== Públicas ===== */}
              <Route path="/" element={<HomePage />} />
              <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ===== Privadas ===== */}
              <Route element={<ProtectedRoute />}>
                {/* === Dashboard ===
                    👉 Todos los contextos de admin/transactions/receipts/collector
                    se montan DENTRO de DashboardPage.jsx */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* === ABM Clientes (ligero) === */}
                <Route
                  path="/app/clientes"
                  element={
                    <SettingsProvider>
                      <ClientsProvider>
                        <ClientsTableMemorial />
                      </ClientsProvider>
                    </SettingsProvider>
                  }
                />
                <Route
                  path="/app/clientes/nuevo"
                  element={
                    <SettingsProvider>
                      <ClientsProvider>
                        <ClienteForm />
                      </ClientsProvider>
                    </SettingsProvider>
                  }
                />
                <Route
                  path="/app/clientes/:id/editar"
                  element={
                    <SettingsProvider>
                      <ClientsProvider>
                        <ClienteForm />
                      </ClientsProvider>
                    </SettingsProvider>
                  }
                />
                <Route
                  path="/app/clientes/:id"
                  element={
                    <SettingsProvider>
                      <ClientsProvider>
                        <ClienteDetalle />
                      </ClientsProvider>
                    </SettingsProvider>
                  }
                />

                {/* === Collector (con su contexto propio) === */}
                <Route element={<CollectorScope />}>
                  <Route
                    path="/app/collector"
                    element={<CollectorClientsTable />}
                  />
                  <Route
                    path="/app/collectorClientDetail/:id"
                    element={<CollectorClientDetail />}
                  />
                </Route>
              </Route>
            </Routes>
          </HashRouter>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
