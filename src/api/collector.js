// src/api/collector.js
import axios from "./axios";

// Evita cache del navegador (útil en listados dinámicos)
const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * LISTAR clientes asignados al cobrador autenticado.
 * GET /collector/clientes
 *
 * Soporta búsqueda avanzada si el backend lo implementa:
 *  - byIdCliente
 *  - byDocumento
 *  - q (texto libre)
 *
 * @param {Object} params
 * @param {1|0|boolean} [params.full]            Si es truthy, el backend puede ignorar page/limit y devolver TODO.
 * @param {number} [params.page=1]               Paginación 1-based
 * @param {number} [params.limit=50]             Tamaño de página
 * @param {string} [params.q=""]                 Búsqueda libre
 * @param {number} [params.byIdCliente]          Filtro por N° cliente (grupo)
 * @param {string} [params.byDocumento]          Filtro por documento/DNI (idealmente busca por grupo)
 * @param {string} [params.sortBy="createdAt"]   Campo de orden
 * @param {"asc"|"desc"} [params.sortDir="desc"] Dirección
 * @param {string|number} [params.idCobrador]    (Opcional) forzar idCobrador; normalmente viene de la sesión
 */
export const listCollectorClients = ({
  full,
  page = 1,
  limit = 50,
  q = "",
  sortBy = "createdAt",
  sortDir = "desc",
  idCobrador,
  ...rest // ✅ IMPORTANTÍSIMO: deja pasar byDocumento/byIdCliente/etc.
} = {}) => {
  const params = {
    sortBy,
    sortDir,
    ...rest,
  };

  // Si usás modo "full", lo mandamos y dejamos que el backend decida ignorar page/limit
  if (full) {
    params.full = 1;
  } else {
    params.page = page;
    params.limit = limit;
  }

  // normalizo q si viene
  if (q != null) params.q = String(q || "").trim();

  if (idCobrador != null) params.idCobrador = idCobrador;

  return axios.get("/collector/clientes", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * DETALLE de un cliente (miembro) para cobrador
 * GET /collector/clientes/:id
 */
export const getCollectorClientById = (id) =>
  axios.get(`/collector/clientes/${id}`, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/**
 * ESTADO DE DEUDA por períodos (MVP)
 * GET /collector/clientes/:id/deuda
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
 * LISTAR RECIBOS del cobrador (con fallback).
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
 * CREAR PAGO
 * POST /collector/pagos
 */
export const createCollectorPayment = (payload) =>
  axios.post("/collector/pagos", payload, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/**
 * RESUMEN cobrador
 * GET /collector/summary
 */
export async function getCollectorSummary() {
  return axios.get("/collector/summary", {
    withCredentials: true,
    headers: noStoreHeaders,
  });
}
