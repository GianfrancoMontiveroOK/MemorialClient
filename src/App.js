// src/App.jsx
import React, { useMemo, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";

import {
  AuthProvider,
  DashboardProvider,
  SettingsProvider,
  ClientsProvider,
  CollectorProvider,
} from "./context";

import { useAuth } from "./context/AuthContext"; // ✅

import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; 
import ProtectedRoute from "./ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";

import DashboardPage from "./pages/DashboardPage";

import ClienteForm from "./components/ClienteForm";
import ClientsTableMemorial from "./components/ClientsTableMemorial";
import ClienteDetalle from "./pages/ClienteDetalle";

import CollectorClientsTable from "./components/CollectorClientsTable";
import CollectorClientDetail from "./pages/CollectorClientDetail";

function CollectorScope() {
  return (
    <CollectorProvider>
      <Outlet />
    </CollectorProvider>
  );
}

/* ✅ Wrapper para poder usar useAuth dentro de AuthProvider */
function AppInner() {
  const { user, isAuthenticated, setMyPreferences } = useAuth();

  const [mode, setMode] = useState(() => {
    const ls = localStorage.getItem("themeMode");
    return ls === "light" || ls === "dark" ? ls : "dark";
  });

  // ✅ cuando llega el user, sincronizamos modo desde backend
  useEffect(() => {
    const m = user?.ui?.themeMode;
    if (m === "light" || m === "dark") {
      setMode(m);
      localStorage.setItem("themeMode", m);
    }
  }, [user]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = async () => {
    const next = mode === "dark" ? "light" : "dark";

    // 1) UI inmediata
    setMode(next);
    localStorage.setItem("themeMode", next);

    // 2) persistir en backend si está logueado
    if (isAuthenticated && typeof setMyPreferences === "function") {
      await setMyPreferences({ themeMode: next });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <DashboardProvider>
        <HashRouter>
          <Navbar mode={mode} onToggleTheme={toggleTheme} />

          <Routes>
            {/* ===== Públicas ===== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ===== Privadas ===== */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
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

          <Footer />
        </HashRouter>
      </DashboardProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
