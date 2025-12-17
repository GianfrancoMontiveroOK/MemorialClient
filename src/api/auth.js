import axios from "./axios";

export const registerRequest = (user) => axios.post("/register", user);

export const loginRequest = (user) => axios.post("/login", user);

export const logoutRequest = () => axios.post("/logout");

export const orderRequest = (body) => axios.post("/createorder", body);

export const verifyTokenRequest = () => axios.get("/verify");

export const confirmEmailRequest = (token) =>
  axios.get(`/confirmar-email?token=${token}`);

export const organizerOnboardingRequest = (payload) =>
  axios.post("/socio/alta", payload, {
    withCredentials: true,
    validateStatus: () => true,
  });

// ✅ NUEVO: guardar preferencias (themeMode)
export const setMyPreferencesRequest = (payload) =>
  axios.patch("/me/preferences", payload, {
    withCredentials: true,
    validateStatus: () => true,
  });
