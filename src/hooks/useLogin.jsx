"use client";
import { useState } from "react";

const useLogin = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setCargando(true);
    setError(null);

    try {
      const response = await fetch(
        "https://mock.apidog.com/m1/1188124-1182752-default/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Credenciales incorrectas");
      }

      const data = await response.json();
      setCargando(false);
      return data;
    } catch (err) {
      setError(err.message);
      setCargando(false);
      return null;
    }
  };

  return { login, cargando, error };
};

export default useLogin;
