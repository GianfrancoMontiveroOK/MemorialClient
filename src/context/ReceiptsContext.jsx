import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { listReceipts } from "../api/receipts";

const ReceiptsContext = createContext(null);

// util: comparación shallow para evitar re-renders y loops
function shallowEqual(a = {}, b = {}) {
  if (a === b) return true;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function ReceiptsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 25,
    q: "",
    dateFrom: "",
    dateTo: "",
    method: "",
    status: "",
    sortBy: "postedAt",
    sortDir: "desc",
    onlyWithPdf: true,
  });

  // guardamos una ref con la última versión para leer en refresh estable
  const filtersRef = useRef(filters);
  const setFiltersSafe = useCallback((next) => {
    if (!shallowEqual(filtersRef.current, next)) {
      filtersRef.current = next;
      setFilters(next);
    }
  }, []);

  // refresh ESTABLE (deps vacías). Lee filtros desde filtersRef.
  const refresh = useCallback(
    async (over = {}) => {
      setLoading(true);
      try {
        const current = filtersRef.current;
        const params = { ...current, ...over };

        const res = await listReceipts(params);
        const ok = res?.ok ?? true;
        const rows = res?.items ?? [];
        const t = res?.total ?? 0;

        if (ok) {
          setItems(Array.isArray(rows) ? rows : []);
          setTotal(Number.isFinite(t) ? t : 0);
          setFiltersSafe(params); // solo actualiza si realmente cambió
        }
      } finally {
        setLoading(false);
      }
    },
    [setFiltersSafe]
  );

  const value = useMemo(
    () => ({
      items,
      total,
      loading,
      filters,
      setFilters: setFiltersSafe,
      refresh,
    }),
    [items, total, loading, filters, refresh, setFiltersSafe]
  );

  return (
    <ReceiptsContext.Provider value={value}>
      {children}
    </ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const ctx = useContext(ReceiptsContext);
  if (!ctx) throw new Error("useReceipts must be used within ReceiptsProvider");
  return ctx;
}

// default export para imports inconsistentes
export default ReceiptsProvider;
