// src/context/CollectorContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  listCollectorClients,
  getCollectorClientById,
  getCollectorClientDebt, // deuda por períodos
  listCollectorPayments as apiListPayments,
  listCollectorReceipts as apiListReceipts, // ⬅️ NUEVO
  createCollectorPayment,
} from "../api/collector";

const CollectorContext = createContext(null);

export const useCollector = () => {
  const ctx = useContext(CollectorContext);
  if (!ctx)
    throw new Error("useCollector must be used inside <CollectorProvider />");
  return ctx;
};

/* -------------------- helpers de normalización -------------------- */
/* -------------------- helpers de normalización -------------------- */
const pickList = (resp) => {
  const root = resp?.data ?? resp ?? {};
  const payload = root?.data && !Array.isArray(root.data) ? root.data : root;

  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = Number.isFinite(payload.total)
    ? Number(payload.total)
    : items.length;

  // ⬅️ AHORA tomamos page y pageSize del backend si vienen
  const page = Number.isFinite(payload.page) ? Number(payload.page) : 1;
  const pageSize = Number.isFinite(payload.pageSize)
    ? Number(payload.pageSize)
    : items.length;

  const sortBy = payload.sortBy || "createdAt";
  const sortDir = payload.sortDir === "asc" ? "asc" : "desc";

  return { items, total, page, pageSize, sortBy, sortDir };
};

/* -------------------- helpers de pricing -------------------- */
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

const ensurePricingFields = (it) => {
  if (!it || typeof it !== "object") return it;
  if (it.cuotaVigente == null) {
    return { ...it, cuotaVigente: computeCuotaVigenteLocal(it) };
  }
  return it;
};

// idempotencyKey simple para cobros
const makeIdem = () =>
  `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const CollectorProvider = ({
  children,
  collectorId,
  createPaymentFn, // opcional: override externo
}) => {
  // listado
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // paginación (ya no se usa para el listado principal, se mantiene por compatibilidad)
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(-1); // -1 => mostrar todo en la UI

  // búsqueda/orden
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // flags
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // selección (detalle)
  const [selected, setSelected] = useState(null); // legacy
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState([]);

  // deuda por períodos (cliente seleccionado)
  const [debtLoading, setDebtLoading] = useState(false);
  const [debt, setDebt] = useState([]); // periods[]
  const [debtSummary, setDebtSummary] = useState(null);
  const [debtMeta, setDebtMeta] = useState(null);

  // pagos del cobrador
  const [payments, setPayments] = useState([]);
  const [paymentsStats, setPaymentsStats] = useState(null);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsLimit, setPaymentsLimit] = useState(25);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // recibos del cobrador (⬅️ NUEVO)
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  // debug id
  const ctxIdRef = useRef(Math.random().toString(36).slice(2));
  const ctxId = ctxIdRef.current;

  // safe setState
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const safe = (setter) => (v) => {
    if (mounted.current) setter(v);
  };
  const setItemsSafe = safe(setItems);
  const setTotalSafe = safe(setTotal);
  const setLoadingSafe = safe(setLoading);
  const setSavingSafe = safe(setSaving);
  const setErrSafe = safe(setErr);
  const setSelectedSafe = safe(setSelected);
  const setSelectedClientSafe = safe(setSelectedClient);
  const setSelectedFamilySafe = safe(setSelectedFamily);
  const setDebtLoadingSafe = safe(setDebtLoading);
  const setDebtSafe = safe(setDebt);
  const setDebtSummarySafe = safe(setDebtSummary);
  const setDebtMetaSafe = safe(setDebtMeta);
  const setPaymentsSafe = safe(setPayments);
  const setPaymentsStatsSafe = safe(setPaymentsStats);
  const setPaymentsLoadingSafe = safe(setPaymentsLoading);
  const setReceiptsSafe = safe(setReceipts);
  const setReceiptsLoadingSafe = safe(setReceiptsLoading);

  // record último query para refresh
  const lastQueryRef = useRef(null);

  /* -------------------- fetch listado (CON paginación server-side) -------------------- */
  const fetchClientsByCollector = useCallback(
    async ({
      page: pageArg, // backend 1-based
      limit: limitArg,
      q: query = q,
      sortBy: sb = sortBy,
      sortDir: sd = sortDir,
      byIdCliente,
      byDocumento,
    } = {}) => {
      setLoadingSafe(true);
      setErrSafe("");

      try {
        const pageNum = Number.isFinite(pageArg) ? Number(pageArg) : page + 1; // page state es 0-based
        const limitNum =
          Number.isFinite(limitArg) && limitArg > 0
            ? Number(limitArg)
            : limit > 0
            ? limit
            : 25;

        const params = {
          page: pageNum,
          limit: limitNum,
          sortBy: sb || "createdAt",
          sortDir: sd === "asc" ? "asc" : "desc",
          ...(collectorId != null ? { idCobrador: collectorId } : {}),
        };

        const qTrim = String(query ?? "").trim();
        if (qTrim) params.q = qTrim;
        if (Number.isFinite(byIdCliente)) params.byIdCliente = byIdCliente;
        if (byDocumento) params.byDocumento = String(byDocumento);

        // para refresh
        lastQueryRef.current = params;

        const resp = await listCollectorClients(params);
        const {
          items: inItems,
          total: inTotal,
          page: respPage,
          pageSize: respPageSize,
          sortBy: respSortBy,
          sortDir: respSortDir,
        } = pickList(resp);

        const outItems = inItems.map((r, i) => {
          const id =
            r.id ?? (r._id ? String(r._id) : r.idCliente ?? `row-${i}`);
          return ensurePricingFields({ id, ...r });
        });

        setItemsSafe(outItems);
        setTotalSafe(Number(inTotal) || outItems.length);

        // actualizamos estado de paginación/orden en el contexto
        setPage((respPage || 1) - 1); // guardamos 0-based
        setLimit(respPageSize || limitNum);
        setSortBy(respSortBy || "createdAt");
        setSortDir(respSortDir === "asc" ? "asc" : "desc");

        return {
          items: outItems,
          total: Number(inTotal) || outItems.length,
          page: respPage || pageNum,
          pageSize: respPageSize || limitNum,
        };
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
    [collectorId, q, sortBy, sortDir, page, limit]
  );

  // carga inicial / cada cambio de q, sortBy, sortDir
  useEffect(() => {
    fetchClientsByCollector({ q, sortBy, sortDir });
  }, [q, sortBy, sortDir, fetchClientsByCollector]);

  /* -------------------- fetch detalle -------------------- */
  const fetchCollectorClientById = useCallback(async (id) => {
    if (!id) return null;
    setLoadingSafe(true);
    setErrSafe("");
    try {
      const resp = await getCollectorClientById(id);
      const root = resp?.data ?? resp ?? {};
      const data = root?.data || root?.cliente || null;
      const family = Array.isArray(root?.family) ? root.family : [];

      const clientOut = data ? ensurePricingFields(data) : null;
      const familyOut = family.map(ensurePricingFields);

      setSelectedClientSafe(clientOut);
      setSelectedFamilySafe(familyOut);

      return { client: clientOut, family: familyOut };
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Error al obtener el cliente";
      setErrSafe(msg);
      setSelectedClientSafe(null);
      setSelectedFamilySafe([]);
      return null;
    } finally {
      setLoadingSafe(false);
    }
  }, []);

  /* -------------------- deuda por períodos (cliente) -------------------- */
  const fetchCollectorClientDebt = useCallback(async (id, params = {}) => {
    if (!id) return null;
    setDebtLoadingSafe(true);
    setErrSafe("");
    try {
      const resp = await getCollectorClientDebt(id, params);
      const root = resp?.data ?? resp ?? {};
      // backend: { ok, clientId, currency, periods, summary, meta }
      const periods = Array.isArray(root?.periods) ? root.periods : [];
      const summary = root?.summary ?? null;
      const meta = root?.meta ?? null;

      setDebtSafe(periods);
      setDebtSummarySafe(summary);
      setDebtMetaSafe(meta);

      return { periods, summary, meta };
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Error al obtener deuda del cliente";
      setErrSafe(msg);
      setDebtSafe([]);
      setDebtSummarySafe(null);
      setDebtMetaSafe(null);
      return null;
    } finally {
      setDebtLoadingSafe(false);
    }
  }, []);

  /* -------------------- listado de pagos del cobrador -------------------- */
  const fetchCollectorPayments = useCallback(
    async ({
      page = paymentsPage,
      limit = paymentsLimit,
      q,
      dateFrom,
      dateTo,
      clientId,
      method,
      status,
      sortBy = "postedAt",
      sortDir = "desc",
    } = {}) => {
      setPaymentsLoadingSafe(true);
      setErrSafe("");
      try {
        const resp = await apiListPayments({
          page: (Number.isInteger(page) ? page : 0) + 1, // backend 1-based
          limit,
          q,
          dateFrom,
          dateTo,
          clientId,
          method,
          status,
          sortBy,
          sortDir,
        });
        const root = resp?.data ?? resp ?? {};
        const items = Array.isArray(root?.items) ? root.items : [];
        const stats = root?.stats || null;

        setPaymentsSafe(items);
        setPaymentsStatsSafe(stats);
        return { items, stats };
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Error al listar pagos del cobrador";
        setErrSafe(msg);
        setPaymentsSafe([]);
        setPaymentsStatsSafe(null);
        return { items: [], stats: null };
      } finally {
        setPaymentsLoadingSafe(false);
      }
    },
    [paymentsPage, paymentsLimit]
  );

  /* -------------------- listado de recibos del cobrador (⬅️ NUEVO) -------------------- */
  const fetchCollectorReceipts = useCallback(
    async ({
      page = 0,
      limit = 10,
      q,
      dateFrom,
      dateTo,
      clientId,
      sortBy = "createdAt",
      sortDir = "desc",
    } = {}) => {
      setReceiptsLoadingSafe(true);
      setErrSafe("");
      try {
        const resp = await apiListReceipts({
          page: (Number.isInteger(page) ? page : 0) + 1, // backend 1-based
          limit,
          q,
          dateFrom,
          dateTo,
          clientId,
          sortBy,
          sortDir,
        });
        const root = resp?.data ?? resp ?? {};
        const items = Array.isArray(root?.items) ? root.items : [];
        const total = Number(root?.total) || items.length;

        setReceiptsSafe(items);
        return { items, total };
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Error al listar recibos del cobrador";
        setErrSafe(msg);
        setReceiptsSafe([]);
        return { items: [], total: 0 };
      } finally {
        setReceiptsLoadingSafe(false);
      }
    },
    []
  );

  /* -------------------- crear cobro simple (MVP compatible) -------------------- */
  const createPayment = useCallback(
    async (client, payload) => {
      setSavingSafe(true);
      setErrSafe("");
      try {
        if (typeof createPaymentFn === "function") {
          const res = await createPaymentFn(client, payload);
          return res?.data ?? res ?? { ok: true };
        }
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

  /* -------------------- cobro extendido: AUTO y MANUAL -------------------- */
  const payAuto = useCallback(
    async (
      clienteId,
      { amount, method = "efectivo", notes = "", collectedAt } = {}
    ) => {
      setSavingSafe(true);
      setErrSafe("");
      try {
        const payload = {
          clienteId,
          amount, // si no viene, el backend usa cuotaVigente
          method,
          idempotencyKey: makeIdem(),
          channel: "field",
          notes,
          strategy: "auto",
          ...(collectedAt ? { collectedAt } : {}),
        };
        const resp = await createCollectorPayment(payload);
        const root = resp?.data ?? resp ?? {};
        if (!root?.ok) {
          const msg = root?.message || "No se pudo registrar el cobro";
          setErrSafe(msg);
          return { ok: false, message: msg };
        }
        if (selectedClient?._id === clienteId) {
          try {
            await fetchCollectorClientById(clienteId);
            await fetchCollectorClientDebt(clienteId);
          } catch {}
        }
        return root; // { ok, data: { payment, receipt, ... } }
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo registrar el cobro";
        setErrSafe(msg);
        return { ok: false, message: msg };
      } finally {
        setSavingSafe(false);
      }
    },
    [selectedClient, fetchCollectorClientById, fetchCollectorClientDebt]
  );

  const payManual = useCallback(
    async (
      clienteId,
      breakdown, // [{ period:"YYYY-MM", amount:Number }]
      { amount, method = "efectivo", notes = "", collectedAt } = {}
    ) => {
      setSavingSafe(true);
      setErrSafe("");
      try {
        const payload = {
          clienteId,
          amount,
          method,
          idempotencyKey: makeIdem(),
          channel: "field",
          notes,
          strategy: "manual",
          breakdown: Array.isArray(breakdown) ? breakdown : [],
          ...(collectedAt ? { collectedAt } : {}),
        };
        const resp = await createCollectorPayment(payload);
        const root = resp?.data ?? resp ?? {};
        if (!root?.ok) {
          const msg = root?.message || "No se pudo registrar el cobro";
          setErrSafe(msg);
          return { ok: false, message: msg };
        }
        if (selectedClient?._id === clienteId) {
          try {
            await fetchCollectorClientById(clienteId);
            await fetchCollectorClientDebt(clienteId);
          } catch {}
        }
        return root;
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo registrar el cobro (manual)";
        setErrSafe(msg);
        return { ok: false, message: msg };
      } finally {
        setSavingSafe(false);
      }
    },
    [selectedClient, fetchCollectorClientById, fetchCollectorClientDebt]
  );

  // Cobro “one-click”
  const chargeSelected = useCallback(async () => {
    if (!selectedClient?._id) {
      setErrSafe("No hay cliente seleccionado para cobrar.");
      return { ok: false, message: "Sin cliente seleccionado" };
    }
    return payAuto(selectedClient._id, { method: "efectivo" });
  }, [selectedClient, payAuto]);

  /* -------------------- refresh listado -------------------- */
  const refresh = useCallback(async () => {
    const p = lastQueryRef.current;
    if (!p) {
      // si nunca se buscó nada, hacemos un load default
      return fetchClientsByCollector({});
    }
    return fetchClientsByCollector(p);
  }, [fetchClientsByCollector]);

  const value = {
    // debug
    ctxId,

    // data listado
    items,
    total,
    page,
    limit,
    q,

    // selección/detalle
    selected,
    selectedClient,
    selectedFamily,

    // orden
    sortBy,
    sortDir,

    // flags
    loading,
    saving,
    err,

    // deuda por períodos
    debtLoading,
    debt,
    debtSummary,
    debtMeta,

    // pagos/recibos del cobrador
    payments,
    paymentsStats,
    paymentsLoading,
    receipts, // ⬅️ NUEVO
    receiptsLoading, // ⬅️ NUEVO
    paymentsPage,
    paymentsLimit,
    setPaymentsPage,
    setPaymentsLimit,

    // setters
    setPage,
    setLimit,
    setQ,
    setSelected: setSelectedSafe,
    setSelectedClient: setSelectedClientSafe,
    setSelectedFamily: setSelectedFamilySafe,
    setErr: setErrSafe,
    setSortBy,
    setSortDir,

    // acciones
    fetchClientsByCollector,
    fetchCollectorClientById,
    fetchCollectorClientDebt,
    fetchCollectorPayments,
    fetchCollectorReceipts, // ⬅️ NUEVO
    refresh,

    // cobros
    createPayment, // wrapper opcional legacy
    chargeSelected, // one-click (AUTO)
    payAuto, // AUTO FIFO
    payManual, // MANUAL con breakdown
  };

  return (
    <CollectorContext.Provider value={value}>
      {children}
    </CollectorContext.Provider>
  );
};
