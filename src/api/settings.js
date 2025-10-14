// src/api/settings.js
import axios from "./axios";

/**
 * GET /api/settings/price-rules
 * Devuelve el objeto de reglas de precio vigentes.
 * Forma esperada (cualquiera de estas, el front normaliza):
 *  - { priceRules: {...} }
 *  - { data: { priceRules: {...} } }
 *  - { data: {...} }
 *  - {...}
 */
export const getPriceRules = (params = {}) =>
  axios.get("/settings/price-rules", { params, withCredentials: true });

/**
 * PUT /api/settings/price-rules
 * Actualiza las reglas de precio.
 * Enviar como { priceRules: {...} } para mantener forma clara del payload.
 */
export const updatePriceRules = (payload) =>
  axios.put("/settings/price-rules", payload, { withCredentials: true });

/* ================= Opcionales / futuros =================

— Si más adelante exponés endpoints para tareas operativas:

// Recalcular precios para TODOS los grupos (tarea pesada, gated por backend)
export const repriceAllGroups = (body = {}) =>
  axios.post("/settings/reprice-all", body, { withCredentials: true });

// Recalcular sólo grupos con cuotaIdeal = 0/null (fix puntual)
export const fixZeroPricing = (body = {}) =>
  axios.post("/settings/fix-zero-pricing", body, { withCredentials: true });

// Recalcular a partir de edades normalizadas (age.fix) + reprice
export const fixAgesAndReprice = (body = {}) =>
  axios.post("/settings/age-fix-reprice", body, { withCredentials: true });

*/
