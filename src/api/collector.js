// src/api/collector.js
import axios from "./axios";

// Evita cache del navegador (útil en listados dinámicos)
const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * LISTAR clientes asignados al cobrador autenticado.
 * GET /collector/clientes
 *
 * Modo recomendado (sin paginación): usar `full=1` para traer todo y paginar/filtrar en UI.
 *
 * @param {Object} params
 * @param {1|0|boolean} [params.full=1]         Si es truthy, el backend ignora page/limit y devuelve TODO.
 * @param {number} [params.page=1]              Paginación 1-based (solo si full es falsy)
 * @param {number} [params.limit=10]            Tamaño de página (solo si full es falsy)
 * @param {string} [params.q=""]                Búsqueda (nombre, idCliente, domicilio, cp)
 * @param {string} [params.sortBy="createdAt"]  Campo de orden
 *   Valores comunes: "createdAt" | "idCliente" | "nombre" | "ingreso" | "cuota" | "cuotaIdeal" | "updatedAt"
 * @param {"asc"|"desc"} [params.sortDir="desc"] Dirección
 * @param {string|number} [params.idCobrador]   (Opcional) forzar idCobrador; normalmente viene de la sesión
 */
export const listCollectorClients = ({
  full = 1,
  page = 1,
  limit = 10,
  q = "",
  sortBy = "createdAt",
  sortDir = "desc",
  idCobrador,
} = {}) => {
  const params = {
    q,
    sortBy,
    sortDir,
  };

  // Si se especifica idCobrador, lo pasamos.
  if (idCobrador != null) params.idCobrador = idCobrador;

  // Si se pide "full", evitamos enviar page/limit para que el backend devuelva TODO.
  if (full) {
    params.full = 1;
  } else {
    params.page = page;
    params.limit = limit;
  }

  return axios.get("/collector/clientes", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * DETALLE de un cliente (miembro) para cobrador (incluye grupo, proyección segura)
 * GET /collector/clientes/:id
 *
 * @param {string} id - _id de Mongo del miembro (titular o integrante)
 */
export const getCollectorClientById = (id) =>
  axios.get(`/collector/clientes/${id}`, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/**
 * ESTADO DE DEUDA por períodos (MVP)
 * GET /collector/clientes/:id/deuda
 *
 * @param {string} id - _id de Mongo del miembro (requerido)
 * @param {Object} [params]
 * @param {string} [params.from]         Periodo inicial "YYYY-MM" (default: hace ~12 meses)
 * @param {string} [params.to]           Periodo final "YYYY-MM"   (default: mes actual)
 * @param {number} [params.includeFuture=1]  Cantidad de períodos futuros a proyectar
 */
export const getCollectorClientDebt = (id, params = {}) =>
  axios.get(`/collector/clientes/${id}/deuda`, {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });

/**
 * LISTAR PAGOS del cobrador.
 * GET /collector/pagos
 *
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=25]
 * @param {string} [params.q]                 Búsqueda (nombre, idCliente, nro de recibo, externalRef)
 * @param {string} [params.dateFrom]          "YYYY-MM-DD"
 * @param {string} [params.dateTo]            "YYYY-MM-DD"
 * @param {string} [params.clientId]          _id Mongo del miembro
 * @param {string} [params.method]            "efectivo"|"transferencia"|"tarjeta"|"qr"|"otro"
 * @param {string} [params.status]            "draft"|"posted"|"settled"|"reversed"
 * @param {string} [params.sortBy="postedAt"] Campo de orden
 * @param {"asc"|"desc"} [params.sortDir="desc"]
 */
export const listCollectorPayments = ({
  page = 1,
  limit = 25,
  q,
  dateFrom,
  dateTo,
  clientId,
  method,
  status,
  sortBy = "postedAt",
  sortDir = "desc",
} = {}) => {
  const params = { page, limit, sortBy, sortDir };
  if (q) params.q = q;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (clientId) params.clientId = clientId;
  if (method) params.method = method;
  if (status) params.status = status;

  return axios.get("/collector/pagos", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * LISTAR RECIBOS del cobrador (filtrable por cliente).
 * Intentará primero /collector/receipts; si el backend aún no lo expone,
 * hace fallback a /adminReceipts/receipts con los mismos parámetros.
 *
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.q]
 * @param {string} [params.dateFrom]     "YYYY-MM-DD"
 * @param {string} [params.dateTo]       "YYYY-MM-DD"
 * @param {string} [params.clientId]     _id Mongo del miembro
 * @param {string} [params.sortBy="createdAt"]
 * @param {"asc"|"desc"} [params.sortDir="desc"]
 */
export const listCollectorReceipts = async ({
  page = 1,
  limit = 10,
  q,
  dateFrom,
  dateTo,
  clientId,
  sortBy = "createdAt",
  sortDir = "desc",
} = {}) => {
  const params = { page, limit, sortBy, sortDir };
  if (q) params.q = q;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (clientId) params.clientId = clientId;

  try {
    return await axios.get("/collector/receipts", {
      params,
      withCredentials: true,
      headers: noStoreHeaders,
    });
  } catch (err) {
    // fallback transparente si aún no existe el endpoint de cobrador
    if (err?.response?.status === 404) {
      return axios.get("/adminReceipts/receipts", {
        params,
        withCredentials: true,
        headers: noStoreHeaders,
      });
    }
    throw err;
  }
};

/**
 * CREAR PAGO (transaccional: Payment + Ledger + Receipt + Outbox)
 * POST /collector/pagos
 *
 * payload base:
 * {
 *   clienteId: string,                 // _id de Mongo del miembro (requerido)
 *   idCliente?: number,                // (opcional) validación cruzada con el grupo
 *   amount?: number,                   // > 0; si falta, usa cuotaVigente del miembro
 *   method: "efectivo"|"transferencia"|"tarjeta"|"qr"|"otro", // (requerido)
 *   idempotencyKey: string,            // clave única por intento (requerido)
 *   notes?: string,
 *   channel?: "field"|"backoffice"|"portal"|"api",
 *   intendedPeriod?: string,           // ej. "2025-10"
 *   geo?: { lat: number, lng: number },
 *   device?: string,
 *   ip?: string,
 *   externalRef?: string,              // id POS/MP/ERP si aplica
 *   cashSessionId?: string,            // si ya manejás sesiones de caja
 *   collectedAt?: string               // ISO; para forzar postedAt (opcional)
 * }
 *
 * Extensión ETAPA 1.2:
 *  - strategy?: "auto"|"manual" (default "auto")
 *  - breakdown?: Array<{ period: "YYYY-MM", amount: number }> (solo si strategy="manual")
 */
export const createCollectorPayment = (payload) =>
  axios.post("/collector/pagos", payload, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/*
⚠️ No exponemos create/update/delete de clientes aquí porque el rol “cobrador”
no debe modificar el CRM. Para acciones futuras (visitas/notas), usar endpoints
específicos (p.ej. /collector/visitas, /collector/notas).
*/
// ../../api/collector.js (ejemplo)
export async function getCollectorSummary() {
  return axios.get("/collector/summary"); // usando tu instancia de axios
}
