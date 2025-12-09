import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  getClienteById,
  createCliente,
  updateCliente,
  deleteClienteById,
  listClientes as listClientesApi,
  getClientesStats,
} from "../api/clientes";

const ClientsContext = createContext(null);

export const useClients = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used inside ClientsProvider");
  return ctx;
};

// ----- Utils -----
const pickItem = (resp) => {
  const root = resp?.data ?? resp;
  return root?.data ?? root;
};

// ⚠️ NUEVO esquema: si usarCuotaIdeal === true => usar cuotaIdeal.
// Si no, usar histórica (cuota). Sin pisadas.
const computeCuotaVigenteLocal = (it) => {
  const usarIdeal = !!it?.usarCuotaIdeal;
  const ideal = Number(it?.cuotaIdeal);
  const historica = Number(it?.cuota);

  if (usarIdeal && Number.isFinite(ideal)) return ideal;
  if (Number.isFinite(historica)) return historica;
  return 0;
};

const ensurePricingFields = (it) =>
  it && typeof it === "object" && it.cuotaVigente == null
    ? { ...it, cuotaVigente: computeCuotaVigenteLocal(it) }
    : it;

// ==================== Provider ====================
export const ClientsProvider = ({ children }) => {
  // detalle
  const [current, setCurrent] = useState(null);

  // listado / filtros
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [q, setQ] = useState("");

  // estados
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // stats globales
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // safe setState tras unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const safeSet = (setter) => (v) => {
    if (mounted.current) setter(v);
  };

  const setLoadingSafe = safeSet(setLoading);
  const setErrSafe = safeSet(setErr);
  const setCurrentSafe = safeSet(setCurrent);
  const setItemsSafe = safeSet(setItems);
  const setTotalSafe = safeSet(setTotal);
  const setPageSafe = safeSet(setPage);
  const setPageSizeSafe = safeSet(setPageSize);
  const setSortBySafe = safeSet(setSortBy);
  const setSortDirSafe = safeSet(setSortDir);
  const setQSafe = safeSet(setQ);
  const setStatsSafe = safeSet(setStats);
  const setLoadingStatsSafe = safeSet(setLoadingStats);

  // último query para refresh()
  const lastQueryRef = useRef(null);

  // ------ LIST ------
  const list = useCallback(
    async ({
      page: p = page,
      limit = pageSize,
      q: qArg = q,
      sortBy: sb = sortBy,
      sortDir: sd = sortDir,
      ...rest
    } = {}) => {
      setLoadingSafe(true);
      setErrSafe("");
      try {
        lastQueryRef.current = {
          page: p,
          limit,
          q: qArg,
          sortBy: sb,
          sortDir: sd,
          ...rest,
        };

        const res = await listClientesApi({
          page: p,
          limit,
          q: qArg,
          sortBy: sb,
          sortDir: sd,
          ...rest,
        });
        const root = res?.data ?? res;

        const nextItems = (Array.isArray(root?.items) ? root.items : []).map(
          ensurePricingFields
        );
        const nextTotal = Number.isFinite(root?.total)
          ? root.total
          : Number(root?.total) || nextItems.length;

        setItemsSafe(nextItems);
        setTotalSafe(nextTotal);
        setPageSafe(Number(root?.page) || p);
        setPageSizeSafe(Number(root?.pageSize) || limit);
        setSortDirSafe(root?.sortDir || sd);
        setSortBySafe(root?.sortBy || sb);
        setQSafe(qArg);

        return { ...root, items: nextItems, total: nextTotal };
      } catch (e) {
        setErrSafe(
          e?.response?.data?.message || e?.message || "Error al listar"
        );
        setItemsSafe([]); // ← no romper UI
        setTotalSafe(0);
        throw e;
      } finally {
        setLoadingSafe(false);
      }
    },
    [page, pageSize, q, sortBy, sortDir]
  );

  // ------ STATS ------
  const fetchStats = useCallback(async (params = {}) => {
    setLoadingStatsSafe(true);
    setErrSafe("");
    try {
      const res = await getClientesStats(params);
      const pickStats = (r) => {
        const a = r?.data ?? r;
        if (a?.data && (a?.data.summary || a?.data.byCobrador)) return a.data;
        if (a?.summary || a?.byCobrador) return a;
        if (a?.data?.data) return a.data.data;
        return null;
      };
      const data = pickStats(res);
      if (!data)
        throw new Error("Respuesta de /clientes/stats vacía o inesperada");
      setStatsSafe(data);
      return data;
    } catch (e) {
      setErrSafe(
        e?.response?.data?.message ||
          e?.message ||
          "Error al cargar estadísticas"
      );
      setStatsSafe(null);
      throw e;
    } finally {
      setLoadingStatsSafe(false);
    }
  }, []);

  // ------ REFRESH ------
  const refresh = useCallback(async () => {
    const last = lastQueryRef.current || {
      page,
      limit: pageSize,
      q,
      sortBy,
      sortDir,
    };
    return list(last);
  }, [list, page, pageSize, q, sortBy, sortDir]);

  // ------ FAMILY BY GROUP ------
  const loadFamilyByGroup = useCallback(async (idCliente) => {
    if (idCliente === undefined || idCliente === null) return [];
    setErrSafe("");

    const n = Number(idCliente);
    if (!Number.isFinite(n)) return [];

    try {
      const res = await listClientesApi({
        page: 1,
        limit: 9999,
        sortBy: "nombre",
        sortDir: "asc",
        byIdCliente: n,
      });
      const root = res?.data ?? res;
      let arr = Array.isArray(root?.items) ? root.items : [];
      arr = arr.filter((x) => Number(x?.idCliente) === n);

      const seen = new Set();
      arr = arr.filter((x) => {
        const key = String(x?._id || "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return arr.map(ensurePricingFields);
    } catch {
      return [];
    }
  }, []);

  // ------ CRUD detalle ------
  const loadOne = useCallback(
    async (id, opts = {}) => {
      setLoadingSafe(true);
      setErrSafe("");
      try {
        // Por defecto, queremos groupInfo + family
        const optExpand = opts.hasOwnProperty("expand")
          ? String(opts.expand)
          : "family,debt";

        const res = await getClienteById(id, { expand: optExpand });
        const root = res?.data ?? res; // payload crudo del backend ({data, family, __groupInfo, __debt, ...})

        const rawData = root?.data ?? root;
        if (!rawData?._id) throw new Error("Cliente no encontrado");

        // ✅ Tomar groupInfo si viene
        const groupInfo =
          root?.__groupInfo ||
          rawData?.__groupInfo ||
          root?.groupInfo ||
          rawData?.groupInfo ||
          null;

        // ✅ Tomar __debt si viene del backend
        const debtInfo =
          root?.__debt ||
          rawData?.__debt ||
          root?.debt ||
          rawData?.debt ||
          null;

        const dataWithPricing = ensurePricingFields(rawData);

        const expandOpt = String(optExpand).toLowerCase();
        const wantsFamily =
          expandOpt === "family" ||
          expandOpt === "all" ||
          (expandOpt && expandOpt.split(",").includes("family"));

        let familyArr = null;

        if (wantsFamily && rawData?.idCliente !== undefined) {
          if (Array.isArray(root?.family) && root.family.length) {
            familyArr = root.family.map(ensurePricingFields);
          } else {
            familyArr = await loadFamilyByGroup(rawData.idCliente);
          }
        }

        // Cliente enriquecido (lo que va a `current`)
        const enrichedData = {
          ...dataWithPricing,
        };

        if (groupInfo) {
          enrichedData.groupInfo = groupInfo;
          enrichedData.__groupInfo = groupInfo;
        }
        if (Array.isArray(familyArr)) {
          enrichedData.__family = familyArr;
        }
        if (debtInfo) {
          enrichedData.__debt = debtInfo; // 👈 ACA metemos la deuda en el item
        }

        // Payload que devolvemos a quien llama (ClienteDetalle, etc.)
        const result = {
          ...root,
          data: enrichedData,
        };
        if (Array.isArray(familyArr)) {
          result.family = familyArr;
        }
        if (groupInfo) {
          result.__groupInfo = groupInfo;
        }
        if (debtInfo) {
          result.__debt = debtInfo;
        }

        setCurrentSafe(enrichedData);
        return result;
      } catch (e) {
        setErrSafe(
          e?.response?.data?.message || e?.message || "Error al cargar"
        );
        setCurrentSafe(null);
        throw e;
      } finally {
        setLoadingSafe(false);
      }
    },
    [loadFamilyByGroup]
  );

  const createOne = useCallback(async (payload) => {
    setLoadingSafe(true);
    setErrSafe("");
    try {
      const res = await createCliente(payload);
      return ensurePricingFields(pickItem(res));
    } catch (e) {
      setErrSafe(e?.response?.data?.message || e?.message || "Error al crear");
      throw e;
    } finally {
      setLoadingSafe(false);
    }
  }, []);

  const updateOne = useCallback(async (id, payload) => {
    setLoadingSafe(true);
    setErrSafe("");
    try {
      const res = await updateCliente(id, payload);
      const item = ensurePricingFields(pickItem(res));

      setCurrentSafe((prev) => {
        if (!prev) return item;
        const same =
          prev._id === item?._id ||
          (prev.idCliente &&
            item?.idCliente &&
            prev.idCliente === item.idCliente);

        // preservamos family y groupInfo si no vinieron en la respuesta
        const preservedFamily = Array.isArray(prev?.__family)
          ? prev.__family
          : undefined;
        const preservedGroupInfo =
          prev?.groupInfo || prev?.__groupInfo || undefined;

        const merged = same
          ? ensurePricingFields({
              ...prev,
              ...item,
              groupInfo: item.groupInfo || preservedGroupInfo,
            })
          : item;

        if (
          preservedFamily &&
          (!merged.__family || merged.__family.length === 0)
        ) {
          merged.__family = preservedFamily.map(ensurePricingFields);
        }
        if (preservedGroupInfo && !merged.__groupInfo) {
          merged.__groupInfo = preservedGroupInfo;
        }
        return merged;
      });

      return item;
    } catch (e) {
      setErrSafe(
        e?.response?.data?.message || e?.message || "Error al actualizar"
      );
      throw e;
    } finally {
      setLoadingSafe(false);
    }
  }, []);

  const deleteOne = useCallback(async (id) => {
    setLoadingSafe(true);
    setErrSafe("");
    try {
      const res = await deleteClienteById(id);
      const root = res?.data ?? res;
      return root?.ok === false ? { ok: false } : { ok: true };
    } catch (e) {
      setErrSafe(
        e?.response?.data?.message || e?.message || "Error al eliminar"
      );
      throw e;
    } finally {
      setLoadingSafe(false);
    }
  }, []);

  return (
    <ClientsContext.Provider
      value={{
        // detalle
        current,
        setCurrent: setCurrentSafe,

        // listado/paginación
        items,
        total,
        page,
        pageSize,
        sortBy,
        sortDir,
        q,

        // estados
        loading,
        err,
        setErr: setErrSafe,

        // acciones
        list,
        refresh,
        loadOne,
        createOne,
        updateOne,
        deleteOne,

        // helpers
        loadFamilyByGroup,

        // stats
        stats,
        loadingStats,
        fetchStats,

        // setters expuestos (opcional)
        setPage: setPageSafe,
        setPageSize: setPageSizeSafe,
        setSortBy: setSortBySafe,
        setSortDir: setSortDirSafe,
        setQ: setQSafe,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
};
