// src/context/CollectorContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { listCollectorClients } from "../api/collector";

const CollectorContext = createContext(null);

export const useCollector = () => {
  const ctx = useContext(CollectorContext);
  if (!ctx)
    throw new Error("useCollector must be used inside <CollectorProvider />");
  return ctx;
};

// Normaliza payload de lista
const pickList = (resp) => {
  const root = resp?.data ?? resp ?? {};
  const payload = root?.data && !Array.isArray(root.data) ? root.data : root;

  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = Number.isFinite(payload.total)
    ? payload.total
    : typeof payload.total === "string"
    ? Number(payload.total)
    : items.length;

  const page = Number(payload.page) || 1;
  const pageSize = Number(payload.pageSize || payload.limit) || 10;

  // opcional: respetar sort si viene en la respuesta
  const sortBy = payload.sortBy || "createdAt";
  const sortDir = payload.sortDir === "asc" ? "asc" : "desc";

  return { items, total, page, pageSize, sortBy, sortDir };
};

/* ====================== Helpers de pricing (fallback UI) ====================== */
// ✅ calcula cuotaVigente si el backend no la trae
const computeCuotaVigenteLocal = (it) => {
  const usarPisada = !!it?.usarCuotaPisada && it?.cuotaPisada != null;
  const pisadaNum =
    typeof it?.cuotaPisada === "number"
      ? it.cuotaPisada
      : Number(it?.cuotaPisada);
  const idealNum =
    typeof it?.cuotaIdeal === "number" ? it.cuotaIdeal : Number(it?.cuotaIdeal);
  if (usarPisada && Number.isFinite(pisadaNum)) return pisadaNum;
  if (Number.isFinite(idealNum)) return idealNum;
  const cuotaNum = typeof it?.cuota === "number" ? it.cuota : Number(it?.cuota);
  return Number.isFinite(cuotaNum) ? cuotaNum : 0;
};

// ✅ asegura que cada item tenga cuotaVigente
const ensurePricingFields = (it) => {
  if (!it || typeof it !== "object") return it;
  if (it.cuotaVigente == null) {
    return { ...it, cuotaVigente: computeCuotaVigenteLocal(it) };
  }
  return it;
};

export const CollectorProvider = ({
  children,
  collectorId,
  createPaymentFn,
}) => {
  // Estado listado
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Paginación (UI 0-based)
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // Búsqueda
  const [q, setQ] = useState("");

  // Orden
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  // Flags
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Selección
  const [selected, setSelected] = useState(null);

  // 🔧 Fix StrictMode: asegurar mounted=true en mount, false en cleanup
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Helper para setState seguro post-unmount
  const safe = (setter) => (v) => {
    if (mounted.current) setter(v);
  };

  const setItemsSafe = safe(setItems);
  const setTotalSafe = safe(setTotal);
  const setLoadingSafe = safe(setLoading);
  const setSavingSafe = safe(setSaving);
  const setErrSafe = safe(setErr);
  const setSelectedSafe = safe(setSelected);

  // Debug id de contexto
  const ctxIdRef = useRef(Math.random().toString(36).slice(2));
  const ctxId = ctxIdRef.current;

  // Guardamos el último query para refresh()
  const lastQueryRef = useRef(null);

  // Fetch principal
  const fetchClientsByCollector = useCallback(
    async ({
      page: uiPage = page,
      limit: uiLimit = limit,
      q: query = q,
      sortBy: sb = sortBy,
      sortDir: sd = sortDir,
    } = {}) => {
      setLoadingSafe(true);
      setErrSafe("");
      try {
        // backend 1-based
        const params = {
          page: (Number.isInteger(uiPage) ? uiPage : 0) + 1,
          limit: Number.isInteger(uiLimit) ? uiLimit : 10,
          q: String(query ?? "").trim(),
          sortBy: sb || "createdAt",
          sortDir: sd === "asc" ? "asc" : "desc",
          ...(collectorId != null ? { idCobrador: collectorId } : {}),
        };

        lastQueryRef.current = params;

        const resp = await listCollectorClients(params);
        const { items: inItems, total: inTotal } = pickList(resp);

        // ✅ asegurar id y cuotaVigente para UI
        let outItems = inItems.map((r, i) => {
          const id =
            r.id ??
            (r._id ? String(r._id) : r.idCliente ?? `${params.page}-${i}`);
          return ensurePricingFields({ id, ...r });
        });

        // ✅ si el backend todavía no ordena por cuotaVigente, podés forzar client-side:
        // if (params.sortBy === "cuotaVigente") {
        //   outItems = [...outItems].sort((a, b) =>
        //     (params.sortDir === "asc" ? 1 : -1) *
        //     ((a.cuotaVigente ?? 0) - (b.cuotaVigente ?? 0))
        //   );
        // }

        setItemsSafe(outItems);
        setTotalSafe(Number(inTotal) || outItems.length);

        // opcional: log
        // console.log("[CollectorContext] set items", {
        //   ctxId,
        //   len: outItems.length,
        //   total: Number(inTotal) || outItems.length,
        //   first: outItems[0],
        // });

        return { items: outItems, total: Number(inTotal) || outItems.length };
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Error al listar";
        setErrSafe(msg);
        setItemsSafe([]);
        setTotalSafe(0);
        return { items: [], total: 0 };
      } finally {
        setLoadingSafe(false);
      }
    },
    [collectorId, page, limit, q, sortBy, sortDir]
  );

  // Refresh con los últimos parámetros usados
  const refresh = useCallback(async () => {
    const p = lastQueryRef.current ?? {
      page: page + 1,
      limit,
      q,
      sortBy,
      sortDir,
      ...(collectorId != null ? { idCobrador: collectorId } : {}),
    };
    return fetchClientsByCollector({
      page: (p.page ?? 1) - 1, // volver a 0-based para el arg
      limit: p.limit,
      q: p.q,
      sortBy: p.sortBy,
      sortDir: p.sortDir,
    });
  }, [fetchClientsByCollector, page, limit, q, sortBy, sortDir, collectorId]);

  // Hacé el fetch en el Provider (reactivo a page/limit/q/sort)
  useEffect(() => {
    fetchClientsByCollector({ page, limit, q, sortBy, sortDir });
  }, [page, limit, q, sortBy, sortDir, fetchClientsByCollector]);

  const createPayment = useCallback(
    async (client, payload) => {
      setSavingSafe(true);
      setErrSafe("");
      try {
        if (typeof createPaymentFn === "function") {
          const res = await createPaymentFn(client, payload);
          return res?.data ?? res ?? { ok: true };
        }
        // Mock si no hay fn
        // console.log("[CollectorContext] createPayment (mock)", { client, payload });
        return { ok: true };
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo registrar el cobro";
        setErrSafe(msg);
        throw e;
      } finally {
        setSavingSafe(false);
      }
    },
    [createPaymentFn]
  );

  const value = {
    // debug
    ctxId,

    // data
    items,
    total,
    page,
    limit,
    q,
    selected,

    // orden
    sortBy,
    sortDir,

    // flags
    loading,
    saving,
    err,

    // setters
    setPage,
    setLimit,
    setQ,
    setSelected: setSelectedSafe,
    setErr: setErrSafe,
    setSortBy,
    setSortDir,

    // actions
    fetchClientsByCollector,
    refresh,
    createPayment,
  };

  return (
    <CollectorContext.Provider value={value}>
      {children}
    </CollectorContext.Provider>
  );
};
