// src/api/clientes.js
import axios from "./axios";

// Helpers
const toInt = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
};

const normSortDir = (v) => (String(v).toLowerCase() === "asc" ? "asc" : "desc");

// LISTAR (paginado/orden/búsqueda)
export const listClientes = (params = {}) => {
  const {
    page = 1,
    limit, // preferido
    pageSize, // alias legacy → limit
    q = "",
    sortBy = "createdAt",
    sortDir, // preferido
    order, // alias legacy → sortDir
    ...rest // permite futuros filtros sin romper
  } = params;

  const finalParams = {
    page: toInt(page, 1),
    limit: toInt(pageSize ?? limit ?? 10, 10),
    q: String(q || "").trim(),
    sortBy: String(sortBy || "createdAt"),
    sortDir: normSortDir(order ?? sortDir ?? "desc"),
    ...rest,
  };

  return axios.get("/clientes", { params: finalParams, withCredentials: true });
};

// STATS (agregados globales para dashboard)
export const getClientesStats = (params = {}) =>
  axios.get("/clientes/stats?debug=1", { params, withCredentials: true });

// OBTENER UNO
export function getClienteById(id, opts = {}) {
  const params = {};
  if (opts.expand) params.expand = opts.expand; // 👉 family, all, etc.
  return axios.get(`/clientes/${id}`, { params });
}

// CREAR
export const createCliente = (payload) =>
  axios.post("/clientes", payload, { withCredentials: true });

// ACTUALIZAR
export const updateCliente = (id, payload) =>
  axios.put(`/clientes/${id}`, payload, { withCredentials: true });

// ELIMINAR
export const deleteClienteById = (id) =>
  axios.delete(`/clientes/${id}`, { withCredentials: true });
