import axios from "axios";

// Define la URL base según el entorno
const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://www.api.memorialsanrafael.com.ar/api" // URL para producción
    : "http://localhost:4001/api"; // URL para desarrollo

const instance = axios.create({
  baseURL,
  withCredentials: true,
});

export default instance;
