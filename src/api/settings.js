// src/api/settings.js
import axios from "./axios";

/** Util: desanidar y normalizar la respuesta posible del backend */
function unwrap(resp) {
  const data = resp?.data ?? resp ?? {};
  const rules =
    data.rules ??
    data.priceRules ??
    data.data?.rules ??
    data.data?.priceRules ??
    data;
  return rules;
}

/** Util: extraer mensaje de error del backend */
function pickApiError(err, fallback = "Error de red") {
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;
  const code = err?.response?.data?.code || err?.code || null;
  const status = err?.response?.status || null;
  const details = err?.response?.data || null;
  const e = new Error(msg);
  e.code = code;
  e.status = status;
  e.details = details;
  return e;
}

/**
 * GET /api/settings/price-rules
 * Devuelve SIEMPRE un objeto normalizado de reglas.
 */
export async function fetchPriceRules(params = {}) {
  const resp = await axios.get("/settings/price-rules", {
    params,
    withCredentials: true,
  });
  return unwrap(resp);
}

/**
 * PUT /api/settings/price-rules
 * Acepta: { priceRules: {...} } o directamente {...}
 * Devuelve el objeto de reglas efectivo (normalizado).
 */
export async function savePriceRules(payload) {
  const body =
    payload && payload.priceRules ? payload : { priceRules: payload ?? {} };

  const resp = await axios.put("/settings/price-rules", body, {
    withCredentials: true,
  });
  return unwrap(resp);
}

// alias compat
export const getPriceRules = (params) =>
  axios.get("/settings/price-rules", { params, withCredentials: true });
export const updatePriceRules = (payload) =>
  axios.put("/settings/price-rules", payload, { withCredentials: true });

/* =========================================================
 * ✅ Import DB (3 XLS/XLSX): clientes + grupos + nacion
 * POST multipart/form-data (NORMAL)
 * ========================================================= */

const IMPORT_ENDPOINT = "/settings/clients-db/import-xlsx";

/**
 * Importa 3 archivos.
 *
 * Params:
 * - clientes, grupos, nacion: File
 * - replace: boolean (si true => replace / soft-bajas)
 * - stopOnError: boolean (default true)
 * - onProgress: (pct: number) => void
 * - signal: AbortController.signal
 * - timeoutMs: default 30 min
 *
 * Devuelve: data JSON del backend (no axios response)
 */
export async function importClientsDbXlsx({
  clientes,
  grupos,
  nacion,
  replace = false,
  stopOnError = true,
  onProgress,
  signal,
  timeoutMs = 30 * 60 * 1000,
} = {}) {
  if (!clientes || !grupos || !nacion) {
    throw new Error("Faltan archivos: clientes, grupos y nacion (XLS/XLSX).");
  }

  const fd = new FormData();
  fd.append("clientes", clientes);
  fd.append("grupos", grupos);
  fd.append("nacion", nacion);

  // flags
  fd.append("replace", String(!!replace));
  fd.append("stopOnError", String(!!stopOnError));

  try {
    const resp = await axios.post(IMPORT_ENDPOINT, fd, {
      withCredentials: true,
      signal,
      timeout: timeoutMs,
      // ✅ NO seteamos headers: axios pone boundary correcto
      onUploadProgress: (evt) => {
        if (!onProgress) return;
        const total = Number(evt?.total || 0);
        const loaded = Number(evt?.loaded || 0);
        if (total > 0) onProgress(Math.round((loaded * 100) / total));
      },
    });

    return resp?.data;
  } catch (err) {
    throw pickApiError(err, "Error importando XLSX");
  }
}

// alias
export const importClientsDatabaseXlsx = importClientsDbXlsx;
