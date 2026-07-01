// src/context/AuthContext.jsx
"use client";
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

// src/context/AuthContext.jsx (fragmento)
function normalizeUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.sub || sessionUser.user_id || null, // <-- agregamos id
    nombre: sessionUser.given_name || sessionUser.name || sessionUser.nickname || sessionUser.email,
    apellidos: sessionUser.family_name || "",
    email: sessionUser.email || "",
    picture: sessionUser.picture || null,
    sub: sessionUser.sub || null,
    raw: sessionUser,
  };
}

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarSesion() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setUsuario(null);
          return;
        }
        const data = await res.json();
        if (data.usuario) {
          setUsuario(normalizeUser(data.usuario));
        } else {
          setUsuario(null);
        }
      } catch (err) {
        console.error("Error cargando sesión:", err);
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }
    cargarSesion();
  }, []);

  const login = (usuarioData) => {
    // usado por tu login local (si lo mantienes)
    setUsuario(usuarioData ? normalizeUser(usuarioData) : null);
  };

  const logout = () => {
    // redirige a Auth0 para invalidar la cookie del servidor
    window.location.href = "/auth/logout";
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);