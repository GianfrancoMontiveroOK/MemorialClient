import axios from "axios";

// Define la URL base según el entorno
const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://memorialbackend-btvj.onrender.com/api" // URL para producción
    : "http://localhost:4000/api"; // URL para desarrollo

const instance = axios.create({
  baseURL,
  withCredentials: true,
});

export default instance;
