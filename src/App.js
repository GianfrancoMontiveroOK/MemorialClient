// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";

// ✅ Providers globales desde el barrel de /contexts
import { AuthProvider, DashboardProvider } from "../src/context/index";

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
import { ClientsProvider } from "./context";
// ABM clientes (también fuera del dashboard)
import ClienteForm from "./components/ClienteForm";
import ClientsTableMemorial from "./components/ClientsTableMemorial";
import ClienteDetalle from "./pages/ClienteDetalle";

const theme = getTheme("light");

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <ClientsProvider>
            <HashRouter>
              <Navbar />

              <Routes>
                {/* Públicas */}
                <Route path="/" element={<HomePage />} />
                <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Privadas */}
                <Route element={<ProtectedRoute />}>
                  {/* Dashboard (cada panel arma sus propios contextos internamente) */}
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* ABM Clientes */}
                  <Route
                    path="/app/clientes"
                    element={<ClientsTableMemorial />}
                  />
                  <Route path="/app/clientes/nuevo" element={<ClienteForm />} />
                  <Route
                    path="/app/clientes/:id/editar"
                    element={<ClienteForm />}
                  />
                  <Route
                    path="/app/clientes/:id"
                    element={<ClienteDetalle />}
                  />
                </Route>
              </Routes>
            </HashRouter>
          </ClientsProvider>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
