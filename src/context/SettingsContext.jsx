import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchPriceRules, savePriceRules } from "../api/settings";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

/* ================== Normalización & Validación ================== */
/** Convierte cualquier valor a número finito, o devuelve fallback */
const num = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

/** Convierte minMap { "1": "0.75", 2: 1 } → {1:0.75,2:1} con claves numéricas reales */
function normalizeMinMap(map) {
  const out = {};
  if (!map || typeof map !== "object") return out;
  for (const k of Object.keys(map)) {
    const nk = Number(k);
    if (Number.isFinite(nk)) out[nk] = num(map[k], undefined);
  }
  return out;
}

/** Ordena tiers por min DESC y fuerza números: [{min, coef}] */
function normalizeAgeTiers(age) {
  const arr = Array.isArray(age) ? age : [];
  const norm = arr
    .map((t) => ({ min: num(t?.min, 0), coef: num(t?.coef, 1) }))
    .sort((a, b) => (b.min ?? 0) - (a.min ?? 0));
  // elimina duplicados por `min` quedándote con el primero (ya está descendente)
  const seen = new Set();
  return norm.filter((t) =>
    seen.has(t.min) ? false : (seen.add(t.min), true)
  );
}

/** Normaliza todo el objeto de rules del backend */
function normalizePriceRules(rules) {
  const r = rules ?? {};
  const group = r.group ?? {};
  return {
    base: num(r.base, 0),
    group: {
      neutralAt: num(group.neutralAt, 4),
      step: num(group.step, 0.25),
      minMap: normalizeMinMap(group.minMap),
    },
    age: normalizeAgeTiers(r.age),
    cremationCoef: num(r.cremationCoef, 0),
  };
}

/** Chequeo básico de integridad para evitar previews 0 por shape raro */
function validatePriceRules(r) {
  const problems = [];
  if (!(r && typeof r === "object")) problems.push("rules vacío");
  if (!Number.isFinite(r.base) || r.base <= 0) problems.push("base inválida");
  if (!r.group || typeof r.group !== "object") problems.push("group faltante");
  if (!Number.isFinite(r.group?.neutralAt))
    problems.push("group.neutralAt inválido");
  if (!Number.isFinite(r.group?.step)) problems.push("group.step inválido");
  if (!Array.isArray(r.age)) problems.push("age no es array");
  if (!Number.isFinite(r.cremationCoef))
    problems.push("cremationCoef inválido");
  return { ok: problems.length === 0, problems };
}
/* ================================================================ */

/**
 * Contexto EXCLUSIVO para price rules del backend.
 * - GET  /api/settings/price-rules
 * - PUT  /api/settings/price-rules
 * - Cache TTL 60s y guardia StrictMode
 */
export const SettingsProvider = ({ children }) => {
  const [priceRules, setPriceRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // anti-doble-fetch (StrictMode) + cache TTL
  const fetchedRef = useRef(false);
  const cacheAtRef = useRef(0);
  const TTL_MS = 60_000;

  const load = useCallback(
    async ({ force = false } = {}) => {
      const fresh = Date.now() - cacheAtRef.current < TTL_MS;
      if (!force && (fetchedRef.current || fresh) && priceRules)
        return priceRules;

      setLoading(true);
      setErr("");
      try {
        const raw = await fetchPriceRules(); // ← debe devolver lo que responde el endpoint
        const normalized = normalizePriceRules(raw);
        const { ok, problems } = validatePriceRules(normalized);

        if (!ok) {
          const msg = `Price rules incompletas: ${problems.join(", ")}`;
          setErr(msg);
          // igualmente exponemos lo normalizado para que la UI pueda mostrar algo,
          // pero el cálculo quedará en 0 si base=0, etc.
        }

        setPriceRules(normalized);
        fetchedRef.current = true;
        cacheAtRef.current = Date.now();
        return normalized;
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudieron obtener las reglas";
        setErr(msg);
        setPriceRules(null);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [priceRules]
  );

  useEffect(() => {
    if (!fetchedRef.current) {
      load().catch(() => {});
    }
  }, [load]);

  const save = useCallback(async (nextRulesObject) => {
    setLoading(true);
    setErr("");
    try {
      // Acepta { priceRules: {...} } o directamente {...}
      const savedRaw = await savePriceRules(nextRulesObject);
      const normalized = normalizePriceRules(savedRaw);
      const { ok, problems } = validatePriceRules(normalized);
      if (!ok) {
        const msg = `Price rules guardadas con advertencias: ${problems.join(
          ", "
        )}`;
        setErr(msg);
      }
      setPriceRules(normalized);
      fetchedRef.current = true;
      cacheAtRef.current = Date.now();
      return normalized;
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudieron guardar las reglas";
      setErr(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        priceRules, // siempre normalizadas
        loading,
        err, // si hay shape raro lo verás acá
        reload: () => load({ force: true }),
        save,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
