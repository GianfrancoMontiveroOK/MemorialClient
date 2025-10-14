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
