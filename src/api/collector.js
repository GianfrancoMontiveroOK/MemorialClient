// src/api/collector.js
import axios from "./axios";

// Headers opcionales para evitar respuestas 304 del navegador
const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * LISTAR clientes asignados al cobrador (server-side, filtrado por idCobrador)
 * GET /collector/clientes
 *
 * @param {Object} params
 * @param {number} [params.page=1]       - Paginación 1-based (backend)
 * @param {number} [params.limit=10]     - Tamaño de página
 * @param {string} [params.q=""]         - Búsqueda (nombre, idCliente)
 * @param {string} [params.sortBy]       - Campo de orden (default: "idCliente")
 * @param {"asc"|"desc"} [params.sortDir="asc"] - Dirección
 * @param {string|number} params.idCobrador - ID de cobrador a filtrar
 */
export const listCollectorClients = ({
  page = 1,
  limit = 10,
  q = "",
  sortBy = "idCliente",
  sortDir = "asc",
  idCobrador,
} = {}) => {
  const params = { page, limit, q, sortBy, sortDir };
  if (idCobrador != null) params.idCobrador = idCobrador;

  return axios.get("/collector/clientes", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * OBTENER UN CLIENTE (solo lectura, para cobradores)
 * GET /collector/clientes/:id
 *
 * @param {string} id - _id de Mongo del cliente
 */
export const getCollectorClienteById = (id) =>
  axios.get(`/collector/clientes/${id}`, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/**
 * REGISTRAR COBRO (opcional, cuando tengas backend)
 * POST /collector/pagos
 *
 * payload sugerido:
 * {
 *   monto: number,
 *   fecha: "yyyy-mm-dd",
 *   metodo: "efectivo" | "transferencia" | "tarjeta",
 *   referencia?: string,
 *   observaciones?: string,
 *   clienteId: string, // _id de Mongo
 *   idCliente?: number // id legado (opcional)
 * }
 */
export const createCollectorPayment = (payload) =>
  axios.post("/collector/pagos", payload, {
    withCredentials: true,
    headers: noStoreHeaders,
  });

/* 
⚠️ Intencionalmente NO exponemos create/update/delete de clientes aquí,
porque el rol “cobrador” no debe modificar el CRM. Si en el futuro hubiera
acciones acotadas (p.ej. marcar visita, dejar nota), agregamos endpoints
específicos como /collector/visitas o /collector/notas.
*/
