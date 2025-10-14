// src/context/AuthContext.jsx
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  registerRequest,
  loginRequest,
  verifyTokenRequest,
  logoutRequest,
  confirmEmailRequest,
} from "../api/auth";

const AuthContext = createContext();

// Hook de acceso al contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ========================
   *   FUNCIONES DE AUTENTICACIÓN
   * ======================== */

  // Registro (no inicia sesión automáticamente)
  const signup = async (payload) => {
    try {
      const res = await registerRequest(payload);
      return res?.data;
    } catch (error) {
      const err = error?.response?.data;
      if (Array.isArray(err)) setErrors(err);
      else if (typeof err === "string") setErrors([err]);
      else if (err?.message) setErrors([err.message]);
      else setErrors(["Error en registro"]);
      return false;
    }
  };

  // Inicio de sesión
  const signin = async (credentials) => {
    setLoading(true);
    try {
      const res = await loginRequest(credentials);
      if (res.status === 200 && res.data?.user) {
        setIsAuthenticated(true);
        setUser(res.data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setErrors([res.data?.message || "Error de inicio de sesión"]);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setErrors([error?.response?.data?.message || "Error de inicio de sesión"]);
    } finally {
      setLoading(false);
    }
  };

  // Cierre de sesión
  const logout = async () => {
    setLoading(true);
    try {
      await logoutRequest();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      setErrors([error?.response?.data?.message || "Error al cerrar sesión"]);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar email de registro
  const confirmEmail = useCallback(async (token) => {
    try {
      const res = await confirmEmailRequest(token);
      if (res.status === 200 && res.data) {
        return {
          ok: true,
          message: res.data?.message || "Email confirmado correctamente",
        };
      }
      return {
        ok: false,
        message: res.data?.message || "No se pudo confirmar el email",
      };
    } catch {
      return { ok: false, message: "Error de red" };
    }
  }, []);

  /* ========================
   *   EFECTOS
   * ======================== */

  // Limpieza automática de errores
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 10000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Verificación de sesión al montar
  useEffect(() => {
    const checkLogin = async () => {
      setLoading(true);
      try {
        const res = await verifyTokenRequest();
        if (res.status === 200 && res.data) {
          setIsAuthenticated(true);
          setUser(res.data);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        errors,
        signup,
        signin,
        logout,
        confirmEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
