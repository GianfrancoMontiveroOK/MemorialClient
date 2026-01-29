// src/context/SettingsContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchPriceRules,
  savePriceRules,
  importClientsDatabaseXlsx, // import normal (axios)
} from "../api/settings";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

/* ================== Normalización & Validación ================== */
const num = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

function normalizeMinMap(map) {
  const out = {};
  if (!map || typeof map !== "object") return out;
  for (const k of Object.keys(map)) {
    const nk = Number(k);
    if (Number.isFinite(nk)) out[nk] = num(map[k], undefined);
  }
  return out;
}

function normalizeAgeTiers(age) {
  const arr = Array.isArray(age) ? age : [];
  const norm = arr
    .map((t) => ({ min: num(t?.min, 0), coef: num(t?.coef, 1) }))
    .sort((a, b) => (b.min ?? 0) - (a.min ?? 0));

  const seen = new Set();
  return norm.filter((t) =>
    seen.has(t.min) ? false : (seen.add(t.min), true)
  );
}

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

export const SettingsProvider = ({ children }) => {
  const [priceRules, setPriceRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

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
        const raw = await fetchPriceRules();
        const normalized = normalizePriceRules(raw);
        const { ok, problems } = validatePriceRules(normalized);

        if (!ok) setErr(`Price rules incompletas: ${problems.join(", ")}`);

        setPriceRules(normalized);
        fetchedRef.current = true;
        cacheAtRef.current = Date.now();
        setLastLoadedAt(new Date().toISOString());
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
    if (!fetchedRef.current) load().catch(() => {});
  }, [load]);

  const save = useCallback(async (nextRulesObject) => {
    setLoading(true);
    setErr("");
    try {
      const savedRaw = await savePriceRules(nextRulesObject);
      const normalized = normalizePriceRules(savedRaw);
      const { ok, problems } = validatePriceRules(normalized);

      if (!ok) {
        setErr(
          `Price rules guardadas con advertencias: ${problems.join(", ")}`
        );
      }

      setPriceRules(normalized);
      fetchedRef.current = true;
      cacheAtRef.current = Date.now();
      setLastSavedAt(new Date().toISOString());
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

  /**
   * ✅ Importar base (NORMAL / axios)
   * - Progreso solo de upload (onProgress)
   * - Sin stream
   * - Devuelve siempre JSON (data)
   */
  const importClientsDbXlsx = useCallback(
    async ({
      clientes,
      grupos,
      nacion,
      replace = false,
      stopOnError = true,
      onProgress,
      signal,
    } = {}) => {
      setErr("");
      try {
        if (!clientes || !grupos || !nacion) {
          const e = new Error(
            "Faltan archivos: se requieren clientes, grupos y nacion (XLS/XLSX)."
          );
          e.code = "MISSING_FILES";
          throw e;
        }

        // ⚠️ Compat: por si tu API vieja devolvía axios response
        const resp = await importClientsDatabaseXlsx({
          clientes,
          grupos,
          nacion,
          replace,
          stopOnError,
          onProgress,
          signal,
        });

        const data = resp?.data ?? resp; // soporta ambos
        return data;
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo importar la base de datos";
        setErr(msg);
        throw e;
      }
    },
    []
  );

  return (
    <SettingsContext.Provider
      value={{
        priceRules,
        loading,
        err,
        reload: () => load({ force: true }),
        save,
        hasRemote: !!priceRules,
        lastLoadedAt,
        lastSavedAt,

        // import db
        importClientsDbXlsx,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
