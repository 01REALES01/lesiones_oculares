import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); // Podríamos expandir esto con info del usuario real

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: error.response?.data?.detail || "Error de conexión" };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch("http://localhost:8000/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }

    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
