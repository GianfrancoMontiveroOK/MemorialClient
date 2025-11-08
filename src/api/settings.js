// src/api/settings.js
import axios from "./axios";

/** Util: desanidar y normalizar la respuesta posible del backend */
function unwrap(resp) {
  const data = resp?.data ?? resp ?? {};
  // backend puede responder {ok, rules} ó {priceRules} ó {...}
  const rules =
    data.rules ??
    data.priceRules ??
    data.data?.rules ??
    data.data?.priceRules ??
    data;
  return rules;
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
  // si el caller manda directo {...}, lo envolvemos
  const body =
    payload && payload.priceRules ? payload : { priceRules: payload ?? {} };

  const resp = await axios.put("/settings/price-rules", body, {
    withCredentials: true,
  });
  return unwrap(resp);
}

/* Si preferís mantener también las variantes “planas” */
// alias compat
export const getPriceRules = (params) =>
  axios.get("/settings/price-rules", { params, withCredentials: true });
export const updatePriceRules = (payload) =>
  axios.put("/settings/price-rules", payload, { withCredentials: true });
