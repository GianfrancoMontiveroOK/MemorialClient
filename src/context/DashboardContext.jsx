// src/context/DashboardContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getDashboardData,
  getAdminStats,
  getCollectorStats,
} from "../api/dashboard";
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

  const [data, setData] = useState(null);
  const [role, setRole] = useState(user?.role ?? null);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState(null);

  const hasRole = useCallback(
    (roles) => {
      const currentRole = (role || user?.role || "").toString();
      if (!currentRole) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(currentRole);
    },
    [role, user]
  );

  const normalizePayload = useCallback(
    (res) => {
      const base = res?.data ?? res ?? {};
      const normalizedRole = base?.role ?? user?.role ?? role ?? null;
      const normalizedData = base?.data ?? base ?? null;
      return { role: normalizedRole, data: normalizedData };
    },
    [role, user]
  );

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      let res;
      if (hasRole("superAdmin")) {
        res = await getDashboardData();
      } else if (hasRole("admin")) {
        res = await getAdminStats();
      } else if (hasRole("cobrador")) {
        res = await getCollectorStats();
      } else {
        throw new Error("Rol no autorizado");
      }

      const { role: apiRole, data: apiData } = normalizePayload(res);
      setRole(apiRole ?? null);
      setData(apiData ?? null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al cargar el dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasRole, normalizePayload]);

  useEffect(() => {
    if (autoLoad) fetchDashboard();
  }, [autoLoad, fetchDashboard]);

  // ====== Clientes desde el payload del dashboard ======
  const fetchClients = useCallback(async (params = {}) => {
    const {
      page = 0,
      pageSize = 10,
      sortBy = "idCliente", // 👈 CAMBIO HECHO AQUÍ
      sortDir = "asc",
      query = "",
    } = params;

    const res = await getDashboardData({
      params: {
        page: page + 1, // la API usa 1-based
        limit: pageSize,
        sortBy,
        sortDir,
        q: query,
      },
    });

    const clientes = res?.data?.data?.clientes ?? {};
    console.log(clientes);
    return {
      items: clientes.items || [],
      total: clientes.total || 0,
    };
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        role,
        data,
        loading,
        error,
        hasRole,
        refresh: fetchDashboard,
        fetchClients,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
