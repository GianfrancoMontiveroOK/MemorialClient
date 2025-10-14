import axios from "./axios";

export const getDashboardData = (config = {}) =>
  axios.get("/dashboard", config);
export const getAdminStats = (config = {}) =>
  axios.get("/dashboard/admin", config);
export const getCollectorStats = (config = {}) =>
  axios.get("/dashboard/cobrador", config);
