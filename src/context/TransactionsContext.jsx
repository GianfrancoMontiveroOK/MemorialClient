// src/context/TransactionsContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { listAdminPayments, listCollectorPayments } from "../api/transactions";
import { createCollectorPayment } from "../api/collector"; // opcional (MVP)

/* ============================= Contexto ============================= */

const TransactionsContext = createContext(null);

export const useTransactions = () => {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error(
      "useTransactions must be used inside <TransactionsProvider />"
    );
  }
  return ctx;
};

/* ============================= Helpers ============================== */

// Normaliza payload de lista { ok, items, total, page, pageSize, sortBy, sortDir }
const pickList = (resp) => {
  const root = resp?.data ?? resp ?? {};
  const items = Array.isArray(root.items) ? root.items : [];
  const total = Number.isFinite(root.total) ? root.total : items.length;
  const page = Number(root.page) || 1; // backend 1-based
  const pageSize = Number(root.pageSize || root.limit) || 10;
  const sortBy = root.sortBy || "postedAt";
  const sortDir = root.sortDir === "asc" ? "asc" : "desc";
  return { items, total, page, pageSize, sortBy, sortDir };
};

/* ============================ Provider ============================== */
/**
 * @param {"admin"|"collector"} scope  Modo de uso. Por defecto "admin" (superAdmin).
 * - "admin": usa /adminTransactions/transactions (todos los pagos).
 * - "collector": usa /collector/pagos (solo cartera del cobrador autenticado).
 */
export function TransactionsProvider({ children, scope = "admin" }) {
  // data
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // paginación (UI 0-based)
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // orden
  const [sortBy, setSortBy] = useState("postedAt");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  // búsqueda y filtros
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState("");
  const [clientId, setClientId] = useState(""); // _id miembro (Mongo)
  const [method, setMethod] = useState(""); // efectivo|transferencia|tarjeta|qr|otro
  const [status, setStatus] = useState(""); // draft|posted|settled|reversed

  // flags
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // selección (opcional)
  const [selected, setSelected] = useState(null);

  // safe state updates
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const safe = (setter) => (v) => mounted.current && setter(v);

  const setItemsSafe = safe(setItems);
  const setTotalSafe = safe(setTotal);
  const setLoadingSafe = safe(setLoading);
  const setSavingSafe = safe(setSaving);
  const setErrSafe = safe(setErr);

  // elegir el fetcher según scope
  const fetchFn =
    scope === "collector" ? listCollectorPayments : listAdminPayments;

  // record del último query para refresh()
  const lastQueryRef = useRef(null);

  /* --------------------- fetch principal --------------------- */
  const fetchPayments = useCallback(
    async ({
      page: uiPage = page,
      limit: uiLimit = limit,
      q: qText = q,
      sortBy: sb = sortBy,
      sortDir: sd = sortDir,
      dateFrom: df = dateFrom,
      dateTo: dt = dateTo,
      clientId: cId = clientId,
      method: m = method,
      status: st = status,
    } = {}) => {
      setLoadingSafe(true);
      setErrSafe("");
      try {
        const params = {
          page: (Number.isInteger(uiPage) ? uiPage : 0) + 1, // backend 1-based
          limit: Number.isInteger(uiLimit) ? uiLimit : 10,
          q: String(qText ?? "").trim(),
          sortBy: sb || "postedAt",
          sortDir: sd === "asc" ? "asc" : "desc",
        };
        if (df) params.dateFrom = df;
        if (dt) params.dateTo = dt;
        if (cId) params.clientId = cId;
        if (m) params.method = m;
        if (st) params.status = st;

        lastQueryRef.current = params;

        const resp = await fetchFn(params);
        const { items: inItems, total: inTotal } = pickList(resp);

        setItemsSafe(inItems);
        setTotalSafe(Number(inTotal) || inItems.length);

        return { items: inItems, total: Number(inTotal) || inItems.length };
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Error al listar pagos";
        setErrSafe(msg);
        setItemsSafe([]);
        setTotalSafe(0);
        return { items: [], total: 0 };
      } finally {
        setLoadingSafe(false);
      }
    },
    [
      fetchFn,
      page,
      limit,
      q,
      sortBy,
      sortDir,
      dateFrom,
      dateTo,
      clientId,
      method,
      status,
    ]
  );

  // auto-fetch cuando cambian parámetros principales
  useEffect(() => {
    fetchPayments({
      page,
      limit,
      q,
      sortBy,
      sortDir,
      dateFrom,
      dateTo,
      clientId,
      method,
      status,
    });
  }, [
    page,
    limit,
    q,
    sortBy,
    sortDir,
    dateFrom,
    dateTo,
    clientId,
    method,
    status,
    fetchPayments,
  ]);

  /* --------------------- refresh --------------------- */
  const refresh = useCallback(async () => {
    const p = lastQueryRef.current ?? {
      page: page + 1,
      limit,
      q,
      sortBy,
      sortDir,
      dateFrom,
      dateTo,
      clientId,
      method,
      status,
    };
    return fetchPayments({
      page: (p.page ?? 1) - 1,
      limit: p.limit,
      q: p.q,
      sortBy: p.sortBy,
      sortDir: p.sortDir,
      dateFrom: p.dateFrom,
      dateTo: p.dateTo,
      clientId: p.clientId,
      method: p.method,
      status: p.status,
    });
  }, [
    fetchPayments,
    page,
    limit,
    q,
    sortBy,
    sortDir,
    dateFrom,
    dateTo,
    clientId,
    method,
    status,
  ]);

  /* --------------------- createPayment (opcional/MVP) --------------------- */
  // Útil si quisieras registrar un cobro desde este contexto (para cobrador).
  const createPayment = useCallback(
    async (payload) => {
      setSavingSafe(true);
      setErrSafe("");
      try {
        const res = await createCollectorPayment(payload);
        // refrescar listado luego de crear
        try {
          await refresh();
        } catch {}
        return res?.data ?? res ?? { ok: true };
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
    [refresh]
  );

  /* ----------------------- value del contexto ----------------------- */
  const value = {
    // data
    items,
    total,

    // paginación (UI)
    page,
    limit,

    // orden
    sortBy,
    sortDir,

    // filtros
    q,
    dateFrom,
    dateTo,
    clientId,
    method,
    status,

    // flags
    loading,
    saving,
    err,

    // setters
    setPage,
    setLimit,
    setSortBy,
    setSortDir,
    setQ,
    setDateFrom,
    setDateTo,
    setClientId,
    setMethod,
    setStatus,
    setSelected,

    // selección
    selected,

    // acciones
    fetchPayments,
    refresh,
    createPayment, // opcional (para cobradores/MVP)
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}
