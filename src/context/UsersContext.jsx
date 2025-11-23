// src/context/UsersContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  getUsers,
  getRecentUsers,
  getUserById,
  updateUser,
  setUserRole,
  setUserCobrador,
  setUserVendedor,
  setCollectorCommission as apiSetCollectorCommission, // 👈 alias para no pisar el nombre local
  setCollectorCommissionGraceDays as apiSetCollectorCommissionGraceDays, // ⬅️ NUEVO
  setCollectorCommissionPenaltyPerDay as apiSetCollectorCommissionPenaltyPerDay, // ⬅️ NUEVO
} from "../api/users";

const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  // ---- Estado de listado/búsqueda ----
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // filtros
  const [q, setQ] = useState("");
  const [byId, setById] = useState("");
  const [byEmail, setByEmail] = useState("");

  // recientes (p/ “Nuevos usuarios”)
  const [recent, setRecent] = useState([]);

  // selección actual
  const [selected, setSelected] = useState(null);

  // flags
  const [loading, setLoading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ---- Helpers ----
  const normalizeEmail = (s) =>
    typeof s === "string" ? s.trim().toLowerCase() : s;

  const mergeOrAppend = useCallback((list, updated) => {
    const idx = list.findIndex((u) => u._id === updated._id);
    if (idx === -1) return [updated, ...list];
    const next = [...list];
    next[idx] = { ...list[idx], ...updated };
    return next;
  }, []);

  // ---- Fetchers ----
  const fetchUsers = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        q,
        id: byId || undefined,
        email: byEmail || undefined,
        ...opts,
      };

      try {
        const { data } = await getUsers(params);
        setItems(data.items || []);
        setTotal(data.total || 0);

        if (opts.page != null) setPage(Number(opts.page));
        if (opts.limit != null) setLimit(Number(opts.limit));
        if (opts.q !== undefined) setQ(opts.q);
        if (opts.id !== undefined) setById(opts.id);
        if (opts.email !== undefined) setByEmail(opts.email);
      } catch (e) {
        setError(
          e?.response?.data?.message || e.message || "Error al listar usuarios"
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, q, byId, byEmail]
  );

  const fetchRecentUsers = useCallback(async (opts = {}) => {
    setLoadingRecent(true);
    try {
      const { data } = await getRecentUsers(opts);
      setRecent(Array.isArray(data.items) ? data.items : data || []);
    } catch (e) {
      console.warn("No se pudo cargar recientes:", e?.message || e);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const getUser = useCallback(
    async (id) => {
      try {
        const { data } = await getUserById(id);
        const item = data.item || data;
        setSelected(item);
        // también sincronizamos en listas si ya existe
        setItems((prev) => mergeOrAppend(prev, item));
        setRecent((prev) => mergeOrAppend(prev, item));
        return item;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo obtener el usuario"
        );
        throw e;
      }
    },
    [mergeOrAppend]
  );

  // ---- Acciones (optimistas) ----
  const upsertInList = useCallback(
    (updated) => {
      setItems((prev) => mergeOrAppend(prev, updated));
      setRecent((prev) => mergeOrAppend(prev, updated));
      setSelected((prev) =>
        prev?._id === updated._id ? { ...prev, ...updated } : prev
      );
    },
    [mergeOrAppend]
  );

  const updateUserFn = useCallback(
    async (id, payload) => {
      setSaving(true);
      try {
        const clean = { ...payload };
        if (clean.email) clean.email = normalizeEmail(clean.email);
        const { data } = await updateUser(id, clean);
        const updated = data.item || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo actualizar el usuario"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  const changeRole = useCallback(
    async (id, role) => {
      setSaving(true);
      try {
        const { data } = await setUserRole(id, role);
        const updated = data.item || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message || e.message || "No se pudo cambiar el rol"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  const assignCobrador = useCallback(
    async (id, idCobrador) => {
      setSaving(true);
      try {
        const { data } = await setUserCobrador(id, idCobrador);
        const updated = data.item || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo asignar cobrador"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  const assignVendedor = useCallback(
    async (id, idVendedor) => {
      setSaving(true);
      try {
        const { data } = await setUserVendedor(id, idVendedor);
        const updated = data.item || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo asignar vendedor"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  // ⬇️ ya tenías este
  const setCollectorCommission = useCallback(
    async (id, porcentajeCobrador) => {
      setSaving(true);
      try {
        const { data } = await apiSetCollectorCommission(
          id,
          porcentajeCobrador
        );
        const updated = data.item || data.data || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo actualizar la comisión del cobrador"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  // ⬇️ NUEVO: actualizar días de gracia
  const setCollectorCommissionGraceDays = useCallback(
    async (id, graceDays) => {
      setSaving(true);
      try {
        const { data } = await apiSetCollectorCommissionGraceDays(
          id,
          graceDays
        );
        const updated = data.item || data.data || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudieron actualizar los días de gracia"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  // ⬇️ NUEVO: actualizar penalidad por día
  const setCollectorCommissionPenaltyPerDay = useCallback(
    async (id, penaltyPerDay) => {
      setSaving(true);
      try {
        const { data } = await apiSetCollectorCommissionPenaltyPerDay(
          id,
          penaltyPerDay
        );
        const updated = data.item || data.data || data;
        upsertInList(updated);
        return updated;
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "No se pudo actualizar la penalidad diaria"
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [upsertInList]
  );

  // ---- Búsqueda trigger inicial (opcional) ----
  useEffect(() => {
    fetchUsers({ page: 1 });
    fetchRecentUsers({ limit: 10 });
  }, [fetchUsers, fetchRecentUsers]);

  // ---- Expuesto por el Context ----
  const value = useMemo(
    () => ({
      // data
      items,
      total,
      page,
      limit,
      q,
      byId,
      byEmail,
      recent,
      selected,

      // flags
      loading,
      loadingRecent,
      saving,
      error,

      // setters
      setPage,
      setLimit,
      setQ,
      setById,
      setByEmail,
      setSelected,

      // actions
      fetchUsers,
      fetchRecentUsers,
      getUser,
      updateUser: updateUserFn,
      changeRole,
      assignCobrador,
      assignVendedor,
      setCollectorCommission,
      setCollectorCommissionGraceDays,
      setCollectorCommissionPenaltyPerDay,
    }),
    [
      items,
      total,
      page,
      limit,
      q,
      byId,
      byEmail,
      recent,
      selected,
      loading,
      loadingRecent,
      saving,
      error,
      fetchUsers,
      fetchRecentUsers,
      getUser,
      updateUserFn,
      changeRole,
      assignCobrador,
      assignVendedor,
      setCollectorCommission, // 👈 ya estaba
      setCollectorCommissionGraceDays, // 👈 NUEVO
      setCollectorCommissionPenaltyPerDay, // 👈 NUEVO
    ]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export const useUsers = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers debe usarse dentro de <UsersProvider />");
  return ctx;
};
