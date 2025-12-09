// src/api/adminPayments.js
import axios from "./axios";

// Evita cache del navegador
const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * Crear pago desde oficina (rol admin/superAdmin).
 * POST /admin/pagos
 *
 * Ahora soporta:
 *  - strategy: "auto" | "manual"
 *  - breakdown: [{ period: "YYYY-MM", amount: number }] cuando es manual
 *
 * Si no mandás amount, el backend puede usar la cuota vigente
 * o recalcular en base a la estrategia.
 *
 * @param {Object} payload
 * @param {string} payload.clienteId        _id Mongo del miembro (requerido)
 * @param {number} payload.idCliente        N° de grupo (recomendado para validación)
 * @param {number} [payload.amount]         Monto explícito total
 * @param {string} [payload.method]         "efectivo" (default) | "transferencia" | "tarjeta" | "qr" | "otro"
 * @param {string} [payload.channel]        "backoffice" (default)
 * @param {string} [payload.strategy]       "auto" (default) | "manual"
 * @param {Array}  [payload.breakdown]      Solo para strategy="manual":
 *                                         [{ period: "2025-01", amount: 12345 }, ...]
 */
export const createAdminOfficePayment = ({
  clienteId,
  idCliente,
  amount,
  method = "efectivo",
  channel = "backoffice",
  strategy = "auto",
  breakdown,
} = {}) => {
  const body = {
    clienteId,
    idCliente,
    method,
    channel,
    strategy,
  };

  // solo mandamos amount si viene explícito
  if (amount != null) body.amount = amount;

  // solo mandamos breakdown si es un array no vacío
  if (Array.isArray(breakdown) && breakdown.length > 0) {
    body.breakdown = breakdown;
  }

  return axios.post("/admin/pagos", body, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * Listar pagos hechos desde oficina (admin/superAdmin).
 * GET /admin/pagos
 *
 * Params opcionales:
 * - page, limit
 * - q
 * - dateFrom, dateTo (YYYY-MM-DD)
 * - clientId (_id Mongo del cliente)
 * - method, status
 * - sortBy, sortDir
 * - collectorId (si filtrás por idCobrador simbólico)
 */
export const listAdminOfficePayments = (params = {}) => {
  return axios.get("/admin/pagos", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};
