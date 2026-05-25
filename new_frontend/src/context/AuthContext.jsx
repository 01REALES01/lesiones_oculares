import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      try {
        const me = await authService.me();
        setUser(me);
      } catch (error) {
        console.error("Error cargando usuario:", error);

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        setToken(null);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);

      localStorage.setItem('token', data.access_token);

      setToken(data.access_token);

      const me = await authService.me();
      setUser(me);

      return { success: true };

    } catch (error) {
      console.error("Login Error:", error);

      return {
        success: false,
        error: error.response?.data?.detail || "Error de conexión"
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loadingUser,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
