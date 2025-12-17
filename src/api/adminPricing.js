// src/api/adminPricing.js
import axios from "./axios";

/**
 * POST /api/admin/reprice/:idCliente
 * Recalcula 'cuotaIdeal' para un grupo.
 */
export function repriceGroup(idCliente) {
  if (idCliente == null || String(idCliente).trim() === "") {
    throw new Error("idCliente requerido");
  }
  return axios.post(`/admin/reprice/${encodeURIComponent(idCliente)}`, null, {
    withCredentials: true,
  });
}

/**
 * POST /api/admin/reprice-all
 * Opcional body: { concurrency?: number, logEvery?: number }
 */
export function repriceAll(body = {}) {
  return axios.post("/admin/reprice-all", body, { withCredentials: true });
}

/**
 * GET /api/admin/reprice-progress
 * Devuelve progreso global del último proceso (all/byIds/percent, etc).
 */
export function getRepriceProgress() {
  return axios.get("/admin/reprice-progress", { withCredentials: true });
}

/**
 * POST /api/admin/reprice-by-ids
 * Body: { ids: Array<string|number>, concurrency?: number, logEvery?: number }
 */
export function repriceByIds(ids = [], opts = {}) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Se requiere 'ids' (array no vacío)");
  }
  return axios.post(
    "/admin/reprice-by-ids",
    { ids, ...opts },
    { withCredentials: true }
  );
}

/**
 * POST /api/admin/increase-percent
 * Body:
 * {
 *   percent: number,
 *   applyToIdeal: boolean,
 *   applyToHistorical: boolean
 * }
 */
export function increasePercent({
  percent,
  applyToIdeal = true,
  applyToHistorical = false,
} = {}) {
  const p = Number(percent);
  if (!Number.isFinite(p) || p === 0) {
    throw new Error("percent debe ser un número distinto de cero");
  }
  if (!applyToIdeal && !applyToHistorical) {
    throw new Error("Debe seleccionar al menos un tipo de precio a actualizar");
  }
  return axios.post(
    "/admin/increase-percent",
    {
      percent: p,
      applyToIdeal: !!applyToIdeal,
      applyToHistorical: !!applyToHistorical,
    },
    { withCredentials: true }
  );
}
