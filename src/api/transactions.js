// src/api/transactions.js
import axios from "./axios";

const noStoreHeaders = { "Cache-Control": "no-cache" };

// ➜ Listado para cobrador autenticado (filtra por su cartera)
export const listCollectorPayments = ({
  page = 1,
  limit = 10,
  q = "",
  dateFrom,
  dateTo,
  clientId,
  method,
  status,
  sortBy = "postedAt",
  sortDir = "desc",
} = {}) => {
  const params = { page, limit, q, sortBy, sortDir };
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

// ➜ Listado para SuperAdmin/Admin (todos los pagos)
export const listAdminPayments = ({
  page = 1,
  limit = 10,
  q = "",
  dateFrom,
  dateTo,
  clientId,
  method,
  status,
  sortBy = "postedAt",
  sortDir = "desc",
} = {}) => {
  const params = { page, limit, q, sortBy, sortDir };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (clientId) params.clientId = clientId;
  if (method) params.method = method;
  if (status) params.status = status;

  // Backend: app.use("/api/adminTransactions", adminTransactionsRoutes)
  // -> endpoint real: /api/adminTransactions/transactions
  return axios.get("/adminTransactions/transactions", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/* ========= NUEVO: importaciones bancarias (Naranja / Banco Nación) ========= */

/**
 * Importa un archivo TXT de Naranja (DAR/DAF).
 * Espera que el backend tenga POST /api/adminTransactions/import-naranja
 * con campo "file" (multer).
 */
export const importNaranjaResultFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/adminTransactions/import-naranja", formData, {
    withCredentials: true,
    headers: {
      ...noStoreHeaders,
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Importa un archivo TXT de Banco Nación.
 * Espera que el backend tenga POST /api/adminTransactions/import-bna
 * con campo "file".
 */
export const importBancoNacionResultFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/adminTransactions/import-bna", formData, {
    withCredentials: true,
    headers: {
      ...noStoreHeaders,
      "Content-Type": "multipart/form-data",
    },
  });
};
