// src/context/DashboardContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDashboardAccess } from "../api/dashboard";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext();

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
};

export const DashboardProvider = ({ children, autoLoad = true }) => {
  const { user, isAuthenticated } = useAuth();

  const [role, setRole] = useState(user?.role ?? null);
  const [flags, setFlags] = useState({
    isSuperAdmin: false,
    isAdmin: false,
    isCollector: false,
  });
  const [data, setData] = useState(null); // compat
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState(null);

  /** Comparación de rol case-insensitive */
  const hasRole = useCallback(
    (roles) => {
      const current = String(role || user?.role || "").toLowerCase();
      if (!current) return false;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.map((r) => String(r).toLowerCase()).includes(current);
    },
    [role, user]
  );

  /** Carga única: sólo valida acceso y setea role/flags */
  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardAccess();
      const r = String(res?.data?.role || "").toLowerCase();
      const f = res?.data?.flags || {};
      setRole(r || null);
      setFlags({
        isSuperAdmin: !!f.isSuperAdmin,
        isAdmin: !!f.isAdmin,
        isCollector: !!f.isCollector,
      });
      setData(null); // sin payload pesado aquí
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al validar acceso";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (autoLoad) fetchDashboard();
  }, [autoLoad, fetchDashboard]);

  /** Stub de compatibilidad: devuelve vacío (puedes removerlo cuando no se use) */
  const fetchClients = useCallback(async () => {
    return { items: [], total: 0 };
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        role,
        flags,
        data, // compat
        loading,
        error,
        hasRole,
        refresh: fetchDashboard,
        fetchClients, // compat
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
