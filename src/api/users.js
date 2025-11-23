// src/api/users.js
import axios from "./axios";

export const getUsers = (params) => axios.get("/users", { params });

export const getRecentUsers = (params) =>
  axios.get("/users/recent", { params });

export const getUserById = (id) => axios.get(`/users/${id}`);

export const updateUser = (id, payload) => axios.put(`/users/${id}`, payload);

export const setUserRole = (id, role) =>
  axios.patch(`/users/${id}/role`, { role });

export const setUserCobrador = (id, idCobrador) =>
  axios.patch(`/users/${id}/cobrador`, { idCobrador });

export const setUserVendedor = (id, idVendedor) =>
  axios.patch(`/users/${id}/vendedor`, { idVendedor });

/**
 * ⬇️ COMISIONES DE COBRADOR
 * Endpoints:
 *  - PATCH /users/:id/collector-commission
 *  - PATCH /users/:id/collector-commission-grace-days
 *  - PATCH /users/:id/collector-commission-penalty
 */

// Porcentaje de comisión (ej: 5, 7.5, etc.)
export const setCollectorCommission = (id, collectorCommissionPct) =>
  axios.patch(`/users/${id}/collector-commission`, {
    collectorCommissionPct,
  });

// Días de gracia para rendir el dinero
export const setCollectorCommissionGraceDays = (id, graceDays) =>
  axios.patch(`/users/${id}/collector-commission-grace-days`, {
    graceDays,
  });

// Penalización por día de demora
export const setCollectorCommissionPenaltyPerDay = (id, penaltyPerDay) =>
  axios.patch(`/users/${id}/collector-commission-penalty`, {
    penaltyPerDay,
  });
