// src/api/dashboard.js
import axios from "./axios";

const noStoreHeaders = { "Cache-Control": "no-cache" };

export const getDashboardAccess = (config = {}) =>
  axios.get("/dashboard", {
    withCredentials: true,
    headers: noStoreHeaders,
    ...config,
  });
