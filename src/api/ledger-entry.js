// src/api/ledger-entry.js
import axios from "./axios";

const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * Listado de líneas de libro mayor (admin/superAdmin)
 * Devuelve: { ok, items, total, page, pageSize, sortBy, sortDir, stats }
 *
 * Filtros soportados (opcionales):
 * - q
 * - dateFrom, dateTo  (YYYY-MM-DD)
 * - side              ("debit" | "credit")
 * - account / accountCode  (alias → se envía como accountCode)
 * - currency
 * - idCobrador, idCliente     (Number)
 * - minAmount, maxAmount      (Number)
 * - method, status            (del Payment)
 * - includePayment            (Boolean -> "1"|"0")
 * - sortBy, sortDir           (por defecto postedAt desc)
 */
export const listAdminLedgerEntries = async ({
  page = 1,
  limit = 25, // FE usa "limit" → BE "pageSize"
  q = "",
  dateFrom,
  dateTo,
  side,
  account,
  accountCode, // alias de account
  currency,
  idCobrador,
  idCliente,
  minAmount,
  maxAmount,
  method,
  status,
  includePayment = false, // Boolean → "1" si true
  sortBy = "postedAt",
  sortDir = "desc",
} = {}) => {
  // Mapear nombres al backend
  const params = {
    page,
    pageSize: limit, // ⬅️ traducido
    q,
    sortBy,
    sortDir,
  };

  // Rango de fechas
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  // Filtros de ledger
  if (side) params.side = side;
  if (account || accountCode) params.accountCode = account || accountCode; // ⬅️ traducido
  if (currency) params.currency = currency;
  if (Number.isFinite(idCobrador)) params.idCobrador = idCobrador;
  if (Number.isFinite(idCliente)) params.idCliente = idCliente;
  if (Number.isFinite(minAmount)) params.minAmount = minAmount;
  if (Number.isFinite(maxAmount)) params.maxAmount = maxAmount;

  // Filtros por Payment / proyección
  if (method) params.method = method;
  if (status) params.status = status;
  if (includePayment) params.includePayment = "1"; // ⬅️ normalizado

  const res = await axios.get("/admin/ledger-entries", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });

  // Normalizar stats: array → objeto { [currency]: {...} }
  const data = res?.data || {};
  const statsArr = Array.isArray(data.statsByCurrency)
    ? data.statsByCurrency
    : [];
  const statsObj = statsArr.reduce((acc, row) => {
    acc[row.currency] = {
      lines: row.lines || 0,
      debit: row.debits ?? row.debit ?? 0,
      credit: row.credits ?? row.credit ?? 0,
      net: row.net ?? 0,
    };
    return acc;
  }, {});

  return {
    ...res,
    data: {
      ...data,
      stats: statsObj, // ⬅️ lo que espera AuditSection.jsx
    },
  };
};

export default {
  listAdminLedgerEntries,
};
