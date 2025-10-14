import axios from "./axios";

export const registerRequest = (user) => axios.post("/register", user);

export const loginRequest = (user) => axios.post("/login", user);

export const logoutRequest = (user) => axios.post("/logout", user);

export const orderRequest = (body) => axios.post("/createorder", body);

export const verifyTokenRequest = () => axios.get("/verify");

export const confirmEmailRequest = (token) =>
  axios.get(`/confirmar-email?token=${token}`);



export const organizerOnboardingRequest = (payload) =>
  axios.post("/socio/alta", payload, {
    withCredentials: true,
    validateStatus: () => true,
  });