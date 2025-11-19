// src/api/arqueos.js
import axios from "./axios";

/** Evita cache del navegador en listados que cambian seguido */
const noStoreHeaders = { "Cache-Control": "no-cache" };

/* ========================= Helpers ========================= */

/**
 * Normaliza accountCodes para query/body (?accountCodes=A,B,C)
 * - Acepta array o string.
 * - Devuelve undefined si no hay valores válidos.
 */
function packAccountCodes(accountCodes) {
  if (Array.isArray(accountCodes)) {
    const joined = accountCodes.filter(Boolean).map(String).join(",");
    return joined || undefined;
  }
  if (typeof accountCodes === "string") {
    const trimmed = accountCodes.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Construye objeto excluyendo claves vacías/undefined/null
 */
function makeParams(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

/* ========================= Endpoints ======================== */

/**
 * Lista las “cajas” (arqueos) agregadas por usuario.
 * GET /admin/arqueos/usuarios
 */
export function listArqueosUsuarios({
  page = 1,
  limit = 25,
  q = "",
  dateFrom,
  dateTo,
  accountCodes,
  sortBy = "totalBalance",
  sortDir = "desc",
} = {}) {
  const params = makeParams({
    page,
    limit,
    q,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    accountCodes: packAccountCodes(accountCodes),
  });

  return axios.get("/admin/arqueos/usuarios", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/**
 * Drill-down de movimientos de caja para un usuario.
 * GET /admin/arqueos/usuarios/detalle
 */
export function getArqueoUsuarioDetalle({
  userId,
  idCobrador,
  page = 1,
  limit = 25,
  sortBy = "postedAt",
  sortDir = "desc",
  dateFrom,
  dateTo,
  side, // "debit" | "credit"
  accountCodes,
} = {}) {
  const params = makeParams({
    userId,
    idCobrador:
      typeof idCobrador !== "undefined" ? String(idCobrador) : undefined,
    page,
    limit,
    sortBy,
    sortDir,
    dateFrom,
    dateTo,
    side: side === "debit" || side === "credit" ? side : undefined,
    accountCodes: packAccountCodes(accountCodes),
  });

  return axios.get("/admin/arqueos/usuarios/detalle", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/**
 * Crea un “arqueo/corte” manual de caja para un usuario (acción de Admin).
 * POST /admin/arqueos/usuarios/arqueo
 *
 * Acepta opcionalmente:
 *  - idCobrador (compat/legacy)
 *  - accountCodes (string o array) para acotar las cuentas consideradas
 */
export function crearArqueoUsuario({
  userId,
  idCobrador,
  dateFrom,
  dateTo,
  note,
  accountCodes, // opcional: "CAJA_COBRADOR,A_RENDIR_COBRADOR" o ["CAJA_COBRADOR","A_RENDIR_COBRADOR"]
} = {}) {
  const data = makeParams({
    userId,
    idCobrador:
      typeof idCobrador !== "undefined" ? String(idCobrador) : undefined,
    dateFrom,
    dateTo,
    note,
    accountCodes: packAccountCodes(accountCodes),
  });

  return axios.post("/admin/arqueos/usuarios/arqueo", data, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/**
 * Lista “Clientes del cobrador” (vista Admin para un userId).
 * GET /admin/arqueos/usuarios/clientes
 */
export function listArqueoUsuarioClientes({
  userId,
  idCobrador,
  page = 1,
  limit = 25,
  q = "",
  sortBy = "createdAt",
  sortDir = "desc",
  full, // opcional: 1 para traer todo (JSON)
} = {}) {
  const params = makeParams({
    userId,
    idCobrador:
      typeof idCobrador !== "undefined" ? String(idCobrador) : undefined,
    page,
    limit,
    q,
    sortBy,
    sortDir,
    full: full ? "1" : undefined,
  });

  return axios.get("/admin/arqueos/usuarios/clientes", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/* =============== Export CSV (completo desde backend) =============== */
/**
 * Descarga CSV con TODOS los clientes del cobrador.
 * GET /admin/arqueos/usuarios/clientes-csv
 * - Usa responseType: 'blob' para forzar descarga.
 * - Respeta filtros básicos (q, sortBy, sortDir).
 */
export async function downloadArqueoUsuarioClientesCSV({
  userId,
  idCobrador,
  ...rest
} = {}) {
  const params = {
    ...(userId ? { userId } : {}),
    ...(idCobrador != null ? { idCobrador: String(idCobrador) } : {}),
    full: "1", // por si lo usás para otras variantes
    ...rest,
  };
  const resp = await axios.get("/admin/arqueos/usuarios/clientes-csv", {
    params,
    withCredentials: true,
    responseType: "blob",
    headers: { "Cache-Control": "no-cache" },
  });
  const url = URL.createObjectURL(resp.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes_cobrador_${idCobrador ?? userId ?? "export"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ========= NUEVAS RUTAS: Caja chica / Caja grande ========== */

/**
 * Depósito a CAJA_CHICA (admin sobre sí mismo o superAdmin sobre un admin)
 * POST /admin/caja/chica/deposito
 */
export function depositoCajaChica({
  adminUserId,
  amount,
  currency = "ARS",
  note = "",
} = {}) {
  const data = makeParams({ adminUserId, amount, currency, note });
  return axios.post("/admin/caja/chica/deposito", data, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/**
 * Ingreso a CAJA_GRANDE (superAdmin mueve desde CAJA_CHICA de un admin)
 * POST /admin/caja/grande/ingreso
 */
export function ingresoCajaGrande({
  fromAdminUserId,
  amount,
  currency = "ARS",
  note = "",
  toSuperAdminUserId, // opcional: por si el vault owner es otro SA
} = {}) {
  const data = makeParams({
    fromAdminUserId,
    amount,
    currency,
    note,
    toSuperAdminUserId,
  });
  return axios.post("/admin/caja/grande/ingreso", data, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
}

/**
 * Extracción desde CAJA_GRANDE hacia CAJA_SUPERADMIN (billetera del SA)
 * POST /admin/caja/grande/extraccion
 */
export function extraccionCajaGrande({
  amount,
  currency = "ARS",
  note = "",
  superAdminUserId, // opcional
} = {}) {
  const data = makeParams({ amount, currency, note, superAdminUserId });
  return axios.post("/admin/caja/grande/extraccion", data, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
}
// ...
export function getGlobalCajasBalance({ dateFrom, dateTo } = {}) {
  const params = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  return axios.get("/admin/arqueos/global-cajas-balance", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
}
// NUEVO: totales GLOBAL(ES) por accountCodes (ej: "CAJA_CHICA" o "CAJA_GRANDE")
export function getArqueoGlobalTotals({ accountCodes, dateFrom, dateTo } = {}) {
  const params = {};
  if (accountCodes) params.accountCodes = accountCodes;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  return axios.get("/admin/arqueos/global-totals", {
    params,
    withCredentials: true,
    headers: { "Cache-Control": "no-cache" },
  });
}
/* ========================= Exports útiles =================== */
export const __arqueosUtils = { packAccountCodes, makeParams };
