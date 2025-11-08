// src/api/outbox.js
import axios from "./axios";

const noStoreHeaders = { "Cache-Control": "no-cache" };

/**
 * GET /api/admin/outbox
 * Lista eventos con filtros/paginación/orden.
 */
export const listAdminOutbox = ({
  page = 1,
  limit = 25,
  q = "",
  status,
  topic,
  dateFrom,
  dateTo,
  sortBy = "createdAt",
  sortDir = "desc",
} = {}) => {
  const params = { page, limit, q, sortBy, sortDir };
  if (status) params.status = status;
  if (topic) params.topic = topic;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  return axios.get("/admin/outbox", {
    params,
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * POST /api/admin/outbox/:id/requeue
 * Reintenta un evento (setea pending / attempts=0).
 */
export const requeueOutboxOne = (id) => {
  return axios.post(`/admin/outbox/${id}/requeue`, null, {
    withCredentials: true,
    headers: noStoreHeaders,
  });
};

/**
 * POST /api/admin/outbox/requeue
 * Reintenta múltiples eventos { ids: [] }.
 */
export const requeueOutboxBulk = (ids = []) => {
  return axios.post(
    "/admin/outbox/requeue",
    { ids },
    { withCredentials: true, headers: noStoreHeaders }
  );
};

export default {
  listAdminOutbox,
  requeueOutboxOne,
  requeueOutboxBulk,
};
