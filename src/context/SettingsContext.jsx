// src/context/SettingsContext.jsx  (cambios claves)

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { getPriceRules, updatePriceRules } from "../api/settings";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [priceRules, setPriceRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- NUEVO: guardas anti-loop/StrictMode + TTL de cache ---
  const fetchedRef = useRef(false);
  const cacheAtRef = useRef(0);
  const TTL_MS = 60_000; // 60s

  const load = useCallback(
    async ({ force = false } = {}) => {
      // evita refetch si ya tenemos data reciente
      const fresh = Date.now() - cacheAtRef.current < TTL_MS;
      if (!force && (fetchedRef.current || fresh) && priceRules)
        return priceRules;

      setLoading(true);
      setErr("");
      try {
        const res = await getPriceRules({
          // Desactiva cache del navegador/axios (ver api/settings.js más abajo)
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const data = res?.data?.priceRules ?? res?.data ?? res;
        setPriceRules(data || null);
        fetchedRef.current = true; // ← no vuelvas a pedir en este mount
        cacheAtRef.current = Date.now(); // ← TTL
        return data;
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar settings";
        setErr(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [priceRules]
  );

  useEffect(() => {
    // En StrictMode (dev) los efectos montan 2 veces → guardia evita el doble fetch
    if (!fetchedRef.current) {
      load().catch(() => {});
    }
  }, [load]);

  const save = useCallback(async (next) => {
    setLoading(true);
    setErr("");
    try {
      const res = await updatePriceRules(next);
      const data = res?.data?.priceRules ?? res?.data ?? res;
      setPriceRules(data || null);
      // invalidar/renovar cache local:
      fetchedRef.current = true;
      cacheAtRef.current = Date.now();
      return data;
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo guardar settings";
      setErr(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        priceRules,
        loading,
        err,
        reload: () => load({ force: true }),
        save,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
